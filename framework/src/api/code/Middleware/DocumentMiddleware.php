<?php

namespace Api\Middleware;

use Core\Config;
use Core\Data\Collection;
use Core\Data\Shape;
use Core\Service\Manager;
use Core\Middleware\Exception as MiddlewareException;

class DocumentMiddleware{

    public CONST CONTRACTUAL_DOCUMENT_TYPE_ID = 2;

    /**
     * States in which a snapshot is finished and can be served.
     */
    private const SNAPSHOT_READY_STATES = ['ready', 'ready_partial'];

    /**
     * The label an issuance files its own generated documents under.
     */
    private const ISSUANCE_CATEGORY_LABEL = 'Tender Addendum';

    /**
     * Comparison outcomes that leave an addendum's change set unusable as a
     * record of what it altered.
     */
    private const UNUSABLE_COMPARISON_STATES = ['no_baseline', 'failed'];

    /**
     * Shown when the addendum lists nothing because the comparison could not be
     * established.
     */
    private const NOT_ESTABLISHED_NOTICE = 'The changes for this addendum could not be established.';

    private const DOWNLOAD_LOG_ENTITY_TYPE = 'tender_document_download';

    private const DOWNLOAD_LOG_TYPE = 'Downloaded';

    public static function getUKDateTime($datetime = null): array
    {
        $datetime = $datetime ?? 'now';
        $date = new \DateTime($datetime, new \DateTimeZone('UTC'));
        $date->setTimezone(new \DateTimeZone('Europe/London'));
        return [
            'date' => $date->format('d/m/Y'),
            'time' => $date->format('H:i'),
        ];
    }

    /**
     * @param string $documentFieldKey
     * @param string $documentValueKey
     * @param bool $returnAsList
     * @return \Closure
     */
    public static function fetchDocument(string $documentFieldKey = 'id', string $documentValueKey = '', bool $returnAsList = false): \Closure
    {
        return function (Shape $action) use ($documentFieldKey, $documentValueKey, $returnAsList) {
            try {
                $document = Manager::getService("document")->fetch("document", [
                    $documentFieldKey => $action->get($documentValueKey)
                ])->getCollection('data');
                if ($document->count()) {
                    return $action->set("document", $document);
                }
            } catch (\Exception $e) {
                throw new MiddlewareException("noDocumentFound", $e->getMessage());
            }

            throw new MiddlewareException("noDocumentFound", "The project with " . $documentFieldKey . "=" . $action->get($documentValueKey) . " has not been found");
        };
    }

    /**
     * @param string $documentIdKey
     * @param string $testKey
     * @return \Closure
     */
    public static function checkDocumentOwnershipById(string $documentIdKey = "document", string $testKey="account.id"): \Closure
    {
        return function (Shape $action) use ($documentIdKey, $testKey) {
            $allowed = false;
            if ($documentIdKey) {
                $testKeyId = $action->int($testKey);
                $action->get($documentIdKey)->map(function($document) use ($testKeyId, &$allowed){
                    $owners = (new Collection($document->get("owner"), Shape::class));
                    $owners->map(function($owner) use ($testKeyId, &$allowed){
                        if ($testKeyId === (int)$owner->get("owner_id")) {
                            $allowed = true;
                        }
                        return $owner;
                    });
                    return $document;
                });
            }
            if(!$allowed){
                throw new MiddlewareException("documentOwnershipError", "You don't have access to the document.");
            }
            return true;
        };
    }

