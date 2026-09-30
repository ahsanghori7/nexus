<?php

namespace Api\Service;

use Core\Router\Route\Action;
use Core\Config;
use Core\Data\Shape;
use Core\Middleware\Exception as MiddlewareException;
use Core\Service\Manager;
use ZipArchive;
class TenderRecommendationAttachmentService
{
    // Constants
    private const ENTITY_TYPE    = 'tender_recommendation_document';
    private const DOCUMENT_LABEL = 'Tender Recommendation Documents';
    private const MAX_SIZE_BYTES = 26214400; // 25MB
    private const DOC_TYPE       = 'structural';
    private const DOC_SUBTYPE    = 'tender_recommendation_document';
    private const S3_BUCKET      = 'asset';
    private const S3_FOLDER      = 'tender_recommendation';
    private const S3_TAGS        = ['attachment'];

    private const ALLOWED_MIME_TYPES = [
        'application/pdf',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'application/zip', // xlsx finfo detection
        'image/png',
        'image/jpeg',
    ];

    private const ALLOWED_EXTENSIONS = ['pdf', 'docx', 'xlsx', 'png', 'jpg', 'jpeg'];

    // Public entry function

    public function upload(Action $a): void
    {
        $projectId = $a->get('uriArgs.project_id');
        $entityId  = $a->get('uriArgs.id');
        $parentId  = (int) $a->get('uriArgs.tender_id');
        $user      = $a->get('user');
        $project   = $a->get('project');

        $this->assertTenderMatchesParent(
            $projectId,
            $entityId,
            $parentId
        );

        $request   = $a->getRoute()->getRequest()->getData();
        $dataArray = $request->toArray();

        $rawFile = $dataArray['files']['file[]']
                    ?? $dataArray['files']['file']
                    ?? null;

        if (!$rawFile) {
            throw new MiddlewareException(
                "InvalidPayload",
                "No file provided."
            );
        }

        $files = $this->extractFilesFromRequest($rawFile);

        if (empty($files)) {
            throw new MiddlewareException(
                "InvalidPayload",
                "No valid file provided."
            );
        }

        [$validFiles, $skipped] = $this->validateFiles($files);

        $uploaded = [];
        $categoryContext      = [];

        if (!empty($validFiles)) {
            $categoryContext = $this->prepareUploadContext(
                $entityId,
                self::ENTITY_TYPE,
                $parentId
            );
        }

        $existingDocs = $this->getExistingDocsFromCategory(
            $entityId,
            self::ENTITY_TYPE,
            $parentId
        );

        foreach ($validFiles as $file) {

            $sanitized = $this->sanitizeFilename($file['name']);

            // New file versioned name
            $file['name'] = $this->resolveVersionedName($sanitized, $existingDocs);

            // In memory list for next iteration
            $existingDocs[] = ['id' => null, 'name' => $file['name']];

            $result = $this->uploadSingleFile(
                $file,
                $categoryContext,
                $user
            );

            if (isset($result['document_id'])) {
                $uploaded[] = $result;
            } else {
                $skipped[] = $result;
            }
        }

        $a->set('payload', $this->buildUploadPayload(
            $user,
            $project,
            $categoryContext['catId'] ?? null,
            $uploaded,
            $skipped
        ));
    }

