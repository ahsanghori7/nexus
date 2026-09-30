<?php

namespace App\DocCreator\Snapshot;

/**
 * Compares two snapshots and classifies every project document in the newer one
 * as updated or new, plus the ones the newer snapshot no longer carries.
 *
 * Both the Schedule of Changes in the addendum PDF and the addendum download
 * page are built from this, so the two can never disagree.
 */
class SnapshotDiff
{
    public const UPDATED   = 'updated';
    public const NEW       = 'new';
    public const WITHDRAWN = 'withdrawn';

    /**
     * Fields compared to decide whether a document counts as updated. The label
     * is what the PDF shows for fields that have no column of their own.
     */
    public const WATCHED_FIELDS = [
        'rev_no'        => 'Rev',
        'doc_ref'       => 'Doc Ref',
        'doc_title'     => 'Doc Title',
        'status'        => 'Status',
        'publisher_org' => 'Publisher',
    ];

    /**
     * Documents are grouped by ND, then paired inside that group on the first
     * of these that still matches an unpaired document.
     */
    private const MATCH_ANCHORS = ['asite_document_id', 'doc_ref', 'doc_title'];

    /**
     * Separates a provider document id from the token appended to it. A-Site
     * hands back "<id>$$<token>" and mints a fresh token per request, so only
     * the part in front identifies the document across issuances.
     */
    private const ID_TOKEN_SEPARATOR = '$$';

    /**
     * Sources that carry provider documents and so take part in the comparison:
     * the project directory, grouped per numbered document, and the folder
     * mapped to the tender package.
     */
    public const COMPARED_SOURCES = ['project_documents', 'tender_package_documents'];

    /**
     * @param array $baseline Snapshot issued before the one being described.
     * @param array $current  Snapshot being described.
     * @return array{updated: array, new: array, withdrawn: array}
     */
    public static function compare(array $baseline, array $current): array
    {
        $diff = [self::UPDATED => [], self::NEW => [], self::WITHDRAWN => []];

        $oldGroups = self::groupByNd(self::collectDocuments($baseline));
        $newGroups = self::groupByNd(self::collectDocuments($current));

        foreach ($newGroups as $nd => $newFiles) {
            $oldFiles = $oldGroups[$nd] ?? [];

            if ($oldFiles === []) {
                foreach ($newFiles as $file) {
                    $diff[self::NEW][] = self::entry(self::NEW, $file);
                }
                continue;
            }

            foreach (self::pairUp($oldFiles, $newFiles) as [$previous, $file]) {
                $changes = self::changedFields($previous, $file);
                if ($changes !== []) {
                    $diff[self::UPDATED][] = self::entry(self::UPDATED, $file, $changes);
                }
            }

            foreach ($newFiles as $file) {
                $diff[self::NEW][] = self::entry(self::NEW, $file);
            }

            foreach ($oldFiles as $file) {
                $diff[self::WITHDRAWN][] = self::entry(self::WITHDRAWN, $file);
            }
        }

        foreach ($oldGroups as $nd => $oldFiles) {
            if (isset($newGroups[$nd])) {
                continue;
            }

            foreach ($oldFiles as $file) {
                $diff[self::WITHDRAWN][] = self::entry(self::WITHDRAWN, $file);
            }
        }

        foreach ($diff as $change => $entries) {
            usort($entries, static function (array $a, array $b): int {
                return strnatcasecmp($a['nd'], $b['nd'])
                    ?: strnatcasecmp($a['doc_ref'], $b['doc_ref']);
            });
            $diff[$change] = array_values($entries);
        }

        return $diff;
    }

    /**
     * Flattens the provider documents of a snapshot, each carrying the folder it
     * came from and the source it belongs to. Additional documents are C-Link
     * uploads, not provider records, so they stay out of the comparison.
     *
     * @param array $snapshot
     * @return array
     */
    public static function collectDocuments(array $snapshot): array
    {
        $files = [];
        foreach ($snapshot['categories'] ?? [] as $category) {
            $sourceType = $category['source_type'] ?? '';
            if (!in_array($sourceType, self::COMPARED_SOURCES, true)) {
                continue;
            }

            foreach ($category['children'] ?? [] as $folder) {
                foreach ($folder['children'] ?? [] as $file) {
                    $file['nd']          = $folder['name'] ?? '';
                    $file['source_type'] = $sourceType;
                    $files[]             = $file;
                }
            }
        }

        return $files;
    }