    /**
     * @param string $documentKey
     * @return \Closure
     */
    public static function downloadDocument(string $documentKey = 'document'): \Closure
    {
        return function($action) use ($documentKey) {
            $document  = $action->getCollection($documentKey)->first();
            $save_path = Config::get('document.save.tmp', '/tmp');
            if(!is_dir($save_path)){
                if ( !mkdir($save_path, 0755) && !is_dir($save_path) ) {
                    throw new \RuntimeException(sprintf('Directory "%s" was not created', $save_path));
                }
            }
            $save_to  =  $save_path . "/" . $document->get("name");
            $bucket = ($document->int("type") === self::CONTRACTUAL_DOCUMENT_TYPE_ID) ? 'pdf' : ($document->get("s3_bucket") ?: 'asset');
            Manager::getService("s3")->save($bucket, $document->get("s3_key"), $save_to);
            $action->set("output", $save_to);

            self::recordDownloads($action, [[
                'id'       => $document->int("id"),
                'filename' => (string) $document->get("name"),
            ]], 'individual');
        };
    }

    /**
     * @return callable
     */
    public static function outputDocument(): callable
    {
        return function ($action) {
            $output = $action->get("output");
            if ($output) {
                $inline = $action->get("inline_display", false);
                $filename = basename($output);

                // Determine content type and disposition based on inline parameter
                $ext = strtolower(pathinfo($filename, PATHINFO_EXTENSION));
                if ($inline && $ext == "pdf") {
                    $contentType = 'application/pdf';
                    $disposition = 'inline';
                } else {
                    $contentType = 'application/octet-stream';
                    $disposition = 'attachment';
                }

                header('Content-Description: File Transfer');
                header("Content-Type: $contentType");
                header("Content-Disposition: $disposition; filename=" . $filename);
                header('Content-Transfer-Encoding: binary');
                header('Expires: 0');
                header('Cache-Control: must-revalidate, post-check=0, pre-check=0');
                header('Pragma: public');
                header('Content-Length: ' . filesize($output));

                while (ob_get_level() > 0) {
                    ob_end_clean();
                }

                if (readfile($output) === false) {
                    throw new MiddlewareException("serviceError", "Failed to Download file.");
                }
                exit;
            }
        };
    }

    /**
     * @param string $documentId
     * @return \Closure
     *
     * Usage:
     * $action->get('document_signers')
     */
    public static function fetchDocumentSigners(string $documentId = 'uriArgs.did'): \Closure
    {
        return function (Shape $action) use ($documentId) {
            try {
                $document = Manager::getService("document")->fetch(sprintf("document/%s/signers", $action->get($documentId)))->getCollection('data');
                if ($document->count()) {
                    return $action->set("document_signers", $document->getitems());
                } else {
                    return $action->set("document_signers", []);
                }
            } catch (\Exception $e) {
                throw new MiddlewareException("documentSignersError", $e->getMessage());
            }
        };
    }

    /**
     * @param bool $returnAsList
     * @return \Closure
     *
     * Usage:
     * $action->get('document_signatory_statuses')
     */
    public static function fetchSignatoryStatuses(bool $returnAsList = false): \Closure
    {
        return function (Shape $action) use ($returnAsList) {
            try {
                $document = Manager::getService("document")->fetch("signatory/status")->getCollection('data');
                return $action->set("document_signatory_statuses", $returnAsList ? $document->getItemsAsArray() : $document);
            } catch (\Exception $e) {
                throw new MiddlewareException("documentSignatoryStatusError", $e->getMessage());
            }
        };
    }

    /**
     * @param string $orderKey
     * @return \Closure
     *
     * Usage:
     * $action->get('order_data')
     */
    public static function extractDataFromOrder(string $orderKey = ''): \Closure
    {
        return function (Shape $action) use ($orderKey) {
            $orders = $action->get($orderKey);
            $data = [];
            if ($orders) {
                array_map(function($template) use (&$data){
                    if (isset($template["documents"]) && is_array($template["documents"])) {
                        array_map(function($document) use (&$data){
                            $meta = json_decode($document["meta"], true);
                            if ($meta && isset($meta["quote"])) {
                                $data['dids'][$document["id"]] = $document["id"];
                                $data['quotes'][$document["id"]] = $meta["quote"];
                                if (isset($meta["quote"]['tender_id'])) {
                                    $data['tids'][$meta["quote"]['tender_id']] = $meta["quote"]['tender_id'];
                                }
                            }
                        }, $template["documents"]);
                    }
                }, $orders);
            }
            return $action->set("order_data", $data);
        };
    }

