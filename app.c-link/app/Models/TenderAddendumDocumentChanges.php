<?php

namespace App\Models;

use App\Api\Document;
use App\Api\Document\TenderTemplate;
use App\Api\Tender\Enquiry;
use App\Cron\DocQueue\PreviewSnapshot;
use App\Cron\DocQueue\Snapshot;
use App\DocCreator\DownloadManager\DownloadManagerFactory;
use App\DocCreator\Snapshot\SnapshotDiff;
use App\DocCreator\Snapshot\SnapshotService;

class TenderAddendumDocumentChanges
{
    /**
     * Platform colours for each change, so a reader can tell them apart at a
     * glance: green for an addition, pink for an amendment, red for a removal.
     */
    private const CHANGE_COLOURS = [
        SnapshotDiff::NEW       => '#059669',
        SnapshotDiff::UPDATED   => '#ed1164',
        SnapshotDiff::WITHDRAWN => '#dc2626',
    ];

    private const MUTED_COLOUR = '#8a8a8a';

    /**
     * Compared fields that the Schedule of Changes renders in their own column.
     * The rest are listed by name under the change label.
     */
    private const COLUMN_FIELDS = ['rev_no', 'doc_ref', 'doc_title', 'publisher_org'];

    /**
     * The schedule describes the newest addendum, compared against whatever was
     * issued before it: the enquiry for the first addendum, addendum #1 for the
     * second, and so on.
     */
    private const CURRENT_MODE = 'addendum';

    /**
     * The provider a tender addendum draws its documents from.
     */
    private const PROVIDER = 'asite';

    /**
     * Shown for package documents when the tender records no folder name.
     */
    private const PACKAGE_FALLBACK_LABEL = 'Package';

    /**
     * Shown in the group column for C-Link uploads, which belong to no A-Site
     * folder.
     */
    private const ADDITIONAL_LABEL = 'Additional';

    /**
     * Stands in for a column a row has no value for.
     */
    private const NOT_APPLICABLE = '-';

    /**
     * Stated on the schedule when the comparison ran and found the A-Site
     * documents unchanged.
     */
    private const NO_CHANGES_NOTICE = 'No changes to the A-Site documents were recorded for this addendum.';

    /**
     * Stated when the comparison could not be established.
     */
    private const NOT_ESTABLISHED_NOTICE = 'The changes for this addendum could not be established.';

    /**
     * Provider state already read this request, per document.
     *
     * @var array<int, array>
     */
    private static array $providerState = [];

    /**
     * @param array $models
     * @return array
     */
    public static function getFiles(array $models): array
    {
        try {
            if (!self::isAddendum($models['document'] ?? null)) {
                return ['files' => [], 'download' => ''];
            }

            $meta    = $models['document']->getMeta();
            $preview = empty($meta['snapshot']);

            if ($preview) {
                $baseline = self::resolveBaseline($models, $meta, [], true);
                $current  = self::previewedState($models, $meta, $baseline);
            } else {
                $current  = SnapshotService::getSnapshot($meta, self::CURRENT_MODE);
                $baseline = self::resolveBaseline($models, $meta, $current, false);
            }

            $files = array_merge(
                self::getFilesFromSnapshot($meta, $current, $baseline, $preview, self::packageLabel($models)),
                self::additionalDocuments($models, $meta, $baseline, $preview)
            );

            if ($files === []) {
                $files = [self::noticeRow(
                    SnapshotService::comparisonIsUsable($current)
                        ? self::NO_CHANGES_NOTICE
                        : self::NOT_ESTABLISHED_NOTICE
                )];
            }

            return ['files' => $files, 'download' => ''];
        } catch (\Exception $e) {
            error_log("TenderAddendumDocumentChanges::getFiles failed: " . $e->getMessage());

            return ['files' => [self::noticeRow(self::NOT_ESTABLISHED_NOTICE)], 'download' => ''];
        }
    }

