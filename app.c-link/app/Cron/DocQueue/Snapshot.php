<?php

namespace App\Cron\DocQueue;

use App\Api\Aws\Sns;
use App\Api\Document;
use App\Api\S3;
use App\Models\UserModel;
use App\core\Environment;
use App\DocCreator\DownloadManager\DownloadManagerFactory;
use App\DocCreator\Snapshot\SnapshotDiff;
use App\DocCreator\Snapshot\SnapshotService;
use Exception;

class Snapshot
{
    private const S3_BUCKET     = 'document';
    private const S3_KEY_PREFIX = 'provider';

    private array $data;

    public function __construct(array $payload)
    {
        $this->data = $payload;
    }

    public function process(): void
    {
        try {
            $this->validatePayload();
            $uid = $this->data['uid'] ?? 0;

            $token      = self::resolveToken($uid);
            $context    = $this->getContext();
            $categoryId = $this->resolveCategoryId($context);
            $docTypes   = $this->resolveDocumentTypes();

            $provider         = $this->data['provider'] ?? 'asite';
            $providerInstance = DownloadManagerFactory::make($provider);
            $documentUrls     = $providerInstance->getSnapshotDocuments($this->data, $token);

            if (empty($documentUrls)) {
                $groupId          = $this->data['group_id'] ?? '';
                $projectId        = $this->data['project_id'] ?? 0;
                $providerFolder   = $this->data['provider_folder'] ?? '';
                $tenderId         = $this->data['tender_id'] ?? 0;
                throw new \RuntimeException("No documents found for provider {$provider}, for group ". ($groupId ?? $providerFolder) .", project {$projectId} and tender id {$tenderId}");
            }

            $results = $this->processDownloads(
                $documentUrls,
                $categoryId,
                $docTypes,
                $providerInstance,
                $token,
                $this->previouslyIssuedGroup($context)
            );

            $this->updateProgress($context, $results);
        } catch (Exception $e) {
            $this->handleFailure($e, $context ?? null);
        }
    }

    /**
     * The documents this group went out with last time, keyed by provider id
     *
     * @param array $context
     * @return array
     */
    private function previouslyIssuedGroup(array $context): array
    {
        try {
            $parentDocId = (int) ($this->data['parent_document_id'] ?? 0);
            $document    = Document::getDocument($parentDocId);
            if (!$document) {
                return [];
            }

            $meta     = (array) json_decode($document['meta'] ?? '{}', true);
            $snapshot = SnapshotService::getSnapshot($meta, $this->data['mode'] ?? '');

            if ($snapshot === []) {
                return [];
            }

            $baseline = SnapshotService::resolveBaselineSnapshot($meta, $snapshot);
            if ($baseline === []) {
                return [];
            }

            $sourceType = $context['entity_type'];
            $folderName = $context['cat_label'];

            $issued = [];
            foreach ($baseline['categories'] ?? [] as $category) {
                if (($category['source_type'] ?? '') !== $sourceType) {
                    continue;
                }

                foreach ($category['children'] ?? [] as $folder) {
                    if ((string) ($folder['name'] ?? '') !== (string) $folderName) {
                        continue;
                    }

                    foreach ($folder['children'] ?? [] as $file) {
                        $id = SnapshotDiff::normaliseDocumentId($file['asite_document_id'] ?? null);
                        // Only a document already in storage can be reused.
                        if ($id !== '' && !empty($file['s3_key'])) {
                            $issued[$id] = $file;
                        }
                    }
                }
            }

            return $issued;
        } catch (Exception $e) {
            error_log('Snapshot worker: could not read the previous issuance of this group: ' . $e->getMessage());

            return [];
        }
    }

    /**
     * The record for a document that has not changed since it was last issued
     *
     * @param array $file Provider record.
     * @param array $issued Previously issued documents
     * @return array|null Null when the document has to be fetched.
     */
    private static function reusableRecord(array $file, array $issued): ?array
    {
        $id = SnapshotDiff::normaliseDocumentId($file['asite_document_id'] ?? null);
        if ($id === '' || !isset($issued[$id])) {
            return null;
        }

        $previous = $issued[$id];

        // Only a document whose file is actually in storage can be shared; one
        // that failed to download last time has to be fetched.
        if (empty($previous['s3_key']) || !SnapshotDiff::isUnchanged($previous, $file)) {
            return null;
        }

        return array_merge($previous, [
            'asite_document_id' => $file['asite_document_id'] ?? ($previous['asite_document_id'] ?? null),
            'download_status'   => 'completed',
        ]);
    }

    private function validatePayload(): void
    {
        $payload = $this->data;
        $parentDocumentId = $payload['parent_document_id'] ?? 0;
        $groupId          = $payload['group_id'] ?? '';
        $projectId        = $payload['project_id'] ?? 0;
        $providerFolder   = $payload['provider_folder'] ?? '';

        if (!$parentDocumentId || (!$groupId && !$providerFolder) || !$projectId) {
            $this->alertFailure($groupId ?: $providerFolder, 'worker_crash', 'Invalid payload: missing required fields');
            throw new \InvalidArgumentException('Missing required snapshot payload fields');
        }
    }