    /**
     * @param string $transactionsKey
     * @return \Closure
     *
     * Usage:
     * $action->get('orders')
     */
    public static function getOrderDataFromTenders(string $transactionsKey = 'transactions'): \Closure
    {
        return function (Shape $action) use ($transactionsKey) {
            $tenders = $action->get($transactionsKey);
            $order_data = [];
            foreach($tenders as $tender){
                $order_data[$tender['id']] = $tender;
            }
            return $action->set("orders", $order_data);
        };
    }

    /**
     * @return \Closure
     *
     */
    public static function replaceDocuemnt(): \Closure
    {
        return function (Shape $action) {
            try {
                $did        = $action->get('did');
                $cid        = $action->get('cid');
                $documentId = $action->get('documentId');

                if ($cid) {
                    self::updateDocumentCategoryMapping($cid, $documentId, $did);
                } else {
                    $res = Manager::getService('document')->fetch("category/document/{$did}")->getCollection('data');
                    $categoryIds = $res->values('category_id');

                    foreach ($categoryIds as $categoryId) {
                        self::updateDocumentCategoryMapping($categoryId, $documentId, $did);
                    }
                }
            } catch (\Exception $e) {
                throw new MiddlewareException("serviceError", $e->getMessage());
            }
        };
    }

    /**
     * @param int $categoryId
     * @param int $documentId
     * @param int $oldDocumentId
     * @return void
     */
    public static function updateDocumentCategoryMapping($categoryId, $documentId, $oldDocumentId) : void
    {
        Manager::getService('document')->delete("category/{$categoryId}/document/{$oldDocumentId}");

        Manager::getService('document')->update("category/{$categoryId}/document/{$documentId}", new Shape());
    }

    /**
     * @param string $documentKey
     * @return \Closure
     */
    public static function fetchDocumentSnapshot(string $documentKey = 'document'): \Closure
    {
        return function (Shape $action) use ($documentKey) {
            $document = $action->getCollection($documentKey)->first();
            if (!$document) {
                throw new MiddlewareException("noDocumentFound", "The requested document was not found.");
            }

            $meta         = json_decode($document->get("meta") ?: '{}', true);
            $snapshot     = self::resolveSnapshot($meta['snapshot'] ?? null);
            $tempSnapshot = $meta['temp_snapshot'] ?? null;

            if ($snapshot) {
                $data = self::prepareSnapshotData($document, $snapshot);
                return $action->set("snapshot", $data);
            } elseif ($tempSnapshot && !empty($tempSnapshot['categories'])) {
                $data = self::preparePreviewSnapshotData($tempSnapshot, $meta['values'] ?? []);
                return $action->set("snapshot", $data);
            }

            throw new MiddlewareException("badRequest", "No snapshot metadata associated with document.");
        };
    }


    /**
     * Picks the snapshot the download manager should serve.
     *
     * Document meta keys snapshots by mode and id - snapshot.enquiry.<id>,
     * snapshot.addendum.<id> - so an enquiry and the addenda issued after it can
     * sit on the same document. Meta written before that holds a single
     * snapshot object directly under `snapshot`. Both shapes are accepted here;
     * the newest finished snapshot wins.
     *
     * @param mixed $snapshot
     * @return array Empty when nothing is ready to serve.
     */
    private static function resolveSnapshot($snapshot): array
    {
        if (!is_array($snapshot) || !$snapshot) {
            return [];
        }

        $resolved = [];
        foreach (self::flattenSnapshots($snapshot) as $candidate) {
            $state = $candidate['details']['state'] ?? '';
            if (empty($candidate['categories']) || !in_array($state, self::SNAPSHOT_READY_STATES, true)) {
                continue;
            }

            $candidateAt = $candidate['details']['created_at'] ?? ($candidate['details']['last_updated_at'] ?? '');
            $resolvedAt  = $resolved['details']['created_at'] ?? ($resolved['details']['last_updated_at'] ?? '');

            if (!$resolved || strcmp($candidateAt, $resolvedAt) >= 0) {
                $resolved = $candidate;
            }
        }

        return $resolved;
    }

