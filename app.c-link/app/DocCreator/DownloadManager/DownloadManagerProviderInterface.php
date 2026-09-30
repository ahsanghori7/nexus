<?php

namespace App\DocCreator\DownloadManager;

interface DownloadManagerProviderInterface
{
    /**
     * @param array $numbers
     * @param array $context
     * @return array
     */
    public function getLinks(array $numbers, array $context): array;

    /**
     * @param array $context
     * @param string $type
     */
    public function dispatch(array $context, string $type = 'snapshot'): void;

    /**
     * @param array $payload
     * @param string $token
     * @return array
     */
    public function getSnapshotDocuments(array $payload, string $token): array;

    /**
     * @param int $parentDocId
     * @param string $url
     * @param string $token
     * @return array
     */
    public function fetchFileContent(int $parentDocId, string $url, string $token): array;

    /**
     * @param array $payload
     * @param string $token
     * @return array
     */
    public function getPreviewSnapshotDocuments(array $payload, string $token): array;
}
