<?php

namespace App\DocCreator\Snapshot;

use App\Api\Account;
use App\Api\Aws\Sns;
use App\Api\Document;
use App\Api\Document\Category;
use App\Api\Project;
use App\Api\S3;
use App\Api\Tender\Enquiry;
use App\core\Environment;
use App\Utility\Zip;
use Exception;

class SnapshotService
{
    private const S3_KEY_PREFIX = 'provider';
    private const S3_BUCKET     = 'document';

    public const DEFAULT_MODE = 'enquiry';

    /**
     * Modes whose archives predate per-snapshot naming. Renaming those would
     * orphan the objects that existing documents already point at, so they keep
     * the bare "{documentId}.zip" key.
     */
    private const LEGACY_ARCHIVE_MODES = ['enquiry', 'order'];

    /**
     * Modes that open the chain. Everything else is an amendment issued on top
     * of what came before.
     */
    private const CHAIN_HEAD_MODES = ['enquiry', 'order'];

    /**
     * A snapshot in one of these states has been issued; the next run starts a
     * new one instead of writing into it.
     */
    private const TERMINAL_STATES = ['ready', 'ready_partial'];

    private const LEGACY_SNAPSHOT_ID = 'legacy';

    /**
     * Why a snapshot carries the change set it does.
     */
    public const COMPARISON_COMPARED       = 'compared';
    public const COMPARISON_NOT_APPLICABLE = 'not_applicable';
    public const COMPARISON_NO_BASELINE    = 'no_baseline';
    public const COMPARISON_FAILED         = 'failed';

    public const COMPARISON_UNUSABLE = [self::COMPARISON_NO_BASELINE, self::COMPARISON_FAILED];

    /**
     * One archive per snapshot. A document can carry an enquiry snapshot and an
     * addendum one, and each has to keep its own file list, so anything outside
     * the legacy modes is named after the snapshot it was built from.
     */
    private static function archiveName(int $parentDocId, array $snapshot): string
    {
        $mode = $snapshot['mode'] ?? self::DEFAULT_MODE;

        if (in_array($mode, self::LEGACY_ARCHIVE_MODES, true)) {
            return "{$parentDocId}.zip";
        }

        $snapshotId = $snapshot['details']['snapshot_id'] ?? '';
        $suffix     = preg_replace('/[^a-zA-Z0-9_\-]/', '', $mode . ($snapshotId ? "-{$snapshotId}" : ''));

        return "{$parentDocId}-{$suffix}.zip";
    }

    /**
     * Tells a snapshot object apart from a container of snapshots.
     */
    private static function isSingleSnapshot(array $value): bool
    {
        return array_key_exists('categories', $value) || array_key_exists('details', $value);
    }

    private static function snapshotId(array $snapshot): string
    {
        return (string) ($snapshot['details']['snapshot_id'] ?? self::LEGACY_SNAPSHOT_ID);
    }

    /**
     * Brings any historical meta shape to `snapshot[mode][snapshotId]`. Three
     * shapes exist in the wild: a single snapshot object directly under
     * `snapshot` (before modes), one object per mode (before addendum history),
     * and the current one.
     */
    private static function normalisedSnapshots(array $meta): array
    {
        $root = $meta['snapshot'] ?? [];
        if (!is_array($root) || $root === []) {
            return [];
        }

        if (self::isSingleSnapshot($root)) {
            $root = [($root['mode'] ?? self::DEFAULT_MODE) => $root];
        }

        $out = [];
        foreach ($root as $mode => $bucket) {
            if (!is_array($bucket) || $bucket === []) {
                continue;
            }

            if (self::isSingleSnapshot($bucket)) {
                // Meta written before snapshots carried an id gets a synthetic
                // one per mode, so the enquiry and the addendum stay distinct
                // entries in the chain instead of colliding on "legacy".
                $id = $bucket['details']['snapshot_id'] ?? self::LEGACY_SNAPSHOT_ID . '-' . $mode;
                $bucket = [$id => $bucket];
            }

            foreach ($bucket as $id => $snapshot) {
                if (is_array($snapshot) && self::isSingleSnapshot($snapshot)) {
                    $out[(string) $mode][(string) $id] = $snapshot;
                }
            }
        }

        return $out;
    }

    private static function migrateSnapshotShape(array &$meta): void
    {
        $normalised = self::normalisedSnapshots($meta);
        if ($normalised !== []) {
            $meta['snapshot'] = $normalised;
        }
    }

    private static function chainRank(array $snapshot): int
    {
        return in_array($snapshot['mode'] ?? self::DEFAULT_MODE, self::CHAIN_HEAD_MODES, true) ? 0 : 1;
    }

    /**
     * Every snapshot the document holds, oldest first. This is the order the
     * document was issued in: the enquiry, then each addendum after it.
     */
    public static function getSnapshotChain(array $meta): array
    {
        $chain = [];
        foreach (self::normalisedSnapshots($meta) as $mode => $snapshots) {
            foreach ($snapshots as $id => $snapshot) {
                $snapshot['mode'] = $snapshot['mode'] ?? $mode;
                $snapshot['details']['snapshot_id'] = $snapshot['details']['snapshot_id'] ?? $id;
                $chain[] = $snapshot;
            }
        }

        usort($chain, static function (array $a, array $b): int {
            return (self::chainRank($a) <=> self::chainRank($b))
                ?: strcmp($a['details']['created_at'] ?? '', $b['details']['created_at'] ?? '')
                    ?: strcmp(self::snapshotId($a), self::snapshotId($b));
        });

        return $chain;
    }