    /**
     * Flattens `snapshot` into a plain list of snapshot objects, whichever of
     * the three historical shapes it is in.
     *
     * @param array $snapshot
     * @return array
     */
    private static function flattenSnapshots(array $snapshot): array
    {
        if (isset($snapshot['details']) || isset($snapshot['categories'])) {
            return [$snapshot];
        }

        $flat = [];
        foreach ($snapshot as $bucket) {
            if (!is_array($bucket)) {
                continue;
            }

            if (isset($bucket['details']) || isset($bucket['categories'])) {
                $flat[] = $bucket;
                continue;
            }

            foreach ($bucket as $entry) {
                if (is_array($entry) && (isset($entry['details']) || isset($entry['categories']))) {
                    $flat[] = $entry;
                }
            }
        }

        return $flat;
    }

    /**
     * @param array $snapshot
     * @return bool
     */
    private static function isAddendumSnapshot(array $snapshot): bool
    {
        return ($snapshot['mode'] ?? '') === 'addendum';
    }




    /**
     * The uploads this addendum adds.
     *
     * @param int $tenderId
     * @param array $snapshot
     * @return array
     */
    private static function addendumAdditionalDocuments(int $tenderId, array $snapshot): array
    {
        $categories = self::fetchCategoryData($tenderId, 'tender', []);
        if (!is_array($categories)) {
            return $categories;
        }

        $alreadyIssued = array_flip(array_map('intval', $snapshot['issued_additional_document_ids'] ?? []));

        foreach ($categories as $key => $category) {
            $label = is_object($category) ? (string) $category->get('label') : (string) ($category['label'] ?? '');
            if (strpos($label, self::ISSUANCE_CATEGORY_LABEL) !== false) {
                unset($categories[$key]);
                continue;
            }

            $documents = is_object($category) ? $category->get('documents') : ($category['documents'] ?? []);
            $keep      = [];

            foreach (($documents ?: []) as $document) {
                $id = (int) (is_object($document) ? $document->get('id') : ($document['id'] ?? 0));
                if ($id && !isset($alreadyIssued[$id])) {
                    $keep[] = $document;
                }
            }

            if ($keep === []) {
                unset($categories[$key]);
                continue;
            }

            if (is_object($category)) {
                $category->set('documents', $keep);
            } else {
                $categories[$key]['documents'] = $keep;
            }
        }

        return $categories;
    }

    /**
     * @param array $snapshot
     * @return array
     */
    private static function addendumMetadata(array $snapshot): array
    {
        $number = (int) ($snapshot['addendum_number'] ?? 0);

        $state       = $snapshot['details']['comparison']['state'] ?? 'compared';
        $established = !in_array($state, self::UNUSABLE_COMPARISON_STATES, true);

        return [
            'number'              => $number ?: null,
            'label'               => $number ? 'Addendum ' . str_pad((string) $number, 2, '0', STR_PAD_LEFT) : null,
            'issued_at'           => $snapshot['details']['created_at'] ?? null,
            'reference'           => $snapshot['project_reference'] ?? '',
            'package_name'        => $snapshot['package_name'] ?? '',
            'changes_established' => $established,
            'notice'              => $established ? null : self::NOT_ESTABLISHED_NOTICE,
        ];
    }