    /**
     * The snapshot this addendum is measured against.
     *
     * Each issuance is its own document, so the baseline does not live in the
     * meta being rendered. The tender history lists the documents that were
     * sent, newest first; the first one that is not the document in hand and
     * that carries a snapshot is the issuance immediately before it - the
     * original enquiry for the first addendum, the previous addendum after
     * that.
     */
    private static function getBaselineSnapshot(array $models): array
    {
        $meta      = (($models['document'] ?? null)?->getMeta()) ?: [];
        $currentId = (int) (($models['document'] ?? null)?->getId() ?? 0);

        // A document that already carries a finished snapshot is its own
        // baseline - the preview and the next issuance are both measured
        // against what it last sent.
        if (SnapshotService::getCompletedSnapshot($meta) !== []) {
            return [];
        }

        // The snapshot records which issuance it was measured against, so the
        // history only has to be consulted for snapshots taken before that.
        $recorded = (int) (SnapshotService::getSnapshot($meta, self::CURRENT_MODE)['baseline_document_id'] ?? 0);
        if ($recorded) {
            $snapshot = self::snapshotOfDocument($recorded);
            if ($snapshot !== []) {
                return $snapshot;
            }
        }

        $pid = self::modelId($models['project'] ?? null);
        $tid = self::modelId($models['tender'] ?? null);

        if (!$pid || !$tid) {
            return [];
        }

        try {
            foreach (Enquiry::getIssuedDocumentIds($pid, $tid) as $documentId) {
                if ($documentId === $currentId) {
                    continue;
                }

                $snapshot = self::snapshotOfDocument($documentId);
                if ($snapshot !== []) {
                    return $snapshot;
                }
            }
        } catch (\Exception $e) {
            // The schedule still renders if the meta in hand holds the chain.
            error_log('TenderAddendumDocumentChanges: baseline lookup failed: ' . $e->getMessage());
        }

        return [];
    }

    /**
     * @param object|null $model
     * @return int
     */
    private static function modelId(?object $model): int
    {
        if ($model === null) {
            return 0;
        }

        return (int) ($model->getId() ?: ($model->getData('id') ?? 0));
    }

    /**
     * @param int $documentId
     * @return array
     */
    private static function snapshotOfDocument(int $documentId): array
    {
        $document = Document::getDocument($documentId);
        if (!$document) {
            return [];
        }

        // Never an in-progress snapshot: a re-sent issuance leaves an empty one
        // alongside the finished it, and comparing against that would report
        // every document as new.
        return SnapshotService::getCompletedSnapshot(
            (array) json_decode($document['meta'] ?? '{}', true)
        );
    }

    /**
     * The state the addendum would issue, as a snapshot the comparison can read.
     *
     * @param array $models
     * @param array $meta
     * @param array $baseline
     * @return array
     */
    private static function previewedState(array $models, array $meta, array $baseline): array
    {
        if (!empty($meta['temp_snapshot'])) {
            return SnapshotDiff::fromPreviewSnapshot($meta['temp_snapshot']);
        }

        return self::providerState($models, $meta, $baseline);
    }

    /**
     * The numbered documents an earlier issuance covered.
     *
     * @param array $baseline
     * @return string[]
     */
    private static function baselineNumberedDocuments(array $baseline): array
    {
        $names = [];
        foreach ($baseline['categories'] ?? [] as $category) {
            if (($category['source_type'] ?? '') !== 'project_documents') {
                continue;
            }

            foreach ($category['children'] ?? [] as $folder) {
                $name = trim((string) ($folder['name'] ?? ''));
                if ($name !== '') {
                    $names[$name] = true;
                }
            }
        }

        return array_keys($names);
    }

    /**
     * Reads the provider's documents into a snapshot to compare against.
     *
     * @param array $models
     * @param array $meta
     * @param array $baseline
     * @return array Empty when the provider holds nothing for this addendum.
     */
    private static function providerState(array $models, array $meta, array $baseline): array
    {
        $projectId      = self::modelId($models['project'] ?? null);
        $providerFolder = trim((string) (($models['tender'] ?? null)?->getData('provider_folder') ?? ''));
        $userId         = (int) (($models['user'] ?? null)?->getId() ?? 0);
        $documentId     = (int) (($models['document'] ?? null)?->getId() ?? 0);

        if (!$projectId || !$userId) {
            return [];
        }

        if (isset(self::$providerState[$documentId])) {
            return self::$providerState[$documentId];
        }

        $provider   = DownloadManagerFactory::make(self::PROVIDER);
        $token      = Snapshot::resolveToken($userId);
        $categories = [];

        $numberedDocuments = PreviewSnapshot::numberedDocumentsFromValues($meta)
            ?: self::baselineNumberedDocuments($baseline);

        if ($numberedDocuments !== []) {
            $response = $provider->getPreviewSnapshotDocuments(
                ['project_id' => $projectId, 'nd_string' => implode(',', $numberedDocuments)],
                $token
            );

            $folders = [];
            foreach ($numberedDocuments as $numberedDocument) {
                $files = $response['url'][$numberedDocument] ?? [];
                if (!empty($files)) {
                    $folders[] = self::providerFolder($numberedDocument, $files);
                }
            }

            if ($folders !== []) {
                $categories[] = ['source_type' => 'project_documents', 'children' => $folders];
            }
        }

        if ($providerFolder !== '') {
            $response = $provider->getPreviewSnapshotDocuments(
                ['project_id' => $projectId, 'provider_folder' => $providerFolder],
                $token
            );

            $files = $response['url']['folder'] ?? [];
            if (!empty($files)) {
                $categories[] = [
                    'source_type' => 'tender_package_documents',
                    'children'    => [self::providerFolder('package_documents', $files)],
                ];
            }
        }

        $state = $categories === []
            ? []
            : ['mode' => self::CURRENT_MODE, 'categories' => $categories];

        return self::$providerState[$documentId] = $state;
    }

