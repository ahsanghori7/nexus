<?php

namespace App\DocCreator\DownloadManager;

use App\Api\Api;
use App\Cron\DocQueue;
use App\Api\Document;
use Exception;

class AsiteProvider implements DownloadManagerProviderInterface
{
    private const LINK_LABEL           = 'Document Downloads';
    private const API_ASITE_GROUP_URI  = 'document/provider/asite/%s/project/%s';
    private const API_ASITE_FOLDER_URI = 'document/provider/asite/project/%s';

    /**
     * How many times a read is attempted before the provider is called unreachable.
     */
    private const READ_ATTEMPTS = 3;

    /**
     * How many times a file body is asked for before it is given up on.
     */
    private const DOWNLOAD_ATTEMPTS = 3;

    private const ND_BATCH_SIZE = 10;

    /**
     * Produces a download-manager URL for each numbered document.
     * URL formats:
     *   Preview (session-based) : /download-manager/{type}/{documentId}?nd={ndCode}
     *   Cron/Queue (token-based): /download-manager/{type}/{documentId}/{token}?nd={ndCode}
     *
     * Where {type} is one of: tender, addendum, order
     */
    public function getLinks(array $numbers, array $context): array
    {
        $documentId   = (string) ($context['document_id']   ?? '');
        $documentType = (string) ($context['document_type'] ?? 'enquiry');
        $token        = (string) ($context['token']         ?? '');
        $source       = (string) ($context['source']        ?? '');
        $baseUrl      = rtrim((string) ($context['base_url'] ?? ''), '/');

        $links = [];
        foreach ($numbers as $nd) {
            $nd      = (string) $nd;
            $typeEnc = rawurlencode($documentType);
            $docEnc  = rawurlencode($documentId);
            $query   = ($nd !== '') ? '?nd=' . rawurlencode($nd) : '';
            if ($source === 'preview') {
                $url = sprintf('/download-manager/%s/%s%s', $typeEnc, $docEnc, $query);
            } else {
                $url = sprintf(
                    '%s/download-manager/%s/%s/%s%s',
                    $baseUrl,
                    $typeEnc,
                    $docEnc,
                    rawurlencode($token),
                    $query
                );
            }

            $links[$nd] = sprintf(
                '<a target="_blank" href="%s">%s</a>',
                htmlspecialchars($url, ENT_QUOTES, 'UTF-8'),
                self::LINK_LABEL
            );
        }

        return $links;
    }

    /**
     * @param array $context
     * @param string $type
     */
    public function dispatch(array $context, string $type = 'snapshot'): void
    {
        $aid              = $context['aid'] ?? 0;
        $uid              = $context['uid'] ?? 0;
        $projectId        = $context['project_id'] ?? 0;
        $tenderId         = $context['tender_id'] ?? 0;
        $providerId       = $context['provider_id'] ?? 0;
        $mode             = $context['mode'] ?? '';
        $parentDocumentId = $context['parent_document_id'] ?? 0;
        $providerFolder   = $context['provider_folder'] ?? '';
        $groupId          = $context['nd'] ?? ($context['group_id'] ?? '');

        DocQueue::send([
            'provider'           => 'asite',
            'mode'               => $mode,
            'uid'                => $uid,
            'aid'                => $aid,
            'project_id'         => $projectId,
            'tender_id'          => $tenderId,
            'provider_id'        => $providerId,
            'group_id'           => $groupId,
            'provider_folder'    => $providerFolder,
            'parent_document_id' => $parentDocumentId,
        ], $type);
    }