    private function getContext(): array
    {
        $payload = $this->data;
        $groupId          = $payload['group_id'] ?? '';
        $providerFolder   = $payload['provider_folder'] ?? '';
        $projectId        = $payload['project_id'] ?? 0;
        $tenderId         = $payload['tender_id'] ?? 0;

        $isTenderPackage = ($groupId === '' && $providerFolder !== '');

        if ($isTenderPackage) {
            return [
                'entity_id'    => $tenderId,
                'entity_type'  => 'tender_package_documents',
                'cat_label'    => 'package_documents',
                'display_name' => 'Tender Package Documents',
                'parent_id'    => $projectId,
            ];
        }

        return [
            'entity_id'    => $projectId,
            'entity_type'  => 'project_documents',
            'cat_label'    => $groupId,
            'display_name' => 'Project Documents',
            'parent_id'    => 0,
        ];
    }

    private function resolveCategoryId(array $context): int
    {
        $categoryId = SnapshotService::getOrCreateCategory(
            $context['entity_id'],
            $context['cat_label'],
            $context['entity_type'],
            $context['parent_id']
        );

        if (!$categoryId) {
            throw new \RuntimeException("Failed to create/resolve category {$context['cat_label']} for {$context['entity_type']}");
        }

        return $categoryId;
    }

    private function resolveDocumentTypes(): array
    {
        return [
            'type_id'    => Document::getDocumentType('account-documents'),
            'subtype_id' => Document::getSubType('download_manager_file')->getId(),
        ];
    }

    /**
     * @param array $files Provider records as returned by getSnapshotDocuments().
     */
    private function processDownloads(
        array $files,
        int $categoryId,
        array $docTypes,
        $providerInstance,
        string $token,
        array $previouslyIssued = []
    ): array {
        $results = [];
        $reused  = 0;

        foreach ($files as $index => $file) {
            $record = is_array($file) ? $file : ['uri' => (string) $file];

            $reusable = self::reusableRecord($record, $previouslyIssued);
            if ($reusable !== null) {
                $results[] = $reusable;
                $reused++;
                continue;
            }

            $results[] = $this->processSingleFile(
                $record,
                $index + 1,
                $categoryId,
                $docTypes,
                $providerInstance,
                $token
            );
        }

        if ($reused) {
            error_log(sprintf(
                'Snapshot worker: reused %d of %d unchanged document(s) in %s',
                $reused,
                count($files),
                $this->data['group_id'] ?: ($this->data['provider_folder'] ?? 'package')
            ));
        }

        return $results;
    }

    /**
     * Handles the lifecycle of a single file: Fetch -> Guess Ext -> Upload S3 -> DB Record -> Map to Category.
     *
     * The provider metadata on $file is carried into the returned record so the
     * finalised snapshot can be compared against later issuances.
     */
    private function processSingleFile(array $file, int $fileNum, int $categoryId, array $docTypes, $providerInstance, string $token): array
    {
        $payload        = $this->data;
        $parentDocId    = $payload['parent_document_id'] ?? 0;
        $aid            = $payload['aid'] ?? 0;
        $provider       = $payload['provider'] ?? 'asite';
        $groupId        = $payload['group_id'] ?? '';
        $providerFolder = $payload['provider_folder'] ?? '';

        $url      = (string) ($file['uri'] ?? '');
        $filename = null;
        $s3Key    = null;
        $status   = 'failed';

        try {
            if ($url === '') {
                throw new \RuntimeException("Missing download URI for file $fileNum from $provider");
            }

            $download = $providerInstance->fetchFileContent($parentDocId, $url, $token);
            $content  = $download['content'];
            $type     = $download['type'];
            $filename = $download['filename'];

            if ($content === false || $content === '') {
                throw new \RuntimeException("Empty response downloading file $fileNum from $provider");
            }

            $ext = $filename ? pathinfo($filename, PATHINFO_EXTENSION) : $this->guessExtension($type);
            $filename = $filename ?: "$fileNum" . ($ext ? ".$ext" : "");
            $s3Filename = str_replace(' ', '_', $filename);

            $isTenderPackage = ($groupId === '' && $providerFolder !== '');
            $targetBase = $isTenderPackage ? 'tender_package_documents' : 'project_documents';
            $keySegments = [$provider, $parentDocId, $targetBase];

            if (!$isTenderPackage) {
                $keySegments[] = $groupId;
            }

            $s3Key = S3::getKey($s3Filename, self::S3_KEY_PREFIX, $keySegments);
            S3::uploadContent(self::S3_BUCKET, $s3Key, $content);

            $postData = [
                'owner_id'  => $aid,
                'parent_id' => $parentDocId,
                'type'      => $docTypes['type_id'],
                'subtype'   => $docTypes['subtype_id'],
                'name'      => $filename,
                's3_key'    => $s3Key,
                's3_bucket' => self::S3_BUCKET,
            ];

            $docRes = Document::post('document', $postData);
            $documentId = $docRes->json()['data']['id'] ?? null;

            if ($documentId) {
                Document::patch("category/$categoryId/document/$documentId");
                $status = 'completed';
            }
        } catch (Exception $e) {
            error_log("Snapshot worker: File processing failed [" . ($groupId ?: 'package') . " #$fileNum]: " . $e->getMessage());
        }

        return [
            'type'              => 'file',
            'id'                => $documentId ?? 0,
            // Stable across issuances, unlike 'id' which is a fresh C-Link row each run.
            'asite_document_id' => $file['asite_document_id'] ?? null,
            'filename'          => $filename ?? ($file['filename'] ?? "file_{$fileNum}"),
            'doc_title'         => $file['doc_title'] ?? null,
            'doc_ref'           => $file['doc_ref'] ?? null,
            'file_type'         => $file['file_type'] ?? null,
            'rev_no'            => $file['rev_no'] ?? null,
            'publisher_org'     => $file['publisher_org'] ?? null,
            'status'            => $file['status'] ?? null,
            'download_status'   => $status,
            's3_key'            => $s3Key,
        ];
    }