    /**
     * @param string $name
     * @param array $files
     * @return array
     */
    private static function providerFolder(string $name, array $files): array
    {
        $children = [];
        foreach ($files as $file) {
            if (!is_array($file)) {
                continue;
            }

            $children[] = [
                'type'              => 'file',
                'asite_document_id' => $file['id'] ?? null,
                'filename'          => $file['file_name'] ?? ($file['doc_title'] ?? ''),
                'doc_title'         => $file['doc_title'] ?? null,
                'doc_ref'           => $file['doc_ref'] ?? null,
                'rev_no'            => $file['rev_no'] ?? null,
                'publisher_org'     => $file['publisher_org'] ?? null,
                'status'            => $file['status'] ?? null,
                'download_uri'      => $file['uri'] ?? null,
                'download_status'   => 'completed',
            ];
        }

        return ['type' => 'folder', 'name' => $name, 'children' => $children];
    }

    /**
     * The snapshot this addendum is measured against.
     *
     * @param array $models
     * @param array $meta
     * @param array $current
     * @param bool $preview
     * @return array
     */
    private static function resolveBaseline(array $models, array $meta, array $current, bool $preview): array
    {
        $baseline = self::getBaselineSnapshot($models);
        if ($baseline !== []) {
            return $baseline;
        }

        return $preview
            ? SnapshotService::getCompletedSnapshot($meta)
            : SnapshotService::getPreviousSnapshot($meta, $current);
    }

    /**
     * The comparison the schedule is built from.
     *
     * @param array $meta
     * @param array $current
     * @param array $baseline
     * @param bool $preview
     * @return array
     */
    private static function classification(array $meta, array $current, array $baseline, bool $preview): array
    {
        // A recorded result is the answer, and needs no baseline to stand: an
        // issued snapshot keeps the comparison it went out with precisely so it
        // cannot be recomputed into something else later.
        $recorded = $preview
            ? ($meta['temp_snapshot']['changes'] ?? null)
            : ($current['changes'] ?? null);

        if ($recorded !== null) {
            return $recorded;
        }

        // Nothing recorded, so it is worked out here - which needs both sides.
        if ($baseline === [] || $current === []) {
            return [];
        }

        return SnapshotDiff::compare($baseline, $current);
    }

    /**
     * Builds the Schedule of Changes from what this addendum carries against
     * the issuance before it. Without a predecessor there is nothing to report,
     * so the table comes back empty rather than listing every document as
     * added.
     *
     * @param array $meta
     * @param array $current
     * @param array $baseline
     * @param bool $preview
     * @param string $packageLabel
     * @return array
     */
    private static function getFilesFromSnapshot(
        array $meta,
        array $current,
        array $baseline,
        bool $preview,
        string $packageLabel
    ): array {
        $changes = self::classification($meta, $current, $baseline, $preview);

        $diff = array_merge(
            $changes[SnapshotDiff::UPDATED]   ?? [],
            $changes[SnapshotDiff::NEW]       ?? [],
            $changes[SnapshotDiff::WITHDRAWN] ?? []
        );

        usort($diff, static function (array $a, array $b): int {
            return strnatcasecmp($a['nd'], $b['nd'])
                ?: strcmp($a['change'], $b['change'])
                    ?: strnatcasecmp($a['doc_ref'], $b['doc_ref']);
        });

        return array_values(array_map(static function (array $item) use ($packageLabel): array {
            return [
                'previous_rev'           => self::previousRevisionCell($item),
                'current_rev'            => self::currentRevisionCell($item),
                'doc_ref'                => self::valueCell($item, 'doc_ref', $item['doc_ref']),
                'doc_title'              => self::valueCell($item, 'doc_title', $item['doc_title']),
                'publisher_organisation' => self::valueCell($item, 'publisher_org', $item['publisher_org'] ?? ''),
                'nd'                     => self::textCell($item, self::groupLabel($item, $packageLabel)),
                'src'                    => '',
                'changed'                => self::changeCell($item),
                'type'                   => 'text',
            ];
        }, $diff));
    }