    /**
     * Returns one record per snapshot document, carrying the provider metadata the
     * addendum comparison needs. Record shape:
     *   uri, asite_document_id, filename, doc_title, doc_ref, file_type,
     *   rev_no, publisher_org, status
     *
     * @param array $payload
     * @param string $token
     * @return array
     */
    public function getSnapshotDocuments(array $payload, string $token): array
    {
        $groupId          = $payload['group_id'] ?? '';
        $projectId        = $payload['project_id'] ?? 0;
        $providerFolder   = $payload['provider_folder'] ?? '';
        $parentDocumentId = $payload['parent_document_id'] ?? '';
        $isTenderPackage  = ($groupId === '' && $providerFolder !== '');

        $documents = self::documentsFromPreview(
            Document::load($parentDocumentId)->getMeta(),
            $isTenderPackage,
            $groupId
        );

        if ($documents !== []) {
            return $documents;
        }

        return self::fetchProviderDocuments($groupId, $projectId, $providerFolder, $isTenderPackage, $token);
    }

    /**
     * Reads a document list from the provider, retrying an empty response.
     *
     * @param string $apiUri
     * @param array $params
     * @param string $token
     * @param string $subject What is being read, for the log and the exception.
     * @return array
     * @throws Exception When every attempt came back empty.
     */
    private static function readDocuments(string $apiUri, array $params, string $token, string $subject): array
    {
        $headers = ['Authorization' => "Bearer $token"];

        for ($attempt = 1; $attempt <= self::READ_ATTEMPTS; $attempt++) {
            $res = Api::get($apiUri, $params, $headers);

            if (is_array($res) && isset($res['url'])) {
                return $res;
            }

            error_log("AsiteProvider: empty response reading {$subject} (attempt {$attempt} of " . self::READ_ATTEMPTS . ')');
        }

        throw new Exception("Asite returned no document list for {$subject}");
    }

    /**
     * The provider's current documents for one group.
     *
     * @param string $groupId
     * @param mixed $projectId
     * @param string $providerFolder
     * @param bool $isTenderPackage
     * @param string $token
     * @return array
     * @throws Exception
     */
    private static function fetchProviderDocuments(
        string $groupId,
        mixed $projectId,
        string $providerFolder,
        bool $isTenderPackage,
        string $token
    ): array {
        //  file structure so this path carries the same metadata as the
        $params = ['file_structure' => 1];
        $apiUri = sprintf(self::API_ASITE_GROUP_URI, $groupId, $projectId);

        if ($isTenderPackage) {
            $apiUri = sprintf(self::API_ASITE_FOLDER_URI, $projectId);
            $params['folder'] = $providerFolder;
        }

        $res = self::readDocuments(
            $apiUri,
            $params,
            $token,
            $isTenderPackage ? "folder {$providerFolder}" : "numbered document {$groupId}"
        );

        $files = $isTenderPackage ? ($res['url']['folder'] ?? []) : ($res['url'][$groupId] ?? []);

        return array_values(array_filter(array_map(
            static fn($file) => self::normalizeSnapshotRecord($file),
            $files
        )));
    }

    /**
     * The documents the preview recorded for one group.
     *
     * @param array $meta
     * @param bool $isTenderPackage
     * @param string $groupId
     * @return array
     */
    private static function documentsFromPreview(array $meta, bool $isTenderPackage, string $groupId): array
    {
        $sourceType = $isTenderPackage ? 'tender_package_documents' : 'project_documents';
        $folderName = $isTenderPackage ? 'package_documents' : $groupId;
        $folder     = $meta['temp_snapshot']['categories'][$sourceType]['children'][$folderName] ?? [];

        $files = [];
        foreach (($folder['children'] ?? []) as $key => $file) {
            if (is_array($file) && is_string($key) && empty($file['id'])) {
                $file['id'] = $key;
            }

            $record = self::normalizeSnapshotRecord($file);
            if ($record !== null) {
                $files[] = $record;
            }
        }

        return $files;
    }