    /**
     * The newest snapshot for a mode, or the newest of all when no mode is
     * given - that one is the active snapshot.
     */
    public static function getSnapshot(array $meta, ?string $mode = null): array
    {
        $chain = self::getSnapshotChain($meta);
        if ($chain === []) {
            return [];
        }

        if ($mode === null) {
            return (array) end($chain);
        }

        $match = [];
        foreach ($chain as $snapshot) {
            if (($snapshot['mode'] ?? null) === $mode) {
                $match = $snapshot;
            }
        }

        return $match;
    }

    /**
     * The newest finished snapshot, optionally for one mode.
     *
     * A document can hold an in-progress snapshot alongside a completed one -
     * re-sending an issuance opens a new entry - and an unfinished snapshot has
     * no file list, so it must never be used as a baseline.
     *
     * @param array $meta
     * @param string|null $mode
     * @return array
     */
    public static function getCompletedSnapshot(array $meta, ?string $mode = null): array
    {
        $completed = [];
        foreach (self::getSnapshotChain($meta) as $snapshot) {
            if ($mode !== null && ($snapshot['mode'] ?? null) !== $mode) {
                continue;
            }

            if (in_array($snapshot['details']['state'] ?? '', self::TERMINAL_STATES, true)) {
                $completed = $snapshot;
            }
        }

        return $completed;
    }

    /**
     * The snapshot issued immediately before the given one. Addendum #1 resolves
     * to the enquiry, addendum #2 to addendum #1, and so on.
     */
    public static function getPreviousSnapshot(array $meta, array $snapshot): array
    {
        if ($snapshot === []) {
            return [];
        }

        $target   = self::snapshotId($snapshot);
        $previous = [];

        foreach (self::getSnapshotChain($meta) as $candidate) {
            if (self::snapshotId($candidate) === $target) {
                return $previous;
            }

            $previous = $candidate;
        }

        return [];
    }

    /**
     * Sets the initial state for a snapshot.
     */
    public static function initializeSnapshot(int $parentDocId, int $totalGroups, array $context): void
    {
        try {
            $doc = Document::getDocument($parentDocId);
            if (!$doc) return;

            $meta = json_decode($doc['meta'] ?? '{}', true);

            $now = date('Y-m-d\TH:i:s\Z');
            $mode = $context['mode'] ?? self::DEFAULT_MODE;
            $tenderId = $context['tender_id'] ?? 0;

            $categories = [];
            $additionalGroupsCount = 0;
            if ($tenderId) {
                $additionalDocs = self::getAdditionalDocuments($tenderId);
                if (!empty($additionalDocs['children'])) {
                    $categories[] = $additionalDocs;
                    $additionalGroupsCount = count($additionalDocs['children']);
                }
            }

            // A fresh snapshot gets a fresh identifier; the issuance identifier is supplied
            // by the caller and otherwise kept stable across re-initialisations.
            // An issued snapshot is never written into again: the next run opens
            // a new one, which is what makes addendum #2 a separate entry rather
            // than an overwrite of addendum #1.
            $existing = self::getSnapshot($meta, $mode);
            $isOpen   = $existing !== []
                && !in_array($existing['details']['state'] ?? '', self::TERMINAL_STATES, true);

            $snapshotId = $context['snapshot_id']
                ?? ($isOpen ? self::snapshotId($existing) : bin2hex(random_bytes(8)));
            $issuanceId = $context['issuance_id']
                ?? ($isOpen ? ($existing['details']['issuance_id'] ?? bin2hex(random_bytes(8))) : bin2hex(random_bytes(8)));

            self::migrateSnapshotShape($meta);

            $baselineDocumentId = (int) ($context['baseline_document_id']
                ?? ($existing['baseline_document_id'] ?? 0));

            $meta['snapshot'][$mode][$snapshotId] = [
                'provider'             => $context['provider'] ?? 'asite',
                'mode'                 => $mode,
                'baseline_document_id' => $baselineDocumentId,
                'addendum_number'      => self::addendumNumber($mode, $context, $parentDocId, $existing),
                'issued_additional_document_ids' => $existing['issued_additional_document_ids'] ?? self::previouslyIssuedAdditionalDocumentIds($baselineDocumentId),
                'project_reference'    => (string) ($context['project_reference'] ?? ($existing['project_reference'] ?? '')),
                'package_name'         => (string) ($context['package_name'] ?? ($existing['package_name'] ?? '')),
                'project_id' => $context['project_id'] ?? 0,
                'tender_id'  => $tenderId,
                'details'    => [
                    'snapshot_id'     => $snapshotId,
                    'issuance_id'     => $issuanceId,
                    'state'           => 'snapshot_initialised',
                    'created_at'      => $now,
                    'last_updated_at' => $now,
                    'progress'        => [
                        'groups_total'     => $totalGroups + $additionalGroupsCount,
                        'groups_completed' => 0,
                        'files_total'      => 0,
                        'files_completed'  => 0,
                        'files_failed'     => 0,
                    ],
                ],
                'categories' => $categories,
            ];

            Document::patch("document/$parentDocId", ['meta' => json_encode($meta)]);
        } catch (Exception $e) {
            error_log("SnapshotService::initializeSnapshot failed: " . $e->getMessage());
        }
    }

    /**
     * The number this issuance goes out as.
     *
     * @param string $mode
     * @param array $context
     * @param int $parentDocId
     * @param array $existing
     * @return int
     */
    private static function addendumNumber(string $mode, array $context, int $parentDocId, array $existing): int
    {
        if (in_array($mode, self::CHAIN_HEAD_MODES, true)) {
            return 0;
        }

        $recorded = (int) ($existing['addendum_number'] ?? 0);
        if ($recorded) {
            return $recorded;
        }

        try {
            return Enquiry::getAddendumNumber(
                (int) ($context['project_id'] ?? 0),
                (int) ($context['tender_id'] ?? 0),
                $parentDocId
            );
        } catch (Exception $e) {
            error_log('SnapshotService: could not resolve the addendum number: ' . $e->getMessage());

            return 0;
        }
    }