    /**
     * Cell markup is emitted as raw HTML: file values are injected after
     * HtmlParser has already run, so the {b:...} shortcodes are not an option
     * here. Styles are inline because mPDF only loads the bundled stylesheets.
     */
    private static function escape(string $value): string
    {
        return htmlspecialchars($value, ENT_QUOTES, 'UTF-8');
    }

    /**
     * Greyed out - for values that no longer apply.
     */
    private static function muted(string $value): string
    {
        if ($value === '') {
            return '';
        }

        return sprintf('<span style="color:%s;">%s</span>', self::MUTED_COLOUR, self::escape($value));
    }

    private static function bold(string $value): string
    {
        if ($value === '') {
            return '';
        }

        return sprintf('<span style="font-weight:bold;">%s</span>', self::escape($value));
    }

    /**
     * The revision the document carried before this addendum.
     *
     * @param array $item
     * @return string
     */
    private static function previousRevisionCell(array $item): string
    {
        if ($item['change'] === SnapshotDiff::WITHDRAWN) {
            $withdrawn = (string) ($item['rev_no'] ?? '');

            return $withdrawn === '' ? self::NOT_APPLICABLE : self::muted($withdrawn);
        }

        $from = (string) ($item['changes']['rev_no']['from'] ?? '');

        return $from === '' ? self::NOT_APPLICABLE : self::escape($from);
    }

    /**
     * The revision the document carries now.
     *
     * @param array $item
     * @return string
     */
    private static function currentRevisionCell(array $item): string
    {
        if ($item['change'] === SnapshotDiff::WITHDRAWN) {
            return self::NOT_APPLICABLE;
        }

        $revised = isset($item['changes']['rev_no']);
        $current = (string) ($item['changes']['rev_no']['to'] ?? ($item['rev_no'] ?? ''));

        if ($current === '') {
            return self::NOT_APPLICABLE;
        }

        return ($revised || $item['change'] === SnapshotDiff::NEW)
            ? self::bold($current)
            : self::escape($current);
    }

    /**
     * A column backed by a watched field. When that field changed the cell
     * renders the transition "old -> new", the superseded value greyed and the
     * current one in bold; otherwise it stays plain.
     */
    private static function valueCell(array $item, string $field, string $value): string
    {
        if ($item['change'] === SnapshotDiff::WITHDRAWN) {
            return self::muted($value);
        }

        // A new document has no predecessor to differ from, so every value on
        // the row is current rather than one side of a transition.
        if ($item['change'] === SnapshotDiff::NEW) {
            return self::bold($value);
        }

        $change = $item['changes'][$field] ?? null;
        if ($change === null) {
            return self::escape($value);
        }

        $current = self::bold($change['to']);

        if ($change['from'] === '') {
            return $current;
        }

        return sprintf(
            '%s <span style="color:%s;">&#8594;</span> %s',
            self::muted($change['from']),
            self::MUTED_COLOUR,
            $current
        );
    }

