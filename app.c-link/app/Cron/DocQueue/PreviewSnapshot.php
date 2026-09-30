<?php

namespace App\Cron\DocQueue;

use App\Api\Aws\Sns;
use App\Api\Document;
use App\Api\Tender\Enquiry;
use App\DocCreator\DownloadManager\DownloadManagerFactory;
use App\DocCreator\Snapshot\SnapshotDiff;
use App\DocCreator\Snapshot\SnapshotService;
use App\Factory\Shortcodes;
use App\core\Environment;
use Exception;

class PreviewSnapshot
{
    private array $data;

    /**
     * @var array<int, array>|null
     */
    private ?array $previousIssuanceMeta = null;

    public function __construct(array $payload)
    {
        $this->data = $payload;
    }

    /**
     * Numbered documents selected on the document itself, resolved against the
     * global shortcode list rather than the template's own fields.
     *
     * @param array $meta
     * @return array
     */
    public static function numberedDocumentsFromValues(array $meta): array
    {
        $values  = $meta['values'] ?? [];
        $version = (string) ($meta['config']['version'] ?? '1.0');
        $codes   = Shortcodes::getCodes($version);

        $nds = [];
        foreach ($codes as $definition) {
            if (!is_array($definition) || !isset($definition['parent_code'], $definition['reference'])) {
                continue;
            }

            $nd = (string) ($definition['args']['numbered_document'] ?? '');
            if ($nd === '' || !array_key_exists($definition['parent_code'], $values)) {
                continue;
            }

            $parent   = $codes[$definition['parent_code']] ?? [];
            $selected = $values[$definition['parent_code']];
            if (is_numeric($selected) && isset($parent['options'][$selected])) {
                $selected = $parent['options'][$selected];
            }

            if ($selected === ($definition['conditional_value'] ?? 'Yes')) {
                $nds[] = $nd;
            }
        }

        return array_values(array_unique($nds));
    }

    /**
     * Meta of the documents issued for this tender before the one in hand,
     * newest first.
     *
     * @param int $currentDocumentId
     * @return array<int, array>
     */
    private function previousIssuanceMeta(int $currentDocumentId): array
    {
        if ($this->previousIssuanceMeta !== null) {
            return $this->previousIssuanceMeta;
        }

        $this->previousIssuanceMeta = [];

        $projectId = (int) ($this->data['project_id'] ?? 0);
        $tenderId  = (int) ($this->data['tender_id'] ?? 0);

        if (!$projectId || !$tenderId) {
            return $this->previousIssuanceMeta;
        }

        try {
            foreach (Enquiry::getIssuedDocumentIds($projectId, $tenderId) as $documentId) {
                if ($documentId === $currentDocumentId) {
                    continue;
                }

                $document = Document::load($documentId);
                if ($document->hasData()) {
                    $this->previousIssuanceMeta[$documentId] = $document->getMeta();
                }
            }
        } catch (Exception $e) {
            error_log('PreviewSnapshot: could not read the issuances behind this one: ' . $e->getMessage());
        }

        return $this->previousIssuanceMeta;
    }

    /**
     * Numbered documents taken from the last issuance of this tender.
     *
     * @param int $currentDocumentId
     * @return string[]
     */
    private function inheritedNumberedDocuments(int $currentDocumentId): array
    {
        foreach ($this->previousIssuanceMeta($currentDocumentId) as $meta) {
            $nds = self::numberedDocumentsFromValues($meta);
            if ($nds !== []) {
                return $nds;
            }
        }

        return [];
    }

    /**
     * The document the issuance before this one was sent as.
     *
     * @param int $currentDocumentId
     * @return int Zero when this is the first issuance.
     */
    private function baselineDocumentId(int $currentDocumentId): int
    {
        foreach ($this->previousIssuanceMeta($currentDocumentId) as $documentId => $meta) {
            if (SnapshotService::getCompletedSnapshot($meta) !== []) {
                return (int) $documentId;
            }
        }

        return 0;
    }

    /**
     * The snapshot the issuance before this one went out with.
     *
     * @param int $currentDocumentId
     * @return array
     */
    private function baselineSnapshot(int $currentDocumentId): array
    {
        foreach ($this->previousIssuanceMeta($currentDocumentId) as $meta) {
            $snapshot = SnapshotService::getCompletedSnapshot($meta);
            if ($snapshot !== []) {
                return $snapshot;
            }
        }

        return [];
    }

    /**
     * Records what the preview would issue: the comparison, and the metadata
     * that names the issuance.
     *
     * @param int $parentDocumentId
     * @param string $projectReference
     * @param string $packageName
     */
    private function recordPreviewIssuance(int $parentDocumentId, string $projectReference, string $packageName): void
    {
        if (($this->data['mode'] ?? '') !== 'addendum') {
            return;
        }

        try {
            $meta = Document::load($parentDocumentId)->getMeta();
            if (empty($meta['temp_snapshot'])) {
                return;
            }

            $meta['temp_snapshot']['addendum_number'] = Enquiry::getAddendumNumber(
                (int) ($this->data['project_id'] ?? 0),
                (int) ($this->data['tender_id'] ?? 0),
                $parentDocumentId
            );
            $meta['temp_snapshot']['project_reference'] = $projectReference;
            $meta['temp_snapshot']['package_name']      = $packageName;

            // What earlier issuances already sent
            $meta['temp_snapshot']['issued_additional_document_ids'] = SnapshotService::previouslyIssuedAdditionalDocumentIds($this->baselineDocumentId($parentDocumentId));

            $baseline = $this->baselineSnapshot($parentDocumentId);
            if ($baseline !== []) {
                $meta['temp_snapshot']['changes'] = SnapshotDiff::compare(
                    $baseline,
                    SnapshotDiff::fromPreviewSnapshot($meta['temp_snapshot'])
                );
            }

            Document::patch("document/{$parentDocumentId}", ['meta' => json_encode($meta)]);
        } catch (Exception $e) {
            error_log('PreviewSnapshot: could not record the preview issuance: ' . $e->getMessage());
        }
    }