    /**
     * Helper to fetch and format additional tender documents into snapshot categories.
     */
    public static function getAdditionalDocuments(int $tenderId): array
    {
        $categories = Category::get("category", [
            'entity_id'   => $tenderId,
            'entity_type' => 'tender'
        ]);

        $children = [];
        foreach ($categories as $cat) {
            $folderChildren = [];
            foreach (($cat['documents'] ?? []) as $doc) {
                // Same record shape as provider-sourced files so the comparison can treat
                // both uniformly. A null asite_document_id marks a C-Link upload, which
                // carries no provider revision or status.
                $folderChildren[] = [
                    'type'              => 'file',
                    'id'                => $doc['id'] ?? 0,
                    'asite_document_id' => null,
                    'filename'          => $doc['name'] ?? 'unnamed',
                    'doc_title'         => $doc['name'] ?? null,
                    'doc_ref'           => null,
                    'file_type'         => empty($doc['name']) ? null : (pathinfo($doc['name'], PATHINFO_EXTENSION) ?: null),
                    'rev_no'            => null,
                    'publisher_org'     => null,
                    'status'            => null,
                    'download_status'   => 'completed',
                    's3_key'            => $doc['s3_key'] ?? '',
                ];
            }

            if (!empty($folderChildren)) {
                $children[] = [
                    'type'     => 'folder',
                    'name'     => $cat['label'] ?? 'Unknown',
                    'children' => $folderChildren,
                ];
            }
        }

        return [
            'source_type'  => 'additional_documents',
            'display_name' => 'Additional Documents',
            'children'     => $children,
        ];
    }

    /**
     * Resolves or creates a document category for a given entity.
     */
    public static function getOrCreateCategory(int $entityId, string $label, string $entityType = 'project_documents', int $parentId = 0): ?int
    {
        try {
            // Check if category exists
            $categories = Document::get("category", [
                'entity_id'   => $entityId,
                'entity_type' => $entityType,
                'label'       => $label,
                'parent_id'   => $parentId
            ]);

            if (!empty($categories)) {
                return (int) array_shift($categories)['id'];
            }

            // Create new category if not found
            $res = Document::post("category", [
                'label'       => $label,
                'entity_id'   => $entityId,
                'entity_type' => $entityType,
                'parent_id'   => $parentId
            ]);

            return (int) ($res->json()['data']['id'] ?? 0) ?: null;
        } catch (Exception $e) {
            return null;
        }
    }

    public static function getProviderIdForAccount(int $aid, string $provider = 'asite'): int
    {
        try {
            $data = Account::get("account/{$aid}/provider/{$provider}");
            return $data['provider_id'] ?? 0;
        } catch (Exception $e) {
            return 0;
        }
    }

    public static function getProjectIntegration(int $projectId, int $providerId): ?array
    {
        try {
            $res = Project::get("project/{$projectId}/integration/provider/{$providerId}");
            return (!empty($res) && isset($res['integration_uri'])) ? $res : null;
        } catch (Exception $e) {
            return null;
        }
    }

    /**
     * Incrementally updates the document's metadata with snapshot progress.
     */
    public static function updateSnapshotMeta(int $parentDocId, string $ndName, array $results, array $context): void
    {
        try {
            $doc = Document::getDocument($parentDocId);
            if (!$doc) return;

            $meta = json_decode($doc['meta'] ?? '{}', true);
            $mode = $context['mode'] ?? self::DEFAULT_MODE;

            // The check is per mode: a document can already hold an enquiry
            // snapshot while the addendum one still has to be initialised.
            if (self::getSnapshot($meta, $mode) === []) {
                self::initializeSnapshot($parentDocId, 0, $context);
                $doc  = Document::getDocument($parentDocId);
                $meta = json_decode($doc['meta'] ?? '{}', true);
            }

            self::migrateSnapshotShape($meta);

            // Progress always lands on the newest snapshot of that mode.
            $snapshotId = self::snapshotId(self::getSnapshot($meta, $mode));
            if (!isset($meta['snapshot'][$mode][$snapshotId])) {
                return;
            }

            $snapshot = &$meta['snapshot'][$mode][$snapshotId];
            $snapshot['details']['last_updated_at'] = date('Y-m-d\TH:i:s\Z');

            self::mergeGroupResults($snapshot, $ndName, $results, $context);
            self::recalculateProgress($snapshot);
            self::processStateTransition($parentDocId, $meta, $mode, $snapshotId);
        } catch (Exception $e) {
            error_log("SnapshotService::updateSnapshotMeta failed: " . $e->getMessage());
        }
    }

    private static function mergeGroupResults(array &$snapshot, string $ndName, array $results, array $context): void
    {
        $sourceType  = $context['source_type']  ?? 'project_documents';
        $displayName = $context['display_name'] ?? 'Project Documents';

        // Find or create category
        $targetCategoryIndex = null;
        foreach ($snapshot['categories'] as $i => $cat) {
            if (($cat['source_type'] ?? '') === $sourceType) {
                $targetCategoryIndex = $i;
                break;
            }
        }

        if ($targetCategoryIndex === null) {
            $snapshot['categories'][] = [
                'source_type'  => $sourceType,
                'display_name' => $displayName,
                'children'     => [],
            ];
            $targetCategoryIndex = array_key_last($snapshot['categories']);
        }

        $category = &$snapshot['categories'][$targetCategoryIndex];

        $folderIdx = null;
        foreach ($category['children'] as $i => $folder) {
            if (($folder['type'] ?? '') === 'folder' && ($folder['name'] ?? '') === $ndName) {
                $folderIdx = $i;
                break;
            }
        }

        if ($folderIdx !== null) {
            $category['children'][$folderIdx]['children'] = $results;
        } else {
            $category['children'][] = [
                'type'     => 'folder',
                'name'     => $ndName,
                'children' => $results,
            ];
        }
    }