    public function uploadExisting(Action $a): void
    {
        $projectId = $a->get('uriArgs.project_id');
        $entityId  = $a->get('uriArgs.id');
        $parentId  = (int) $a->get('uriArgs.tender_id');
        $user      = $a->get('user');
        $project   = $a->get('project');

        $this->assertTenderMatchesParent(
            $projectId,
            $entityId,
            $parentId
        );

        $request   = $a->getRoute()->getRequest()->getData();
        $dataArray = $request->toArray() ?? [];

        $payload = $dataArray['json'] ?? [];

        if ($payload instanceof Shape) {
            $payload = $payload->toArray();
        }

        $existingItems = $payload['data'] ?? [];
        $existingItems = $this->extractExistingMediaItems($existingItems);

        if (empty($existingItems)) {
            throw new MiddlewareException(
                "InvalidPayload",
                "No valid existing media found."
            );
        }

        $uploaded = [];
        $skipped  = [];
        $categoryContext      = null;

        // Fetch exisitng docs from category
        $existingDocsInCategory = $this->getExistingDocsFromCategory($entityId, self::ENTITY_TYPE, $parentId);

        foreach ($existingItems as $item) {

            try {
                $sourceDoc = Manager::getService('document')
                    ->fetch("document/{$item['id']}")
                    ->getShape('data')
                    ->toArray();

                if (empty($sourceDoc)) {
                    $skipped[] = [
                        'name'   => $item['name'] ?? 'existing-media',
                        'reason' => 'Source document not found',
                    ];
                    continue;
                }

                // category context
                if (!$categoryContext) {
                    $categoryContext = $this->prepareUploadContext(
                        $entityId,
                        self::ENTITY_TYPE,
                        $parentId
                    );
                }

                $originalName = $sourceDoc['name'];
                $versionedName = $this->resolveVersionedName($originalName, $existingDocsInCategory);

                // In-memory update for next iteration
                $existingDocsInCategory[] = ['id' => null, 'name' => $versionedName];
                // Create new clone of the existing document
                $documentResponse = Manager::getService('document')->write(
                                    'document',
                                    new Shape([
                                        'data' => [
                                            'name'      => $versionedName,
                                            'type'      => $categoryContext['docTypeId'] ?? 0,
                                            'subtype'   => $categoryContext['docSubTypeId'] ?? 0,
                                            'owner_id'  => (int) ($user['id'] ?? 0),
                                            'meta'      => $sourceDoc['meta'] ?? null,
                                            's3_bucket' => $sourceDoc['s3_bucket'] ?? self::S3_BUCKET,
                                            's3_key'    => $sourceDoc['s3_key'], // reuse same file
                                        ]
                                    ])
                                );

                $newDocResponse = json_decode(
                    $documentResponse->get('content'),
                    true
                );

                $newDocId = $newDocResponse['data']['id'] ?? null;

                if (!$newDocId) {
                    $skipped[] = [
                        'name'   => $item['name'] ?? 'existing-media',
                        'reason' => 'Failed to clone document',
                    ];
                    continue;
                }

                // mappnig new document to category
                Manager::getService('document')->update(
                    "category/{$categoryContext['catId']}/document/{$newDocId}",
                    new Shape([])
                );

                $uploaded[] = [
                    'document_id' => $newDocId,
                    'name'        => $versionedName,
                    'existing'    => true
                ];

            } catch (\Throwable $e) {
                $skipped[] = [
                    'name'   => $item['name'] ?? 'existing-media',
                    'reason' => $e->getMessage(),
                ];
            }
        }

        $a->set('payload', $this->buildUploadPayload(
            $user,
            $project,
            $categoryContext['catId'] ?? null,
            $uploaded,
            $skipped
        ));
    }

    public function getAttachments(Action $a): void
    {
        $entityId   = (int) $a->get('uriArgs.id');
        $entityType = self::ENTITY_TYPE;
        $parentId   = (int) $a->get('uriArgs.tender_id');

        $existing = $this->fetchCategory($entityId, $entityType, $parentId);
        $docs     = [];
        $ownerIds = [];

        // Individual doc fetch for owner_id
        foreach ($existing as $category) {
            foreach ($category['documents'] ?? [] as $doc) {
                $did  = $doc['id'] ?? null;
                if (!$did) {
                    continue;
                }

                $meta = isset($doc['meta']) ? json_decode($doc['meta'], true) : [];

                $detail = Manager::getService('document')
                    ->fetch("document/{$did}")
                    ->getShape('data')
                    ->get();

                $ownerId = $detail['owner'][0]['owner_id'] ?? null;

                $docs[$did] = [
                    'doc'     => $doc,
                    'meta'    => $meta,
                    'ownerId' => $ownerId,
                ];

                if ($ownerId) {
                    $ownerIds[$ownerId] = true;
                }
            }
        }

        // Single batch user fetch
        $usersMap = [];
        if (!empty($ownerIds)) {
            $ids = '[' . implode(',', array_keys($ownerIds)) . ']';

            $fetched = Manager::getService('account')
                ->fetch("user/{$ids}")
                ->getShape('data')
                ->get();

            foreach ($fetched as $uid => $userData) {
                $user = $userData[0] ?? null;
                if ($user) {
                    $usersMap[$user['id']] = trim(
                        ($user['firstname'] ?? '') . ' ' . ($user['lastname'] ?? '')
                    );
                }
            }
        }

        // Build response
        $documents = [];
        foreach ($docs as $did => $entry) {
            $doc       = $entry['doc'];
            $meta      = $entry['meta'];
            $ownerId   = $entry['ownerId'];
            $sizeBytes = $meta['file']['size'] ?? 0;
            $mimeType  = $meta['file']['type'] ?? null;

            $documents[] = [
                'id'          => $doc['id'],
                'name'        => $doc['name'],
                's3_key'       => $doc['s3_key'],
                'created_at'   => $doc['created_at'],
                'uploaded_by'  => $usersMap[$ownerId] ?? null,
                'file_size'    => $sizeBytes ? round($sizeBytes / 1024, 2) . ' KB' : null,
                'file_type'    => $mimeType
                    ? strtoupper(explode('/', $mimeType)[1])
                    : strtoupper(pathinfo($doc['name'], PATHINFO_EXTENSION)),
            ];
        }

        // To return latest first
        usort($documents, function ($a, $b) {
            return strtotime($b['created_at']) <=> strtotime($a['created_at']);
        });

        $a->set('data', $documents);
    }