    /**
     * Shapes one classified section for the addendum download page.
     *
     * Withdrawn documents are listed for reference only - the file is not part
     * of this issuance, so it carries no download.
     *
     * @param array $entries
     * @param bool $downloadable
     * @return array
     */
    private static function changeSection(array $entries, bool $downloadable = true): array
    {
        $section = [];
        foreach ($entries as $entry) {
            $documentId = (int) ($entry['id'] ?? 0);
            $downloadId = $entry['download_id'] ?? null;
            $stored     = $documentId > 0 && !empty($entry['s3_key']);
            $available  = $downloadable && ($stored || $downloadId !== null);

            $section[] = [
                'id'           => $available && $stored ? $documentId : null,
                'download_id'  => $available ? $downloadId : null,
                'download_uri' => $available ? ($entry['download_uri'] ?? null) : null,
                'source_type'  => $entry['source_type'] ?? '',
                'nd'           => $entry['nd'] ?? '',
                'name'         => ($entry['filename'] ?? '') ?: ($entry['doc_title'] ?? ''),
                'doc_ref'      => $entry['doc_ref'] ?? '',
                'doc_title'    => $entry['doc_title'] ?? '',
                'rev_no'       => $entry['rev_no'] ?? '',
                'downloadable' => $available,
                'changes'      => array_keys($entry['changes'] ?? []),
            ];
        }

        return $section;
    }

    /**
     * @param Shape $document
     * @param array $snapshot
     * @return array
     */
    private static function prepareSnapshotData(Shape $document, array $snapshot): array
    {
        $dids = [];
        foreach ($snapshot['categories'] as $category) {
            if (!empty($category['children'])) {
                $dids = array_merge($dids, self::extractSnapshotFileIds($category['children']));
            }
        }

        $projectId = $snapshot['project_id'] ?? 0;
        $tenderId  = $snapshot['tender_id'] ?? 0;

        if (!$projectId || !$tenderId) {
            throw new MiddlewareException("badRequest", "Snapshot context (Project/Tender ID) is missing.");
        }

        $data = [
            'state'    => $snapshot['details']['state'] ?? null,
            'progress' => $snapshot['details']['progress'] ?? null,
        ];

        // An addendum is described by what it changed, not by the full set of
        // documents it re-issues, so it replaces the numbered-document listing
        // with the four change sections.
        if (self::isAddendumSnapshot($snapshot)) {
            $changes = $snapshot['changes'] ?? [];

            $data['is_addendum']          = true;
            $data['addendum']             = self::addendumMetadata($snapshot);
            $data['updated_documents']    = self::changeSection($changes['updated'] ?? []);
            $data['new_documents']        = self::changeSection($changes['new'] ?? []);
            $data['withdrawn_documents']  = self::changeSection($changes['withdrawn'] ?? [], downloadable: false);
            $data['additional_documents'] = self::addendumAdditionalDocuments($tenderId, $snapshot);

            return $data;
        }

        $data['project_documents']        = self::fetchCategoryData($projectId, 'project_documents', $dids, docParentId: $document->get('id'));
        $data['tender_package_documents'] = self::fetchCategoryData($tenderId,  'tender_package_documents', $dids, docParentId: $document->get('id'), singleReturn: true);
        $data['additional_documents']     = self::fetchCategoryData($tenderId,  'tender', $dids);

        if (is_array($data['project_documents']) && !empty($data['project_documents'])) {
            uasort($data['project_documents'], function ($a, $b) {
                return strnatcasecmp($a->get('label') ?? '', $b->get('label') ?? '');
            });
            $data['project_documents'] = array_values($data['project_documents']);
        }

        return $data;
    }