    /**
     * Ids of the C-Link uploads a snapshot went out with.
     *
     * @param array $snapshot
     * @return int[]
     */
    public static function additionalDocumentIds(array $snapshot): array
    {
        $ids = [];
        foreach ($snapshot['categories'] ?? [] as $category) {
            if (($category['source_type'] ?? '') !== 'additional_documents') {
                continue;
            }

            foreach ($category['children'] ?? [] as $folder) {
                foreach ($folder['children'] ?? [] as $file) {
                    $id = (int) ($file['id'] ?? 0);
                    if ($id) {
                        $ids[$id] = $id;
                    }
                }
            }
        }

        return array_values($ids);
    }

    /**
     * The uploads earlier issuances already sent.
     *
     * @param int $baselineDocumentId
     * @return int[]
     */
    public static function previouslyIssuedAdditionalDocumentIds(int $baselineDocumentId): array
    {
        if (!$baselineDocumentId) {
            return [];
        }

        try {
            $document = Document::getDocument($baselineDocumentId);
            if (!$document) {
                return [];
            }

            $baseline = self::getCompletedSnapshot((array) json_decode($document['meta'] ?? '{}', true));

            // Whatever the baseline sent, plus whatever was already sent before
            // it - an upload stays issued once it has gone out.
            return array_values(array_unique(array_merge(
                self::additionalDocumentIds($baseline),
                array_map('intval', $baseline['issued_additional_document_ids'] ?? [])
            )));
        } catch (Exception $e) {
            error_log('SnapshotService: could not read previously issued uploads: ' . $e->getMessage());

            return [];
        }
    }

    /**
     * Records an issuance that has no provider documents of its own.
     *
     * @param int $parentDocId
     * @param array $context
     * @return bool
     */
    public static function initializeUploadOnlySnapshot(int $parentDocId, array $context): bool
    {
        try {
            $tenderId = (int) ($context['tender_id'] ?? 0);
            if (!$tenderId || empty(self::getAdditionalDocuments($tenderId)['children'])) {
                return false;
            }

            self::initializeSnapshot($parentDocId, 0, $context);
            self::completeWithoutDownloads($parentDocId, (string) ($context['mode'] ?? self::DEFAULT_MODE));

            return true;
        } catch (Exception $e) {
            error_log('SnapshotService::initializeUploadOnlySnapshot failed: ' . $e->getMessage());

            return false;
        }
    }

    /**
     * Finishes a snapshot whose documents were all recorded up front.
     *
     * @param int $parentDocId
     * @param string $mode
     */
    private static function completeWithoutDownloads(int $parentDocId, string $mode): void
    {
        $doc = Document::getDocument($parentDocId);
        if (!$doc) {
            return;
        }

        $meta = json_decode($doc['meta'] ?? '{}', true);
        self::migrateSnapshotShape($meta);

        $snapshotId = self::snapshotId(self::getSnapshot($meta, $mode));
        if (!isset($meta['snapshot'][$mode][$snapshotId])) {
            return;
        }

        $snapshot = &$meta['snapshot'][$mode][$snapshotId];
        $snapshot['details']['last_updated_at'] = date('Y-m-d\TH:i:s\Z');

        self::recalculateProgress($snapshot);
        self::processStateTransition($parentDocId, $meta, $mode, $snapshotId);
    }

    private static function recalculateProgress(array &$snapshot): void
    {
        $total           = 0;
        $completed       = 0;
        $failed          = 0;
        $groupsCompleted = 0;

        foreach ($snapshot['categories'] as $cat) {
            $groupsInCat      = $cat['children'] ?? [];
            $groupsCompleted += count($groupsInCat);

            foreach ($groupsInCat as $folder) {
                foreach (($folder['children'] ?? []) as $file) {
                    $total++;
                    if (($file['download_status'] ?? '') === 'completed') {
                        $completed++;
                    } else {
                        $failed++;
                    }
                }
            }
        }

        $snapshot['details']['progress']['files_total']      = $total;
        $snapshot['details']['progress']['files_completed']  = $completed;
        $snapshot['details']['progress']['files_failed']     = $failed;
        $snapshot['details']['progress']['groups_completed'] = $groupsCompleted;
    }

    private static function processStateTransition(int $parentDocId, array $meta, string $mode, string $snapshotId): void
    {
        self::migrateSnapshotShape($meta);

        if (!isset($meta['snapshot'][$mode][$snapshotId])) {
            return;
        }

        $snapshot        = &$meta['snapshot'][$mode][$snapshotId];
        $progress        = $snapshot['details']['progress'];
        $groupsCompleted = $progress['groups_completed'] ?? 0;
        $totalGroups     = $progress['groups_total'] ?? 0;
        $failedFiles     = $progress['files_failed'] ?? 0;

        if ($totalGroups > 0 && $groupsCompleted >= $totalGroups) {
            $snapshot['details']['state'] = ($failedFiles > 0) ? 'ready_partial' : 'ready';

            $classification = self::classifyAgainstBaseline($meta, $snapshot);
            $snapshot['changes']               = $classification['changes'];
            $snapshot['details']['comparison'] = $classification['comparison'];

            self::warnOnIncompleteSnapshot($parentDocId, $snapshot);
            self::warnOnUnusableComparison($parentDocId, $snapshot);

            Document::patch("document/$parentDocId", ['meta' => json_encode($meta)]);

            if (!isset($snapshot['details']['archived_at'])) {
                self::generateArchive($parentDocId, $mode);
            }
        } else {
            $snapshot['details']['state'] = 'group_processing';
            Document::patch("document/$parentDocId", ['meta' => json_encode($meta)]);
        }
    }