    /**
     * Flattens a provider file entry (A-Site file-structure record or temp_snapshot
     * child) into the single record shape consumed by the snapshot worker.
     *
     * @param array|string $file
     * @return array|null Null when the entry carries no download URI.
     */
    private static function normalizeSnapshotRecord(array|string $file): ?array
    {
        // Providers may still hand back bare URIs when no file structure is available.
        $file = is_array($file) ? $file : ['uri' => $file];
        $uri  = $file['uri'] ?? ($file['download_uri'] ?? '');

        if ($uri === '') {
            return null;
        }

        return [
            'uri'               => $uri,
            'asite_document_id' => $file['id'] ?? ($file['download_id'] ?? null),
            'filename'          => $file['file_name'] ?? ($file['filename'] ?? null),
            'doc_title'         => $file['doc_title'] ?? null,
            'doc_ref'           => $file['doc_ref'] ?? null,
            'file_type'         => $file['file_type'] ?? null,
            'rev_no'            => $file['rev_no'] ?? null,
            'publisher_org'     => $file['publisher_org'] ?? null,
            'status'            => $file['status'] ?? null,
        ];
    }

    /**
     * @param int $parentDocId
     * @param string $url
     * @param string $token
     * @return array
     */
    public function fetchFileContent(int $parentDocId, string $url, string $token): array
    {
        $empty = ['content' => '', 'type' => null, 'filename' => null];

        for ($attempt = 1; $attempt <= self::DOWNLOAD_ATTEMPTS; $attempt++) {
            $res = Api::get(
                "document/{$parentDocId}/preview-mode/download",
                ['uri' => $url, 'get_content' => 1],
                ['Authorization' => "Bearer {$token}"]
            );

            $content = base64_decode((string) ($res['content'] ?? ''), true);
            if ($content !== false && $content !== '') {
                return [
                    'content'  => $content,
                    'type'     => $res['type'] ?? null,
                    'filename' => $res['filename'] ?? null,
                ];
            }

            error_log(
                "AsiteProvider: empty response downloading {$url} "
                . "(attempt {$attempt} of " . self::DOWNLOAD_ATTEMPTS . ')'
            );
        }

        return $empty;
    }

    /**
     * @param array $payload
     * @param string $token
     * @return array
     * @throws Exception
     */
    public function getPreviewSnapshotDocuments(array $payload, string $token): array
    {
        $nd_string      = $payload['nd_string'] ?? '';
        $projectId      = $payload['project_id'] ?? 0;
        $providerFolder = $payload['provider_folder'] ?? '';

        if($nd_string === '' && $providerFolder !== '') {
            return self::readDocuments(
                sprintf(self::API_ASITE_FOLDER_URI, $projectId),
                ['file_structure' => 1, 'folder' => $providerFolder],
                $token,
                "folder {$providerFolder}"
            );
        }

        return self::readNumberedDocuments((string) $nd_string, $projectId, $token);
    }

    /**
     * Reads the documents of many numbered documents, a few at a time.
     *
     * @param string $ndString
     * @param mixed $projectId
     * @param string $token
     * @return array
     */
    private static function readNumberedDocuments(string $ndString, $projectId, string $token): array
    {
        $numbers = array_values(array_filter(array_map('trim', explode(',', $ndString))));

        if ($numbers === []) {
            return [];
        }

        $urls   = [];
        $failed = [];

        foreach (array_chunk($numbers, self::ND_BATCH_SIZE) as $batch) {
            $subject = implode(',', $batch);

            try {
                $res = self::readDocuments(
                    sprintf(self::API_ASITE_GROUP_URI, $subject, $projectId),
                    ['file_structure' => 1],
                    $token,
                    "numbered documents {$subject}"
                );

                $urls += (array) ($res['url'] ?? []);
            } catch (\Throwable $e) {
                $failed[] = $subject;
                error_log("AsiteProvider: no documents read for {$subject}: " . $e->getMessage());
            }
        }

        if ($urls === []) {
            throw new Exception('Asite returned no document list for numbered documents ' . $ndString);
        }

        if ($failed !== []) {
            error_log(
                'AsiteProvider: read ' . count($urls) . ' of ' . count($numbers)
                . ' numbered documents; nothing came back for ' . implode(' | ', $failed)
            );
        }

        return ['success' => true, 'url' => $urls];
    }
}