    public function removeAttachments(Action $a): void
    {
        $docId      = $a->get('uriArgs.attachment_id');
        $parentId   = $a->get('uriArgs.tender_id');
        $entityId   = $a->get('uriArgs.id');
        $entityType = self::ENTITY_TYPE;
        $userId     = $a->get("user")['id'];

        $category = $this->fetchCategory(
            $entityId,
            $entityType,
            $parentId
        );

        $category = reset($category);

        if (!$category) {
            throw new MiddlewareException(
                "noEntityFound",
                "Attachment category not found."
            );
        }

        $catId = $category['id'];

        // Get Document details
        $docDetails = Manager::getService('document')
            ->fetch("document/{$docId}")
            ->getShape('data')
            ->toArray();

        if (empty($docDetails)) {
            throw new MiddlewareException(
                "noEntityFound",
                "Attachment not found."
            );
        }

        $s3Key = $docDetails['s3_key'] ?? null;

        try {
            // Remove from S3
            if ($s3Key) {
                $res = Manager::getService('s3')->remove(
                    basename($s3Key),
                    self::S3_BUCKET,
                    'tender_recommendation/attachment'
                );

                $statusCode = $res['@metadata']['statusCode'] ?? null;

                if ($statusCode !== 204) {
                    throw new MiddlewareException(
                        "InvalidStatus",
                        "S3 delete failed for {$s3Key}"
                    );
                }
            }

            // Remove owner
            Manager::getService('document')->delete(
                "document/{$docId}/owner?owner_id={$userId}"
            );

            // Remove category mapping
            Manager::getService('document')->delete(
                "category/{$catId}/document/{$docId}"
            );

            // Remove document
            Manager::getService('document')->delete(
                "document/{$docId}"
            );

            $a->set('payload', [
                'success' => true
            ]);

        } catch (\Throwable $e) {

            throw new MiddlewareException(
                "EndpointFetchFailure",
                $e->getMessage()
            );
        }
    }

    public function getAttachmentsForDownloadManager(Action $a): void
    {
        $id        = (int) $a->get('uriArgs.id');
        $projectId = (int) $a->get('uriArgs.project_id');

        // Tender Recommendation from project and recommendation id
        $recommendation = Manager::getService('project')
        ->fetch("project/{$projectId}/tender_recommendation/{$id}")
        ->getShape('data')
        ->get();

        if (empty($recommendation)) {
            $a->set('data', ['error' => 'Tender recommendation not found']);
            return;
        }

        $recommendation = reset($recommendation);
        $tenderId = $recommendation['tender_id'] ?? null;
        $a->set('uriArgs.tender_id', $tenderId);

        // Fetch project details
        $project = [];
        $projectData = Manager::getService('project')
            ->fetch("project/{$projectId}")
            ->getShape('data')
            ->get();
        $project = $projectData[0] ?? $projectData ?? [];

        // Fetch tender/package details
        $tender = [];
        if ($tenderId) {
            $tenderData = Manager::getService('project')
                ->fetch("project/{$projectId}/tender/{$tenderId}")
                ->getShape('data')
                ->get();
            $tender = $tenderData[0] ?? $tenderData ?? [];
        }

        $submittedBy = null;
        $submitterId = $recommendation['author_id'] ?? null;

        if ($submitterId) {
            $userFetch = Manager::getService('account')
                ->fetch("user/[{$submitterId}]")
                ->getShape('data')
                ->get();

            $userFetch = reset($userFetch);
            $user       = $userFetch[0] ?? null;

            if ($user) {
                $submittedBy = trim(($user['firstname'] ?? '') . ' ' . ($user['lastname'] ?? ''));
            }
        }

        // Summary
        $summary = [
            'project'         => $project['name'] ?? null,
            'package'         => $tender['label']  ?? null,
            'submitted_by'    => $submittedBy ?? null,
            'submission_date' => $recommendation['created_at'] ?? null,
        ];

        // Build documents response
        $documents = $this->buildDocumentsList($id, $tenderId);

        // Final response
        $a->set('data', [
            'project_details' => $summary,
            'documents'       => $documents,
        ]);

    }