    /**
     * Recomputes the classification of a document's newest finished snapshot.
     *
     * Normally this happens once, when the snapshot completes. This is for the
     * snapshots that finished before the classification existed, or whose
     * baseline was not resolvable at the time.
     *
     * @param int $documentId
     * @param int|null $baselineDocumentId Overrides the recorded baseline.
     * @return array The classification that was stored.
     */
    public static function refreshClassification(int $documentId, ?int $baselineDocumentId = null): array
    {
        $document = Document::getDocument($documentId);
        if (!$document) {
            return [];
        }

        $meta = json_decode($document['meta'] ?? '{}', true);
        self::migrateSnapshotShape($meta);

        $snapshot = self::getCompletedSnapshot($meta);
        if ($snapshot === []) {
            return [];
        }

        $mode = $snapshot['mode'] ?? self::DEFAULT_MODE;
        $id   = self::snapshotId($snapshot);
        if (!isset($meta['snapshot'][$mode][$id])) {
            return [];
        }

        if ($baselineDocumentId !== null) {
            $meta['snapshot'][$mode][$id]['baseline_document_id'] = $baselineDocumentId;
            $snapshot['baseline_document_id'] = $baselineDocumentId;
        }

        $classification = self::classifyAgainstBaseline($meta, $snapshot);
        $meta['snapshot'][$mode][$id]['changes']               = $classification['changes'];
        $meta['snapshot'][$mode][$id]['details']['comparison'] = $classification['comparison'];

        Document::patch("document/{$documentId}", ['meta' => json_encode($meta)]);

        return $classification['changes'];
    }

    /**
     * Warns when an issuance goes out with files that never reached S3.
     *
     * @param int $parentDocId
     * @param array $snapshot
     */
    private static function warnOnIncompleteSnapshot(int $parentDocId, array $snapshot): void
    {
        $failed = (int) ($snapshot['details']['progress']['files_failed'] ?? 0);
        if ($failed < 1) {
            return;
        }

        $detail = [
            'environment'        => Environment::getValue('ENVIRONMENT'),
            'parent_document_id' => $parentDocId,
            'snapshot_id'        => self::snapshotId($snapshot),
            'issuance_id'        => $snapshot['details']['issuance_id'] ?? '',
            'tender_id'          => $snapshot['tender_id'] ?? 0,
            'failure_type'       => 'incomplete_snapshot',
            'error_message'      => "Issued with {$failed} file(s) that could not be downloaded",
            'files_failed'       => $failed,
            'files_total'        => (int) ($snapshot['details']['progress']['files_total'] ?? 0),
        ];

        error_log('SnapshotService: incomplete snapshot for document ' . $parentDocId . ': ' . json_encode($detail));

        try {
            Sns::send('failed_document_process', json_encode($detail));
        } catch (Exception $e) {
            error_log('SnapshotService::warnOnIncompleteSnapshot failed to publish: ' . $e->getMessage());
        }
    }

    /**
     * Warns when an issuance goes out carrying a change set that could not be
     * established, which would otherwise read as "nothing changed".
     *
     * @param int $parentDocId
     * @param array $snapshot
     */
    private static function warnOnUnusableComparison(int $parentDocId, array $snapshot): void
    {
        if (self::comparisonIsUsable($snapshot)) {
            return;
        }

        $comparison = $snapshot['details']['comparison'] ?? [];
        $detail     = [
            'environment'        => Environment::getValue('ENVIRONMENT'),
            'parent_document_id' => $parentDocId,
            'snapshot_id'        => self::snapshotId($snapshot),
            'issuance_id'        => $snapshot['details']['issuance_id'] ?? '',
            'tender_id'          => $snapshot['tender_id'] ?? 0,
            'addendum_number'    => $snapshot['addendum_number'] ?? 0,
            'failure_type'       => 'comparison_' . ($comparison['state'] ?? self::COMPARISON_FAILED),
            'error_message'      => $comparison['reason'] ?? '',
        ];

        error_log('SnapshotService: unusable comparison for document ' . $parentDocId . ': ' . json_encode($detail));

        try {
            Sns::send('failed_document_process', json_encode($detail));
        } catch (Exception $e) {
            error_log('SnapshotService::warnOnUnusableComparison failed to publish: ' . $e->getMessage());
        }
    }

    /**
     * Classifies a finished snapshot against the issuance before it, so the
     * addendum download page and the Schedule of Changes read the same result
     * instead of each recomputing it.
     *
     * A snapshot that opens the chain has nothing to compare against and gets
     * an empty classification.
     *
     * @param array $snapshot
     * @return array
     */
    private static function classifyAgainstBaseline(array $meta, array $snapshot): array
    {
        $empty = [
            SnapshotDiff::UPDATED   => [],
            SnapshotDiff::NEW       => [],
            SnapshotDiff::WITHDRAWN => [],
        ];

        if (in_array($snapshot['mode'] ?? '', self::CHAIN_HEAD_MODES, true)) {
            return ['changes' => $empty, 'comparison' => self::comparison(self::COMPARISON_NOT_APPLICABLE)];
        }

        try {
            $baseline = self::resolveBaselineSnapshot($meta, $snapshot);

            if ($baseline === []) {
                return [
                    'changes'    => $empty,
                    'comparison' => self::comparison(
                        self::COMPARISON_NO_BASELINE,
                        'No issued snapshot was found to measure this addendum against.'
                    ),
                ];
            }

            return [
                'changes'    => SnapshotDiff::compare($baseline, $snapshot),
                'comparison' => self::comparison(self::COMPARISON_COMPARED),
            ];
        } catch (Exception $e) {
            error_log('SnapshotService::classifyAgainstBaseline failed: ' . $e->getMessage());

            return [
                'changes'    => $empty,
                'comparison' => self::comparison(
                    self::COMPARISON_FAILED,
                    'The comparison against the previous issuance did not complete.'
                ),
            ];
        }
    }