    /**
     * @param array $tempSnapshot
     * @param array $values
     * @return array
     */
    private static function preparePreviewSnapshotData(array $tempSnapshot, array $values): array
    {
        $data = [
            'state'                    => 'snapshot_preview',
            'project_documents'        => [],
            'tender_package_documents' => null,
            'additional_documents'     => []
        ];

        if (self::isAddendumSnapshot($tempSnapshot) && !empty($tempSnapshot['changes'])) {
            $changes = $tempSnapshot['changes'];

            $data['is_addendum']         = true;
            $data['addendum']            = self::addendumMetadata($tempSnapshot);
            $data['updated_documents']   = self::changeSection($changes['updated'] ?? []);
            $data['new_documents']       = self::changeSection($changes['new'] ?? []);
            $data['withdrawn_documents'] = self::changeSection($changes['withdrawn'] ?? [], downloadable: false);

            $tenderId = $tempSnapshot['tender_id'] ?? 0;
            if ($tenderId) {
                $data['additional_documents'] = self::addendumAdditionalDocuments($tenderId, $tempSnapshot);
            }

            unset($data['project_documents'], $data['tender_package_documents']);

            return $data;
        }

        foreach ($tempSnapshot['categories'] as $cat) {
            $sourceType = $cat['source_type'] ?? '';

            foreach ($cat['children'] as $folder) {
                if ($sourceType === 'project_documents' && isset($folder['name'])) {
                    $ndKey = preg_replace_callback('/^ND(\d+)$/i', function ($m) {
                        return 'nd_' . str_pad($m[1], 2, '0', STR_PAD_LEFT);
                    }, $folder['name']);

                    if (!isset($values[$ndKey]) || $values[$ndKey] == 1) {
                        continue;
                    }
                }

                $docs = [];
                foreach ($folder['children'] as $file) {
                    $docs[] = [
                        'name'         => $file['doc_title'] ?? $file['filename'] ?? 'unnamed',
                        'download_uri' => $file['download_uri'] ?? '',
                        'download_id'  => $file['download_id'] ?? ''
                    ];
                }

                if ($sourceType == 'tender_package_documents') {
                    $data['tender_package_documents'] = [
                        'label'     => $folder['name'] ?? 'package_documents',
                        'documents' => $docs
                    ];
                } else {
                    $data['project_documents'][] = [
                        'label'     => $folder['name'] ?? 'Unknown',
                        'documents' => $docs
                    ];
                }
            }
        }

        $tenderId = $tempSnapshot['tender_id'] ?? 0;
        if ($tenderId) {
            $data['additional_documents'] = self::fetchCategoryData($tenderId, 'tender', []);
        }

        if (!empty($data['project_documents'])) {
            usort($data['project_documents'], function ($a, $b) {
                return strnatcasecmp($a['label'] ?? '', $b['label'] ?? '');
            });
        }

        return $data;
    }

    /**
     * @param int $entityId
     * @param string $entityType
     * @param array $dids
     * @param mixed $docParentId
     * @param bool $singleReturn
     * @return mixed
     */
    public static function fetchCategoryData(int $entityId, string $entityType, array $dids, mixed $docParentId = null, bool $singleReturn = false): mixed
    {
        $collection = Manager::getService("document")->fetch("category", [
            'entity_id'   => $entityId,
            'entity_type' => $entityType,
            'doc_parent_id' => $docParentId,
            'dids' => implode(',', $dids),
        ])->getCollection('data');

        return $singleReturn ? $collection->first() : $collection->getItems();
    }

    /**
     * @param array $children
     * @return array
     */
    private static function extractSnapshotFileIds(array $children): array
    {
        $ids = [];
        foreach ($children as $item) {
            if ($item['type'] === 'file') {
                $ids[] = $item['id'];
            } elseif ($item['type'] === 'folder' && !empty($item['children'])) {
                $ids = array_merge($ids, self::extractSnapshotFileIds($item['children']));
            }
        }
        return $ids;
    }