    // Private methods

    private function extractFilesFromRequest(array $rawFile): array
    {
        $files = [];

        // Multiple files
        if (is_array($rawFile['name'])) {

            foreach ($rawFile['name'] as $i => $name) {
                $files[] = [
                    'name'     => $name,
                    'type'     => $rawFile['type'][$i] ?? null,
                    'tmp_name' => $rawFile['tmp_name'][$i] ?? null,
                    'size'     => $rawFile['size'][$i] ?? 0,
                    'error'    => $rawFile['error'][$i] ?? UPLOAD_ERR_NO_FILE,
                ];
            }

            return $files;
        }

        // Single file
        return [[
            'name'     => $rawFile['name'] ?? null,
            'type'     => $rawFile['type'] ?? null,
            'tmp_name' => $rawFile['tmp_name'] ?? null,
            'size'     => $rawFile['size'] ?? 0,
            'error'    => $rawFile['error'] ?? UPLOAD_ERR_NO_FILE,
        ]];
    }

    private function assertTenderMatchesParent(int $projectId, int $entityId, int $parentId): array
    {
        $trData  = Manager::getService('project')
                    ->fetch("project/{$projectId}/tender_recommendation/{$entityId}")
                    ->getShape('data')
                    ->toArray();

        $trArray = reset($trData);

        if (!empty($trArray) && $parentId !== (int) $trArray['tender_id']) {
            throw new MiddlewareException("noEntityFound", "Tender ID mismatched.");
        }

        return $trArray;
    }

    private function validateFiles(array $files): array
    {
        $validFiles   = [];
        $invalidFiles = [];

        foreach ($files as $file) {
            if (empty($file['name'])) {
                continue;
            }

            $ext = strtolower(pathinfo($file['name'], PATHINFO_EXTENSION));

            if (!in_array($ext, self::ALLOWED_EXTENSIONS, true)) {
                $invalidFiles[] = [
                    'name'   => $file['name'],
                    'reason' => "Unsupported file type '{$ext}'. Allowed: PDF, DOCX, XLSX, PNG, JPG",
                ];
                continue;
            }

            if ($file['error'] !== 0) {
                $invalidFiles[] = [
                    'name'   => $file['name'],
                    'reason' => "File upload failed (code: {$file['error']})",
                ];
                continue;
            }

            $mimeType = $this->detectMimeType($file['tmp_name'] ?? null);

            // xlsx special case — finfo detects as application/zip
            if ($ext === 'xlsx' && $mimeType === 'application/zip') {
                $mimeType = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
            }

            if (!$mimeType || !in_array($mimeType, self::ALLOWED_MIME_TYPES, true)) {
                $invalidFiles[] = [
                    'name'   => $file['name'],
                    'reason' => "File content does not match extension '{$ext}'",
                ];
                continue;
            }

            if (($file['size'] ?? 0) > self::MAX_SIZE_BYTES) {
                $sizeMB         = round(($file['size'] ?? 0) / 1024 / 1024, 2);
                $invalidFiles[] = [
                    'name'   => $file['name'],
                    'reason' => "Exceeds maximum size of 25MB (uploaded: {$sizeMB}MB)",
                ];
                continue;
            }

            $file['detected_mime'] = $mimeType;
            $validFiles[]          = $file;
        }

        return [$validFiles, $invalidFiles];
    }

    private function prepareUploadContext(int $entityId, string $entityType, int $parentId): array
    {
        return [
            'catId'       => $this->resolveCategory($entityId, $entityType, $parentId),
            'docTypeId'   => $this->getDocumentConfigId('document/type', self::DOC_TYPE),
            'docSubTypeId'=> $this->getDocumentConfigId('document/subtype', self::DOC_SUBTYPE),
        ];
    }