    /**
     * @param string $state
     * @param string $reason
     * @return array
     */
    private static function comparison(string $state, string $reason = ''): array
    {
        return ['state' => $state, 'reason' => $reason];
    }

    /**
     * @param array $snapshot
     * @return bool
     */
    public static function comparisonIsUsable(array $snapshot): bool
    {
        $state = $snapshot['details']['comparison']['state'] ?? self::COMPARISON_COMPARED;

        return !in_array($state, self::COMPARISON_UNUSABLE, true);
    }

    /**
     * The snapshot this one is measured against.
     *
     * Re-issuing the same document leaves its previous snapshot in the same
     * meta, and that is the closest predecessor. Only when the document has no
     * earlier snapshot of its own does the chain continue on the document
     * recorded as the baseline - the case where each issuance is its own
     * document.
     *
     * @param array $meta
     * @param array $snapshot
     * @return array
     */
    public static function resolveBaselineSnapshot(array $meta, array $snapshot): array
    {
        $currentId = self::snapshotId($snapshot);

        $previous = [];
        foreach (self::getSnapshotChain($meta) as $candidate) {
            if (self::snapshotId($candidate) === $currentId) {
                break;
            }

            if (in_array($candidate['details']['state'] ?? '', self::TERMINAL_STATES, true)) {
                $previous = $candidate;
            }
        }

        if ($previous !== []) {
            return $previous;
        }

        $baselineDocumentId = (int) ($snapshot['baseline_document_id'] ?? 0);
        if (!$baselineDocumentId) {
            return [];
        }

        $document = Document::getDocument($baselineDocumentId);
        if (!$document) {
            return [];
        }

        return self::getCompletedSnapshot((array) json_decode($document['meta'] ?? '{}', true));
    }

    public static function generateArchive(int $parentDocId, ?string $mode = null): void
    {
        $doc = Document::getDocument($parentDocId);
        if (!$doc) {
            return;
        }

        $meta = json_decode($doc['meta'] ?? '{}', true);
        $snapshot = self::getSnapshot($meta, $mode);
        $provider = $snapshot['provider'] ?? 'asite';
        $categories = $snapshot['categories'] ?? [];
        $bucket   = self::S3_BUCKET;
        $tmpBase  = sys_get_temp_dir();
        $tmpDir   = rtrim($tmpBase, '/') . "/snapshot_{$parentDocId}_" . uniqid();
        $zipName  = self::archiveName($parentDocId, $snapshot);

        try {
            mkdir($tmpDir, 0777, true);

            self::downloadSnapshotFiles(
                $tmpDir,
                $bucket,
                $provider,
                $parentDocId,
                self::archivableCategories($snapshot),
                $categories !== []
            );
            self::downloadAdditionalDocuments(
                $tmpDir,
                $categories,
                array_map('intval', $snapshot['issued_additional_document_ids'] ?? [])
            );

            $zipPath = self::createAndUploadArchive($tmpDir, $tmpBase, $zipName, $bucket, $provider, $parentDocId);

            if ($zipPath) {
                $s3Key = S3::getKey($zipName, self::S3_KEY_PREFIX, [$provider, $parentDocId]);
                self::updateArchiveMetadata(
                    $parentDocId,
                    $meta,
                    $s3Key,
                    $bucket,
                    $snapshot['mode'] ?? $mode,
                    self::snapshotId($snapshot)
                );
            }
        } catch (Exception $e) {
            error_log("SnapshotService::generateArchive failed for {$parentDocId}: " . $e->getMessage());
        } finally {
            self::cleanup($tmpDir, $tmpBase . DIRECTORY_SEPARATOR . $zipName);
        }
    }

    /**
     * The project documents an archive should carry.
     *
     * A snapshot holds the full re-issued set, because the next addendum is
     * measured against it. Its archive, though, is what the recipient is being
     * asked to look at now - for an addendum that means only the documents it
     * updated or added, never the ones it withdrew or left untouched.
     *
     * @param array $snapshot
     * @return array Categories, filtered where the classification applies.
     */
    private static function archivableCategories(array $snapshot): array
    {
        $categories = $snapshot['categories'] ?? [];
        $changes    = $snapshot['changes'] ?? null;

        if (!$changes || in_array($snapshot['mode'] ?? '', self::CHAIN_HEAD_MODES, true)) {
            return $categories;
        }

        $keep = [];
        foreach ([SnapshotDiff::UPDATED, SnapshotDiff::NEW] as $change) {
            foreach ($changes[$change] ?? [] as $entry) {
                if (!empty($entry['s3_key'])) {
                    $keep[$entry['s3_key']] = true;
                }
            }
        }

        foreach ($categories as $i => $category) {
            if (!in_array($category['source_type'] ?? '', SnapshotDiff::COMPARED_SOURCES, true)) {
                continue;
            }

            foreach ($category['children'] ?? [] as $j => $folder) {
                $files = array_values(array_filter(
                    $folder['children'] ?? [],
                    static fn (array $file): bool => isset($keep[$file['s3_key'] ?? ''])
                ));

                $categories[$i]['children'][$j]['children'] = $files;
            }

            $categories[$i]['children'] = array_values(array_filter(
                $categories[$i]['children'],
                static fn (array $folder): bool => !empty($folder['children'])
            ));
        }

        return $categories;
    }