    /**
     * @param string $documentKey
     * @return \Closure
     */
    public static function downloadDocumentSnapshotArchive(string $documentKey = 'document'): \Closure
    {
        return function (Shape $action) use ($documentKey) {
            $document = $action->getCollection($documentKey)->first();
            if (!$document) {
                throw new MiddlewareException("noDocumentFound");
            }

            $meta = json_decode($document->get("meta") ?: '{}', true);

            if (empty($meta['snapshot'])) {
                throw new MiddlewareException("noDocumentFound", "Snapshot metadata not found");
            }

            $snapshot = self::resolveSnapshot($meta['snapshot']);

            $state = $snapshot['details']['state'] ?? '';
            $archiveS3Key = $snapshot['details']['archive_s3_key'] ?? '';
            $archiveS3Bucket = $snapshot['details']['archive_s3_bucket'] ?? '';

            if (!$snapshot || !$archiveS3Key || !$archiveS3Bucket) {
                throw new MiddlewareException("noDocumentFound", "Snapshot archive not ready or state is invalid ($state)");
            }

            $save_path = Config::get('document.save.tmp', '/tmp');
            if (!is_dir($save_path)) {
                mkdir($save_path, 0755, true);
            }

            $filename = basename($archiveS3Key);
            $save_to  = $save_path . "/" . $filename;

            Manager::getService("s3")->save($archiveS3Bucket, $archiveS3Key, $save_to);
            $action->set("output", $save_to);

            self::recordDownloads($action, self::archivedFiles($snapshot), 'download_all');
        };
    }

    /**
     * @param Shape $action
     * @return array
     */
    private static function downloadRecipient(Shape $action): array
    {
        $meta = $action->get('meta');
        if (is_string($meta)) {
            $meta = json_decode($meta, true);
        }

        if (!is_array($meta) || (int) ($meta['subcontractor_id'] ?? 0) < 1) {
            return [];
        }

        return [
            'subcontractor_id' => (int) $meta['subcontractor_id'],
            'tender_id'        => (int) ($meta['tender_id'] ?? 0),
            'document_id'      => (int) ($meta['document_id'] ?? 0),
        ];
    }

    /**
     * @param array $snapshot
     * @return array<int, array{id: int, filename: string}>
     */
    private static function archivedFiles(array $snapshot): array
    {
        $files   = [];
        $changes = $snapshot['changes'] ?? null;

        if ($changes && !in_array($snapshot['mode'] ?? '', ['enquiry', 'order'], true)) {
            foreach (['updated', 'new'] as $change) {
                foreach ($changes[$change] ?? [] as $entry) {
                    if (!empty($entry['s3_key'])) {
                        $files[] = ['id' => (int) ($entry['id'] ?? 0), 'filename' => (string) ($entry['filename'] ?? '')];
                    }
                }
            }

            return $files;
        }

        foreach ($snapshot['categories'] ?? [] as $category) {
            foreach ($category['children'] ?? [] as $folder) {
                foreach ($folder['children'] ?? [] as $file) {
                    if (!empty($file['s3_key'])) {
                        $files[] = ['id' => (int) ($file['id'] ?? 0), 'filename' => (string) ($file['filename'] ?? '')];
                    }
                }
            }
        }

        return $files;
    }

    /**
     * Records that a recipient took delivery of documents.
     *
     * @param Shape $action
     * @param array $files
     * @param string $source
     */
    private static function recordDownloads(Shape $action, array $files, string $source): void
    {
        $recipient = self::downloadRecipient($action);
        if ($recipient === [] || $files === []) {
            return;
        }

        $records = [];
        foreach ($files as $file) {
            $records[] = [
                'user_id'     => 0,
                'entity_type' => self::DOWNLOAD_LOG_ENTITY_TYPE,
                'entity_id'   => $recipient['tender_id'],
                'type'        => self::DOWNLOAD_LOG_TYPE,
                'meta'        => json_encode([
                    'subcontractor_id' => $recipient['subcontractor_id'],
                    'document_id'      => $recipient['document_id'],
                    'file_document_id' => (int) ($file['id'] ?? 0),
                    'filename'         => (string) ($file['filename'] ?? ''),
                    'source'           => $source,
                ]),
            ];
        }

        try {
            Manager::getService("project")->write("/logs/bulk", new Shape(['data' => ['records' => $records]]));
        } catch (\Exception $e) {
            error_log('DocumentMiddleware: could not record a download: ' . $e->getMessage());
        }
    }

}