    private function uploadSingleFile(array $file, array $categoryContext, array $user): array
    {
        $docId = null;

        try {
            $safeFileName = $this->sanitizeFilename($file['name']);

            $docResponse = json_decode(
                Manager::getService('document')
                    ->write('document', new Shape(['data' => [
                        'name'      => $safeFileName,
                        'type'      => $categoryContext['docTypeId']    ?? 0,
                        'subtype'   => $categoryContext['docSubTypeId'] ?? 0,
                        'owner_id'  => (int) ($user['id']   ?? 0),
                        'meta'      => null,
                        's3_bucket' => self::S3_BUCKET,
                    ]]))
                    ->get('content'),
                true
            );

            $docId = $docResponse['data']['id'] ?? null;

            if (!$docId) {
                return ['name' => $file['name'], 'reason' => "Failed to create document record"];
            }

            $s3Key = Manager::getService('s3')->getKey(
                "{$docId}-{$safeFileName}",
                self::S3_FOLDER,
                self::S3_TAGS
            );

            Manager::getService('s3')->uploadContent(
                self::S3_BUCKET,
                $s3Key,
                file_get_contents($file['tmp_name']),
                ['ContentType' => $file['detected_mime'] ?? 'application/octet-stream']
            );

            Manager::getService('document')->update(
                "document/{$docId}",
                new Shape(['data' => [
                    's3_key' => $s3Key,
                    'meta'   => json_encode(['file' => [
                        'size' => (int) ($file['size'] ?? 0),
                        'type' => $file['detected_mime'] ?? null,
                    ]]),
                ]])
            );

            if (!empty($categoryContext['catId'])) {
                Manager::getService('document')->update(
                    "category/{$categoryContext['catId']}/document/{$docId}",
                    new Shape([])
                );
            }

            return ['document_id' => $docId, 'name' => $file['name']];

        } catch (\Throwable $e) {
            if ($docId && method_exists(Manager::getService('document'), 'delete')) {
                try {
                    Manager::getService('document')->delete("document/{$docId}");
                } catch (\Throwable $ignored) {}
            }

            return ['name' => $file['name'], 'reason' => $e->getMessage()];
        }
    }

    private function buildUploadPayload(
        array   $user,
        mixed   $project,
        ?int    $catId,
        array   $uploaded,
        array   $skipped
    ): Shape {
        return (new Shape([]))
            ->set('author_id',  $user['id']  ?? null)
            ->set('project_id', $project ? $project->get('id') : null)
            ->set('category_id', $catId)
            ->set('uploaded',   $uploaded)
            ->set('skipped',    $skipped);
    }

    // Helper functions

    private function resolveCategory(int $entityId, string $entityType, int $parentId): int
    {
        $existing = $this->fetchCategory($entityId, $entityType, $parentId);

        if (!empty($existing)) {
            return (int) reset($existing)['id'];
        }

        try {
            $response = json_decode(
                Manager::getService('document')->write('category', new Shape([
                    'data' => [
                        'label'       => self::DOCUMENT_LABEL,
                        'entity_id'   => $entityId,
                        'entity_type' => $entityType,
                        'parent_id'   => $parentId,
                    ]
                ]))->get('content'),
                true
            );

            $catId = $response['data']['id'] ?? null;

            if (!$catId) {
                throw new MiddlewareException("TenderRecommendationDocumentFailed", "Failed to create document category");
            }

            return (int) $catId;

        } catch (\Throwable $e) {
            $existing = $this->fetchCategory($entityId, $entityType, $parentId);

            if (!empty($existing)) {
                return (int) reset($existing)['id'];
            }

            throw new MiddlewareException("TenderRecommendationDocumentFailed", "Failed to create document category");
        }
    }

    private function fetchCategory(int $entityId, string $entityType, int $parentId): array
    {
        return Manager::getService('document')
            ->fetch("category",
                    [
                        'entity_id'  => $entityId,
                        'entity_type'=> $entityType,
                        'parent_id'  => $parentId
                    ])
            ->getShape('data')
            ->get();
    }