    /**
     * Brings a preview snapshot to the shape the comparison expects.
     *
     * The preview worker writes a lighter record: categories and folders keyed
     * by name rather than listed, files identified by `download_id`, and no
     * download status because nothing has been fetched to S3 yet. The provider
     * metadata the comparison reads - reference, revision, title - is the same,
     * so the two are comparable once the shape is lined up.
     *
     * @param array $tempSnapshot
     * @return array
     */
    public static function fromPreviewSnapshot(array $tempSnapshot): array
    {
        $categories = [];
        foreach ($tempSnapshot['categories'] ?? [] as $category) {
            $folders = [];
            foreach ($category['children'] ?? [] as $folder) {
                $files = [];
                foreach ($folder['children'] ?? [] as $key => $file) {
                    $file['asite_document_id'] = $file['asite_document_id'] ?? (is_string($key) ? $key : null);
                    $file['id']                = $file['download_id'] ?? null;
                    $file['download_status']   = 'completed';
                    $files[]                   = $file;
                }

                $folders[] = [
                    'type'     => 'folder',
                    'name'     => $folder['name'] ?? '',
                    'children' => $files,
                ];
            }

            $categories[] = [
                'source_type'  => $category['source_type'] ?? '',
                'display_name' => $category['display_name'] ?? '',
                'children'     => $folders,
            ];
        }

        return ['mode' => $tempSnapshot['mode'] ?? '', 'categories' => $categories];
    }

    /**
     * @param array $files
     * @return array
     */
    private static function groupByNd(array $files): array
    {
        $grouped = [];
        foreach ($files as $file) {
            $grouped[strtoupper(trim($file['nd'] ?? ''))][] = $file;
        }

        return $grouped;
    }

    /**
     * The value a document is matched on, for one anchor.
     *
     * @param array $file
     * @param string $anchor
     * @return string
     */
    private static function anchorValue(array $file, string $anchor): string
    {
        if ($anchor === 'asite_document_id') {
            return self::normaliseDocumentId($file[$anchor] ?? null);
        }

        return strtolower(self::normalise($file[$anchor] ?? null));
    }

    /**
     * Pairs up the documents of a single ND. Both lists are emptied of whatever
     * gets paired, so what stays behind is genuinely new or withdrawn.
     *
     * @param array $oldFiles
     * @param array $newFiles
     * @return array
     */
    private static function pairUp(array &$oldFiles, array &$newFiles): array
    {
        $pairs = [];

        foreach (self::MATCH_ANCHORS as $anchor) {
            foreach ($newFiles as $ni => $newFile) {
                $needle = self::anchorValue($newFile, $anchor);
                if ($needle === '') {
                    continue;
                }

                foreach ($oldFiles as $oi => $oldFile) {
                    if (self::anchorValue($oldFile, $anchor) === $needle) {
                        $pairs[] = [$oldFile, $newFile];
                        unset($oldFiles[$oi], $newFiles[$ni]);
                        break;
                    }
                }
            }
        }

        if (count($oldFiles) === 1 && count($newFiles) === 1
            && self::anchorValue(reset($oldFiles), 'asite_document_id') === ''
            && self::anchorValue(reset($newFiles), 'asite_document_id') === ''
        ) {
            $pairs[] = [array_shift($oldFiles), array_shift($newFiles)];
        }

        return $pairs;
    }

    /**
     * @param mixed $id
     * @return string
     */
    public static function normaliseDocumentId($id): string
    {
        $value = self::normalise($id);

        return $value === '' ? '' : strtolower(explode(self::ID_TOKEN_SEPARATOR, $value, 2)[0]);
    }

    /**
     * Whether a document reads the same as it did in an earlier issuance.
     *
     * @param array $previous
     * @param array $current
     * @return bool
     */
    public static function isUnchanged(array $previous, array $current): bool
    {
        return self::changedFields($previous, $current) === [];
    }

    /**
     * @param array $previous
     * @param array $file
     * @return array
     */
    private static function changedFields(array $previous, array $file): array
    {
        $changes = [];
        foreach (self::WATCHED_FIELDS as $field => $label) {
            $from = self::normalise($previous[$field] ?? null);
            $to   = self::normalise($file[$field] ?? null);

            if (strcasecmp($from, $to) !== 0) {
                $changes[$field] = ['label' => $label, 'from' => $from, 'to' => $to];
            }
        }

        return $changes;
    }

    /**
     * @param string $change
     * @param array $file
     * @param array $changes
     * @return array
     */
    private static function entry(string $change, array $file, array $changes = []): array
    {
        return [
            'change'        => $change,
            'id'            => $file['id'] ?? null,
            'source_type'   => $file['source_type'] ?? '',
            'nd'            => $file['nd'] ?? '',
            'filename'      => $file['filename'] ?? '',
            'doc_ref'       => $file['doc_ref'] ?? '',
            'doc_title'     => $file['doc_title'] ?? '',
            'publisher_org' => (string) ($file['publisher_org'] ?? ''),
            'rev_no'        => (string) ($file['rev_no'] ?? ''),
            's3_key'        => $file['s3_key'] ?? '',
            'download_id'   => $file['download_id'] ?? null,
            'download_uri'  => $file['download_uri'] ?? null,
            'changes'       => $changes,
        ];
    }

    /**
     * @param mixed $value
     * @return string
     */
    private static function normalise($value): string
    {
        return trim((string) ($value ?? ''));
    }
}