    private function updateProgress(array $context, array $results): void
    {
        $payload     = $this->data;
        $parentDocId = $payload['parent_document_id'] ?? 0;

        SnapshotService::updateSnapshotMeta($parentDocId, $context['cat_label'], $results, [
            'mode'         => $payload['mode'] ?? 'enquiry',
            'provider'     => $payload['provider'] ?? 'asite',
            'project_id'   => $payload['project_id'] ?? 0,
            'tender_id'    => $payload['tender_id'] ?? 0,
            'source_type'  => $context['entity_type'],
            'display_name' => $context['display_name'],
        ]);
    }

    private function handleFailure(Exception $e, ?array $context): void
    {
        $payload     = $this->data;
        $groupId     = $payload['group_id'] ?? '';
        $folder      = $payload['provider_folder'] ?? '';
        $parentDocId = $payload['parent_document_id'] ?? 0;

        if (!($e instanceof \InvalidArgumentException)) {
            $failureType = $this->classifyError($e);
            $this->alertFailure($groupId ?: $folder, $failureType, $e->getMessage());
        }

        if ($parentDocId && $context) {
            try {
                SnapshotService::updateSnapshotMeta($parentDocId, $context['cat_label'], [], [
                    'mode'         => $payload['mode'] ?? 'enquiry',
                    'provider'     => $payload['provider'] ?? 'asite',
                    'project_id'   => $payload['project_id'] ?? 0,
                    'tender_id'    => $payload['tender_id'] ?? 0,
                    'source_type'  => $context['entity_type'],
                    'display_name' => $context['display_name'],
                ]);
            } catch (Exception $metaEx) {
                error_log("Snapshot worker: failed to update fallback meta: " . $metaEx->getMessage());
            }
        }
    }

    private function guessExtension(string $contentType): ?string
    {
        $map = [
            'application/pdf' => 'pdf',
            'image/jpeg'      => 'jpg',
            'image/png'       => 'png',
            'application/zip' => 'zip',
            'text/plain'      => 'txt',
            'application/msword' => 'doc',
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document' => 'docx',
            'application/vnd.ms-excel' => 'xls',
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' => 'xlsx',
        ];

        $mime = strtolower(explode(';', $contentType)[0]);
        return $map[$mime] ?? null;
    }

    private function classifyError(Exception $e): string
    {
        $provider = $this->data['provider'] ?? 'asite';
        $msg      = strtolower($e->getMessage());

        if (strpos($msg, '429') !== false) {
            return "{$provider}_rate_limit";
        }
        if (strpos($msg, 'auth') !== false || strpos($msg, '401') !== false || strpos($msg, '403') !== false) {
            return 'auth';
        }
        return "{$provider}_connection";
    }

    private function alertFailure(string $groupId, string $failureType, string $errorMessage): void
    {
        try {
            $provider = $this->data['provider'] ?? 'asite';
            Sns::send('failed_document_process', json_encode([
                'environment'        => Environment::getValue('ENVIRONMENT'),
                'provider'           => $provider,
                'parent_document_id' => $this->data['parent_document_id'] ?? null,
                'group_id'           => $groupId,
                'failure_type'       => $failureType,
                'error_message'      => $errorMessage,
            ]));
        } catch (Exception $e) {
        }

        error_log("Snapshot worker failed [$failureType] $groupId: $errorMessage");
    }


    public static function resolveToken(int $uid): string
    {
        if (!$uid) {
            throw new \RuntimeException('Snapshot worker: no uid for token creation');
        }
        $user = new UserModel([], $uid);
        $json = $user->createTokenByLabel($uid, 'temp_1h')->json()['data'] ?? [];
        if (empty($json['token'])) {
            throw new \RuntimeException('Snapshot worker: failed to create auth token');
        }
        return $json['token'];
    }
}