    private function detectMimeType(?string $tmpName): ?string
    {
        if (!$tmpName || !is_file($tmpName)) {
            return null;
        }

        if (!class_exists(\finfo::class)) {
            return null;
        }

        $mimeType = (new \finfo(FILEINFO_MIME_TYPE))->file($tmpName);

        return $mimeType ?: null;
    }

    private function sanitizeFilename(string $fileName): string
    {
        $fileName = trim($fileName);
        $fileName = preg_replace('/[^\w.\-]+/u', '_', $fileName);
        $fileName = preg_replace('/_+/', '_', $fileName);

        return $fileName ?: 'file';
    }

    private function getDocumentConfigId(string $endpoint, string $uid): int
    {
        $items = Manager::getService('document')
            ->fetch($endpoint)
            ->getShape('data')
            ->get();

        foreach ($items as $item) {
            if (($item['uid'] ?? null) === $uid) {
                return (int) $item['id'];
            }
        }

        throw new MiddlewareException("noEntityFound", "Document config '{$uid}' not found at '{$endpoint}'");
    }

    private function isExistingMediaPayload(array $dataArray): bool
    {
        return isset($dataArray[0])
            && is_array($dataArray[0])
            && !empty($dataArray[0]['isExistingMedia']);
    }

    private function extractExistingMediaItems(array $dataArray): array
    {
        if (!$this->isExistingMediaPayload($dataArray)) {
            return [];
        }

        $items = [];

        foreach ($dataArray as $item) {
            if (is_array($item) && !empty($item['isExistingMedia'])) {
                $items[] = $item;
            }
        }

        return $items;
    }

    private function buildDocumentsList(int $entityId, int $parentId): array
    {
        $entityType = self::ENTITY_TYPE;
        $existing   = $this->fetchCategory($entityId, $entityType, $parentId);

        $docs   = [];
        $docIds = [];

        // Collect documents and ids
        foreach ($existing as $category) {
            foreach ($category['documents'] ?? [] as $doc) {
                $did = $doc['id'] ?? null;

                if (!$did) {
                    continue;
                }

                $docs[$did]   = $doc;
                $docIds[$did] = $did;
            }
        }

        if (empty($docIds)) {
            return [];
        }

        // Fetch all documents in single request
        $detailsMap = [];
        $ownerIds   = [];

        $ids = '[' . implode(',', array_keys($docIds)) . ']';

        try {
            $fetched = Manager::getService('document')
                ->fetch("document/{$ids}")
                ->getShape('data')
                ->get();

            foreach ($fetched as $did => $detailData) {
                $detail = $detailData[0] ?? $detailData;

                if (empty($detail['id'])) {
                    continue;
                }

                $ownerId = $detail['owner'][0]['owner_id'] ?? null;

                if ($ownerId) {
                    $ownerIds[$ownerId] = true;
                }

                $detailsMap[$did] = [
                    'detail'  => $detail,
                    'ownerId' => $ownerId,
                ];
            }
        } catch (\Throwable $e) {

        }

        // Batch fetch users
        $usersMap = [];

        if (!empty($ownerIds)) {
            $userIds = '[' . implode(',', array_keys($ownerIds)) . ']';

            try {
                $fetched = Manager::getService('account')
                    ->fetch("user/{$userIds}")
                    ->getShape('data')
                    ->get();

                foreach ($fetched as $uid => $userData) {
                    $user = $userData[0] ?? null;

                    if ($user) {
                        $usersMap[$uid] = trim(
                            ($user['firstname'] ?? '') . ' ' . ($user['lastname'] ?? '')
                        );
                    }
                }
            } catch (\Throwable $e) {

            }
        }

        $documents = [];

        foreach ($docs as $did => $doc) {

            // Safe meta decode
            $meta = [];

            if (!empty($doc['meta'])) {
                $decoded = json_decode($doc['meta'], true);
                $meta    = is_array($decoded) ? $decoded : [];
            }

            $ownerId   = $detailsMap[$did]['ownerId'] ?? null;
            $sizeBytes = $meta['file']['size'] ?? 0;
            $mimeType  = $meta['file']['type'] ?? null;

            $fileType = strtoupper(pathinfo($doc['name'], PATHINFO_EXTENSION));

            if ($mimeType && str_contains($mimeType, '/')) {
                $parts    = explode('/', $mimeType);
                $mimePart = strtoupper($parts[1] ?? '');

                if ($mimePart && strlen($mimePart) <= 10 && !str_contains($mimePart, '.')) {
                    $fileType = $mimePart;
                }
            }

            $documents[] = [
                'id'          => $doc['id'],
                'name'        => $doc['name'],
                's3_key'      => $doc['s3_key'],
                'created_at'  => $doc['created_at'],
                'uploaded_by' => $usersMap[$ownerId] ?? null,
                'file_size'   => $sizeBytes
                    ? round($sizeBytes / 1024, 2) . ' KB'
                    : null,
                'file_type'   => $fileType ?: null,
            ];
        }

        usort($documents, static function ($a, $b) {
            return strtotime($b['created_at'] ?? '1970-01-01')
                <=> strtotime($a['created_at'] ?? '1970-01-01');
        });

        return $documents;
    }