    /**
     * Pulls down the files this snapshot lists, and only those. The document's
     * S3 prefix accumulates every file ever downloaded for it, so an addendum
     * archive built off the prefix would carry documents the addendum removed
     * and superseded revisions of the ones it kept.
     *
     * The prefix download stays as a fallback for snapshots that never recorded
     * their file list.
     */
    private static function downloadSnapshotFiles(
        string $tmpDir,
        string $bucket,
        string $provider,
        int $parentDocId,
        array $categories = [],
        bool $hasRecordedList = false
    ): void {
        $prefix = S3::getConfig('key_prefix') . "/" . self::S3_KEY_PREFIX . "/{$provider}/{$parentDocId}";

        if (self::downloadListedFiles($tmpDir, $bucket, $prefix, $categories) > 0) {
            return;
        }

        if ($hasRecordedList) {
            return;
        }

        S3::saveDir($tmpDir, $bucket, $prefix);

        $nestedDir = $tmpDir . DIRECTORY_SEPARATOR . $prefix;
        if (!is_dir($nestedDir)) {
            return;
        }

        foreach (scandir($nestedDir) as $item) {
            if ($item === '.' || $item === '..') continue;
            rename(
                $nestedDir . DIRECTORY_SEPARATOR . $item,
                $tmpDir . DIRECTORY_SEPARATOR . $item
            );
        }

        // Remove the now-empty nested S3 prefix tree (e.g. "development/...")
        self::recursiveRemove($tmpDir . DIRECTORY_SEPARATOR . explode('/', $prefix)[0]);

        // Remove any stale ZIP that was previously uploaded under the same prefix
        foreach (glob($tmpDir . DIRECTORY_SEPARATOR . '*.zip') as $staleZip) {
            unlink($staleZip);
        }
    }

    /**
     * Saves each completed file listed in the snapshot, keeping the folder
     * layout its S3 key already has under the document prefix - so
     * "…/77138/project_documents/ND09/x.pdf" lands in "project_documents/ND09".
     * Additional documents are skipped; they live outside the prefix and are
     * fetched separately.
     *
     * @return int Number of files written.
     */
    private static function downloadListedFiles(string $tmpDir, string $bucket, string $prefix, array $categories): int
    {
        $prefix    = rtrim($prefix, '/') . '/';
        $resolved  = S3::getBucket($bucket);
        $written   = 0;

        foreach ($categories as $category) {
            if (($category['source_type'] ?? '') === 'additional_documents') {
                continue;
            }

            foreach ($category['children'] ?? [] as $folder) {
                foreach ($folder['children'] ?? [] as $file) {
                    $key = (string) ($file['s3_key'] ?? '');
                    if ($key === '' || ($file['download_status'] ?? '') !== 'completed') {
                        continue;
                    }

                    if (strpos($key, $prefix) !== 0) {
                        continue;
                    }

                    $relative = substr($key, strlen($prefix));
                    $destPath = $tmpDir . DIRECTORY_SEPARATOR . str_replace('/', DIRECTORY_SEPARATOR, $relative);
                    $destDir  = dirname($destPath);

                    if (!is_dir($destDir) && !mkdir($destDir, 0777, true) && !is_dir($destDir)) {
                        continue;
                    }

                    if (S3::save($resolved, $key, $destPath) !== false) {
                        $written++;
                    }
                }
            }
        }

        return $written;
    }

    private static function downloadAdditionalDocuments(string $tmpDir, array $categories, array $alreadyIssued = []): void
    {
        $additionalCategory = null;
        foreach ($categories as $cat) {
            if (($cat['source_type'] ?? '') === 'additional_documents') {
                $additionalCategory = $cat;
                break;
            }
        }

        if (!$additionalCategory || empty($additionalCategory['children'])) {
            return;
        }

        $alreadyIssued = array_flip($alreadyIssued);

        $snapshotFiles = [];
        foreach ($additionalCategory['children'] as $folder) {
            foreach ($folder['children'] ?? [] as $file) {
                $id = (int) ($file['id'] ?? 0);

                // The archive carries what this issuance adds. An upload an
                // earlier issuance already sent is not part of it.
                if (($file['type'] ?? '') !== 'file' || !$id || isset($alreadyIssued[$id])) {
                    continue;
                }

                $snapshotFiles[$id] = [
                    'filename'    => $file['filename'] ?? 'Unnamed',
                    'folder_name' => $folder['name']  ?? 'Unknown',
                ];
            }
        }

        if (empty($snapshotFiles)) {
            return;
        }

        $dbDocuments = Document::getDocuments(array_keys($snapshotFiles));
        $docMap = [];
        foreach ($dbDocuments as $doc) {
            $docMap[$doc['id']] = $doc;
        }

        $additionalDir = $tmpDir . DIRECTORY_SEPARATOR . 'additional_documents';
        mkdir($additionalDir, 0777, true);

        foreach ($snapshotFiles as $fileId => $meta) {
            $doc = $docMap[$fileId] ?? null;
            if (!$doc) continue;

            $key    = $doc['s3_key']    ?? '';
            $bucket = $doc['s3_bucket'] ?? 'asset';
            if (!$key) continue;

            $safeFolder = preg_replace('/[^a-zA-Z0-9_\-]/', '_', $meta['folder_name']);
            $catDir     = $additionalDir . DIRECTORY_SEPARATOR . $safeFolder;
            if (!is_dir($catDir)) {
                mkdir($catDir, 0777, true);
            }

            $destPath = $catDir . DIRECTORY_SEPARATOR . $doc['name'];
            S3::save(S3::getBucket($bucket), $key, $destPath);
        }
    }

