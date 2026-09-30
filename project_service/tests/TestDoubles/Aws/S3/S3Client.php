<?php

declare(strict_types=1);

namespace Aws\S3;

class S3Client
{
    public function __construct(array $config = [])
    {
    }

    public function doesObjectExist(string $bucket, string $key, array $options = []): bool
    {
        return false;
    }

    public function getObject(array $args): array
    {
        return [];
    }

    public function getObjectUrl(string $bucket, string $key): string
    {
        return '';
    }

    public function putObject(array $args): array
    {
        return [];
    }

    public function deleteObject(array $args): array
    {
        return [];
    }

    public function listBuckets(): array
    {
        return [];
    }

    public function listObjectsV2(array $args): array
    {
        return [];
    }
}