    public static function downloadAttachment(Action $a): void
    {
        $id        = (int) $a->get('uriArgs.id');
        $projectId = (int) $a->get('uriArgs.project_id');

        // Fetch document details
        try {
            $docData = Manager::getService('document')
                ->fetch("document/{$id}")
                ->getShape('data')
                ->get();
            if (empty($docData['s3_key'])) {
                throw new MiddlewareException(
                    "noEntityFound",
                    "Document not found."
                );
            }
        } catch (\Throwable $e) {
            throw new MiddlewareException(
                "EndpointFetchFailure",
                $e->getMessage()
            );
        }

        $s3Key   = $docData['s3_key'];
        $name    = $docData['name'] ?? basename($s3Key);
        $savePath = Config::get('document.save.tmp', '/tmp');

        if (!is_dir($savePath)) {
            if (!mkdir($savePath, 0755, true) && !is_dir($savePath)) {
                throw new MiddlewareException(
                    "EndpointFetchFailure",
                    "Unable to create temporary directory."
                );
            }
        }

        // Unique temp storage for concurrent downloads
        $tmpFile = $savePath . '/' . uniqid('doc_', true) . '_' . basename($name);

        try {
            Manager::getService('s3')->save('asset', $s3Key, $tmpFile);

            if (!file_exists($tmpFile)) {
                throw new MiddlewareException(
                    "noEntityFound",
                    "File not found."
                );
            }

            $mimeType = mime_content_type($tmpFile) ?: 'application/octet-stream';

            header('Content-Type: ' . $mimeType);
            header('Content-Disposition: attachment; filename="' . addslashes($name) . '"');
            header('Content-Length: ' . filesize($tmpFile));
            header('Cache-Control: no-store');

            readfile($tmpFile);
            exit;
        } finally {
            if (file_exists($tmpFile)) {
                unlink($tmpFile);
            }
        }
    }