    public function process(): void
    {
        try {
            $parentDocumentId = $this->data['parent_document_id'] ?? 0;
            $uid              = $this->data['uid'] ?? 0;
            $provider         = $this->data['provider'] ?? 'asite';

            $this->validatePayload();

            $doc = Document::load($parentDocumentId);
            if (!$doc->hasData()) {
                $this->alertFailure('worker_crash', "PreviewSnapshot: Document not found: {$parentDocumentId}");
                return;
            }

            $shortCodes = $doc->getShortCodes();
            $nds = [];
            foreach ($shortCodes as $section) {
                foreach ($section as $shortCode) {
                    if (isset($shortCode['args']['numbered_document'])) {
                        $nds[] = $shortCode['args']['numbered_document'];
                    }
                }
            }
            $nds = array_unique($nds);

            // An addendum template declares no numbered documents of its own;
            // the ones it re-issues are recorded on the document itself, and
            // before it has been sent, only on the issuance it follows.
            if (empty($nds)) {
                $nds = self::numberedDocumentsFromValues($doc->getMeta());
            }
            if (empty($nds)) {
                $nds = $this->inheritedNumberedDocuments((int) $parentDocumentId);
            }

            // Load Tender data for the Package Folder
            $docData = $doc->getDocData();
            $tender = $docData['tender'];
            $providerFolder = $tender->getData('provider_folder') ?? '';

            $token = Snapshot::resolveToken($uid);
            $providerInstance = DownloadManagerFactory::make($provider);

            $groups = [];

            if (!empty($nds)) {
                $ndString = implode(',', $nds);
                $documentUrls = $providerInstance->getPreviewSnapshotDocuments([...$this->data, 'nd_string' => $ndString], $token);

                foreach ($nds as $nd) {
                    $asiteFiles = $documentUrls['url'][$nd] ?? [];
                    if (!empty($asiteFiles)) {
                        $groups[] = [
                            'name'    => $nd,
                            'files'   => $asiteFiles,
                            'details' => ['source_type' => 'project_documents', 'display_name' => "Project Documents"]
                        ];
                    }
                }
            }

            if (!empty($nds) && $groups === []) {
                $this->alertFailure(
                    'empty_numbered_documents',
                    'Provider returned no documents for any of: ' . implode(',', $nds)
                );
                return;
            }

            if ($providerFolder !== '') {
                $documentUrls = $providerInstance->getPreviewSnapshotDocuments([...$this->data, 'provider_folder' => $providerFolder], $token);

                // Fetch Tender Package Documents
                $packageFiles = $documentUrls['url']['folder'] ?? [];

                if (!empty($packageFiles)) {
                    $groups[] = [
                        'name'    => 'package_documents',
                        'files'   => $packageFiles,
                        'details' => ['source_type' => 'tender_package_documents', 'display_name' => "Tender Package Documents"]
                    ];
                }
            }

            if (!empty($groups)) {
                SnapshotService::batchUpdateTempSnapshotMeta($parentDocumentId, $groups, $this->data);
                $this->recordPreviewIssuance(
                    (int) $parentDocumentId,
                    (string) (($docData['project'] ?? null)?->getData('reference') ?? ''),
                    (string) ($tender->getData('label') ?? '')
                );
            }
        } catch (Exception $e) {
            $this->alertFailure('worker_crash', $e->getMessage());
        }
    }

    private function validatePayload(): void
    {
        $payload = $this->data;
        $uid              = $payload['uid'] ?? 0;
        $parentDocumentId = $payload['parent_document_id'] ?? 0;
        $projectId        = $payload['project_id'] ?? 0;
        if (!$projectId || !$parentDocumentId || !$uid) {
            $this->alertFailure('worker_crash', 'Invalid payload: missing required fields');
        }
    }

    private function alertFailure(string $failureType, string $errorMessage): void
    {
        try {
            $provider         = $this->data['provider'] ?? 'asite';
            $parentDocumentId = $this->data['parent_document_id'] ?? 0;
            Sns::send('failed_document_process', json_encode([
                'environment'        => Environment::getValue('ENVIRONMENT'),
                'provider'           => $provider,
                'parent_document_id' => $parentDocumentId,
                'failure_type'       => $failureType,
                'error_message'      => "Preview Snapshot worker failed: {$errorMessage}",
            ]));
        } catch (Exception $e) {
        }
        error_log("Preview Snapshot worker failed [$failureType]: $errorMessage");
    }
}