    private static function createAndUploadArchive(string $tmpDir, string $tmpBase, string $zipName, string $bucket, string $provider, int $parentDocId): ?string
    {
        $zipDest = rtrim($tmpBase, '/');
        $zipPath = $zipDest . DIRECTORY_SEPARATOR . $zipName;

        $zip = new Zip($tmpDir);
        $zip->create($zipDest, $zipName);

        if (!file_exists($zipPath)) {
            return null;
        }

        $s3Key = S3::getKey($zipName, self::S3_KEY_PREFIX, [$provider, $parentDocId]);
        S3::upload($bucket, $s3Key, $zipPath, 'application/zip');

        return $zipPath;
    }

    private static function updateArchiveMetadata(
        int $parentDocId,
        array $meta,
        string $s3Key,
        string $bucket,
        ?string $mode = null,
        ?string $snapshotId = null
    ): void {
        $mode ??= self::DEFAULT_MODE;
        $snapshotId ??= self::snapshotId(self::getSnapshot($meta, $mode));

        self::migrateSnapshotShape($meta);

        if (!isset($meta['snapshot'][$mode][$snapshotId])) {
            return;
        }

        $details = &$meta['snapshot'][$mode][$snapshotId]['details'];
        $details['archived_at']       = date('Y-m-d\TH:i:s\Z');
        $details['archive_s3_key']    = $s3Key;
        $details['archive_s3_bucket'] = $bucket;
        unset($details);

        Document::patch("document/{$parentDocId}", ['meta' => json_encode($meta)]);
    }

    public static function batchUpdateTempSnapshotMeta(int $parentDocId, array $groups, array $context): void
    {
        try {
            $doc = Document::getDocument($parentDocId);
            if (!$doc) return;

            $meta = json_decode($doc['meta'] ?? '{}', true);

            if (!isset($meta['temp_snapshot'])) {
                $meta['temp_snapshot'] = [
                    'provider'   => $context['provider']   ?? 'asite',
                    'mode'       => $context['mode']       ?? 'enquiry',
                    'project_id' => $context['project_id'] ?? 0,
                    'tender_id'  => $context['tender_id']  ?? 0,
                    'categories' => []
                ];
            }

            foreach ($groups as $group) {
                $ndName       = $group['name'];
                $asiteFiles   = $group['files'];
                $tempSnapshot = &$meta['temp_snapshot'];
                $sourceType   = $group['details']['source_type']  ?? 'project_documents';
                $displayName  = $group['details']['display_name'] ?? 'Project Documents';

                // Find or create category
                $targetCategoryIndex = null;
                foreach ($tempSnapshot['categories'] as $i => $cat) {
                    if (($cat['source_type'] ?? '') === $sourceType) {
                        $targetCategoryIndex = $i;
                        break;
                    }
                }

                if ($targetCategoryIndex === null) {
                    $tempSnapshot['categories'][$sourceType] = [
                        'source_type'  => $sourceType,
                        'display_name' => $displayName,
                        'children'     => [],
                    ];
                    $targetCategoryIndex = array_key_last($tempSnapshot['categories']);
                }

                $category = &$tempSnapshot['categories'][$targetCategoryIndex];

                // Normalize Asite files into the "children" structure
                $children = [];
                foreach ($asiteFiles as $file) {
                    $fileId = $file['id'] ?? '';
                    $children[$fileId] = [
                        'type'          => 'file',
                        'download_id'   => $fileId,
                        'download_uri'  => $file['uri'] ?? '',
                        'filename'      => $file['file_name'] ?? 'unnamed',
                        'doc_title'     => $file['doc_title'] ?? 'unnamed',
                        'doc_ref'       => $file['doc_ref'] ?? '-',
                        'file_type'     => $file['file_type'] ?? 'pdf',
                        'rev_no'        => $file['rev_no'] ?? '-',
                        'publisher_org' => $file['publisher_org'] ?? '-',
                        // Left null rather than '-' so "not captured yet" stays
                        // distinguishable from a real provider status.
                        'status'        => $file['status'] ?? null,
                    ];
                }

                // Find or create folder (ND or Package Documents)
                $folderIdx = null;
                foreach ($category['children'] as $i => $folder) {
                    if (($folder['type'] ?? '') == 'folder' && ($folder['name'] ?? '') == $ndName) {
                        $folderIdx = $i;
                        break;
                    }
                }

                if ($folderIdx !== null) {
                    $category['children'][$folderIdx]['children'] = $children;
                } else {
                    $category['children'][$ndName] = [
                        'type'     => 'folder',
                        'name'     => $ndName,
                        'children' => $children,
                    ];
                }
            }

            Document::patch("document/{$parentDocId}", ['meta' => json_encode($meta)]);
        } catch (Exception $e) {
            throw new \RuntimeException("SnapshotService::batchUpdateTempSnapshotMeta failed: {$e->getMessage()}");
        }
    }

    private static function cleanup(string $tmpDir, string $zipPath): void
    {
        if (is_dir($tmpDir)) {
            self::recursiveRemove($tmpDir);
        }
        if (file_exists($zipPath)) {
            unlink($zipPath);
        }
    }

    private static function recursiveRemove(string $dir): void
    {
        if (!is_dir($dir)) return;
        $files = array_diff(scandir($dir), ['.', '..']);
        foreach ($files as $file) {
            $path = $dir . DIRECTORY_SEPARATOR . $file;
            (is_dir($path)) ? self::recursiveRemove($path) : unlink($path);
        }
        rmdir($dir);
    }
}