    public function downloadAttachmentsAsZip(Action $a): void
    {
        $id        = (int) $a->get('uriArgs.id');
        $projectId = (int) $a->get('uriArgs.project_id');

        try {
            $documents = $this->buildDocumentsList(
                $id,
                $this->getTenderId($id, $projectId)
            );
        } catch (\Throwable $e) {
            throw new MiddlewareException(
                "EndpointFetchFailure",
                $e->getMessage()
            );
        }

        if (empty($documents)) {
            throw new MiddlewareException(
                "noEntityFound",
                "Document not found."
            );
        }

        // Temp directory setup
        $savePath = rtrim(Config::get('document.save.tmp', '/tmp'), '/');

        if (!is_dir($savePath) && !mkdir($savePath, 0755, true) && !is_dir($savePath)) {
            throw new MiddlewareException(
                "EndpointFetchFailure",
                "Could not create temp directory."
            );
        }

        // Unique session folder for concurrent downloads
        $sessionDir = $savePath . '/zip_' . uniqid('', true);

        if (!mkdir($sessionDir, 0755, true) && !is_dir($sessionDir)) {
            throw new MiddlewareException(
                "EndpointFetchFailure",
                "Could not create temporary session directory."
            );
        }

        $zipPath    = $sessionDir . '/attachments.zip';
        $zip        = new ZipArchive();
        $tmpFiles   = [];
        $addedFiles = 0;

        if ($zip->open($zipPath, ZipArchive::CREATE) !== true) {
            throw new MiddlewareException(
                "EndpointFetchFailure",
                "Could not create ZIP file."
            );
        }

        try {

            // Downloading from s3 and adding in zip
            foreach ($documents as $doc) {

                $s3Key = $doc['s3_key'] ?? null;
                $name  = $doc['name'] ?? basename((string) $s3Key);
                $bucket = $doc['s3_bucket'] ?: 'asset';

                if (!$s3Key) {
                    continue;
                }

                // Unique tmp file
                $tmpFile    = $sessionDir . '/' . uniqid('', true) . '_' . basename($name);
                $tmpFiles[] = $tmpFile;

                try {

                    Manager::getService('s3')->save($bucket, $s3Key, $tmpFile);

                    if (file_exists($tmpFile)) {

                        $zipEntryName = basename($name);

                        // Handling duplicate names in zip
                        if ($zip->locateName($zipEntryName) !== false) {
                            $zipEntryName = uniqid('', true) . '_' . $zipEntryName;
                        }

                        $zip->addFile($tmpFile, $zipEntryName);

                        $addedFiles++;
                    }

                } catch (\Throwable $e) {

                    // Continue if any file fails rest are not blocked
                    continue;
                }
            }

            $zip->close();

            // If no valid files
            if ($addedFiles === 0) {
                throw new MiddlewareException(
                    "EndpointFetchFailure",
                    "No valid files found for ZIP."
                );
            }

            // If zip exists and is empty
            if (!file_exists($zipPath) || filesize($zipPath) === 0) {
                throw new MiddlewareException(
                    "EndpointFetchFailure",
                    "Could not create ZIP file."
                );
            }

            $downloadName = 'tender_recommendation_' . $id . '_attachments.zip';

            // Output buffer clear prevent corrupt ZIP file
            if (ob_get_level()) {
                ob_end_clean();
            }

            header('Content-Type: application/zip');
            header('Content-Disposition: attachment; filename="' . $downloadName . '"');
            header('Content-Length: ' . filesize($zipPath));
            header('Cache-Control: no-store');

            readfile($zipPath);

        } finally {

            // Zip handle in finally for unexpected exception
            if (isset($zip) && $zip instanceof ZipArchive) {
                $zip->close();
            }

            // Cleanup
            foreach ($tmpFiles as $tmpFile) {

                if (file_exists($tmpFile)) {
                    unlink($tmpFile);
                }
            }

            if (file_exists($zipPath)) {
                unlink($zipPath);
            }

            if (is_dir($sessionDir)) {
                rmdir($sessionDir);
            }
        }

        exit;
    }

    // Fetch tender ID
    private function getTenderId(int $id, int $projectId): int
    {
        $data = Manager::getService('project')
            ->fetch("project/{$projectId}/tender_recommendation/{$id}")
            ->getShape('data')
            ->get();

        $recommendation = reset($data);
        return (int) ($recommendation['tender_id'] ?? 0);
    }

    private function getExistingDocsFromCategory(int $entityId, string $entityType, int $parentId): array
    {
        $existing = $this->fetchCategory($entityId, $entityType, $parentId);
        $docs     = [];

        foreach ($existing as $category) {
            foreach ($category['documents'] ?? [] as $doc) {
                if (!empty($doc['id']) && !empty($doc['name'])) {
                    $docs[] = $doc;
                }
            }
        }

        return $docs;
    }

    private function resolveVersionedName(string $newName, array $existingDocs): string
    {
        $ext          = pathinfo($newName, PATHINFO_EXTENSION);
        $baseName     = $ext ? substr($newName, 0, -(strlen($ext) + 1)) : $newName;
        $baseStripped = preg_replace('/-v\d+$/', '', $baseName);

        $takenVersions = [];

        foreach ($existingDocs as $doc) {
            $existingExt      = pathinfo($doc['name'], PATHINFO_EXTENSION);
            $existingBase     = $existingExt
                ? substr($doc['name'], 0, -(strlen($existingExt) + 1))
                : $doc['name'];
            $existingStripped = preg_replace('/-v\d+$/', '', $existingBase);

            if (strtolower($existingStripped) === strtolower($baseStripped)) {
                if (preg_match('/-v(\d+)$/', $existingBase, $matches)) {
                    $takenVersions[] = (int) $matches[1]; // v1, v2...
                } else {
                    $takenVersions[] = 0;
                }
            }
        }

        if (empty($takenVersions)) {
            return $newName; // Duplication check
        }

        $nextVersion = max($takenVersions) + 1;

        return $ext
            ? "{$baseStripped}-v{$nextVersion}.{$ext}"
            : "{$baseStripped}-v{$nextVersion}";
    }

}