    /**
     * The File Manager uploads this addendum adds.
     *
     * @param array $models
     * @param array $meta
     * @param array $baseline Snapshot of the issuance before this one.
     * @param bool $preview
     * @return array
     */
    private static function additionalDocuments(array $models, array $meta, array $baseline, bool $preview): array
    {
        $tenderId = self::modelId($models['tender'] ?? null);
        if (!$tenderId) {
            return [];
        }

        try {
            $issued  = array_flip(self::issuedAdditionalDocumentIds($meta, $baseline, $preview));
            $current = SnapshotService::getAdditionalDocuments($tenderId);

            $rows = [];
            foreach ($current['children'] ?? [] as $folder) {
                $folderName = (string) ($folder['name'] ?? '');

                if (strpos($folderName, FileManager::TENDER_ADDENDUM_LABEL) !== false) {
                    continue;
                }

                foreach ($folder['children'] ?? [] as $file) {
                    $id = (int) ($file['id'] ?? 0);
                    if ($id && isset($issued[$id])) {
                        continue;
                    }

                    $rows[] = [
                        'previous_rev'           => self::NOT_APPLICABLE,
                        'current_rev'            => self::NOT_APPLICABLE,
                        'doc_ref'                => self::NOT_APPLICABLE,
                        'doc_title'              => self::bold((string) ($file['doc_title'] ?? $file['filename'] ?? '')),
                        'publisher_organisation' => self::NOT_APPLICABLE,
                        'nd'                     => self::escape($folderName !== '' ? $folderName : self::ADDITIONAL_LABEL),
                        'src'                    => '',
                        'changed'                => self::changeCell(['change' => SnapshotDiff::NEW, 'changes' => []]),
                        'type'                   => 'text',
                    ];
                }
            }

            return $rows;
        } catch (\Exception $e) {
            error_log('TenderAddendumDocumentChanges: additional documents lookup failed: ' . $e->getMessage());

            return [];
        }
    }

    /**
     * Ids of the uploads the previous issuance went out with.
     *
     * @param array $baseline
     * @return array<int, true>
     */
    private static function issuedAdditionalDocumentIds(array $meta, array $baseline, bool $preview): array
    {
        $snapshot = $preview
            ? ($meta['temp_snapshot'] ?? [])
            : SnapshotService::getSnapshot($meta, self::CURRENT_MODE);

        $recorded = $snapshot['issued_additional_document_ids'] ?? null;
        if ($recorded !== null) {
            return array_map('intval', $recorded);
        }

        return SnapshotService::additionalDocumentIds($baseline);
    }

    /**
     * @param array $models
     * @return string
     */
    private static function packageLabel(array $models): string
    {
        $folder = trim((string) (($models['tender'] ?? null)?->getData('provider_folder') ?? ''));

        return $folder !== '' ? $folder : self::PACKAGE_FALLBACK_LABEL;
    }

    /**
     * What the ND column shows. Project documents are grouped per numbered
     * document, so the folder name is the label; package documents all come
     * from the one folder the tender is mapped to, which is named instead.
     */
    private static function groupLabel(array $item, string $packageLabel): string
    {
        return ($item['source_type'] ?? '') === 'tender_package_documents'
            ? $packageLabel
            : (string) ($item['nd'] ?? '');
    }

    /**
     * Whether the document being rendered is a tender addendum.
     *
     * @param mixed $document
     * @return bool
     */
    private static function isAddendum($document): bool
    {
        if (!$document) {
            return false;
        }

        $name = (string) ($document->getData('name') ?? '');

        return $name !== '' && TenderTemplate::isTenderAddendum($name);
    }

    /**
     * A single row stating why the schedule lists no documents.
     *
     * @param string $notice
     * @return array
     */
    private static function noticeRow(string $notice): array
    {
        return [
            'previous_rev'           => '',
            'current_rev'            => '',
            'doc_ref'                => '',
            'doc_title'              => self::muted($notice),
            'publisher_organisation' => '',
            'nd'                     => '',
            'src'                    => '',
            'changed'                => '',
            'type'                   => 'text',
        ];
    }

    /**
     * Text columns keep their plain value, except on withdrawals where the whole
     * row is greyed out.
     */
    private static function textCell(array $item, string $value): string
    {
        return ($item['change'] === SnapshotDiff::WITHDRAWN) ? self::muted($value) : self::escape($value);
    }

    /**
     * Change column - a coloured label per change type, followed by the watched
     * fields that changed but have no column to show it in.
     */
    private static function changeCell(array $item): string
    {
        $label = sprintf(
            '<span style="color:%s;font-weight:bold;">%s</span>',
            self::CHANGE_COLOURS[$item['change']] ?? self::MUTED_COLOUR,
            self::escape(ucfirst($item['change']))
        );

        $offColumn = [];
        foreach ($item['changes'] as $field => $change) {
            if (!in_array($field, self::COLUMN_FIELDS, true)) {
                $offColumn[] = $change['label'];
            }
        }

        if ($offColumn === []) {
            return $label;
        }

        return $label . sprintf(
            '<br /><span style="color:%s;font-size:8pt;">%s</span>',
            self::MUTED_COLOUR,
            self::escape(implode(', ', $offColumn))
        );
    }

}
