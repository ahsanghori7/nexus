<?php

declare(strict_types=1);

namespace Tests\Unit\Infrastructure;

use App\Infrastructure\Persistence\S3;
use Aws\S3\S3Client;
use PHPUnit\Framework\TestCase;
use Slim\Psr7\UploadedFile;

class S3Test extends TestCase
{
    protected function tearDown(): void
    {
        S3::setClient(null);
        S3::setBucket('');
        S3::setBucketFolder('');
    }

    public function testUploadDelegatesToClient(): void
    {
        S3::setBucket('bucket');
        S3::setBucketFolder('root');
        $file = $this->createUpload('demo.txt');

        $client = new FakeS3Client();
        S3::setClient($client);

        S3::upload($file, 1, 2, 3);

        self::assertSame('bucket', $client->lastPut['Bucket'] ?? null);
        self::assertStringContainsString('root/', $client->lastPut['Key'] ?? '');
        self::assertStringContainsString('/transactions/3/quotes/', $client->lastPut['Key'] ?? '');
        self::assertSame($file->getFilePath(), $client->lastPut['SourceFile'] ?? null);
    }

    public function testDeleteDelegatesToClient(): void
    {
        S3::setBucket('bucket');
        S3::setBucketFolder('root');
        $client = new FakeS3Client();
        S3::setClient($client);
        S3::delete(1, 2, 'file.pdf');

        self::assertSame('bucket', $client->lastDelete['Bucket'] ?? null);
        self::assertSame('root/1/2/file.pdf', $client->lastDelete['Key'] ?? null);
    }

    public function testGetTransactionQuoteFileUsesClientUrl(): void
    {
        S3::setBucket('bucket');
        S3::setBucketFolder('root');
        $client = new FakeS3Client();
        $client->doesObjectExist = true;
        $client->objectUrl = 'https://example.com/object';
        S3::setClient($client);

        self::assertSame('https://example.com/object', S3::getTransactionQuoteFile(1, 2, 3, 4));
        self::assertSame(['bucket', 'root/1/tenders/2/transactions/4/quotes/3.zip'], $client->objectUrlArgs);
    }

    public function testGetTransactionQuoteFileReturnsNullWhenMissing(): void
    {
        S3::setBucket('bucket');
        S3::setBucketFolder('root');
        $client = new FakeS3Client();
        $client->doesObjectExist = false;
        S3::setClient($client);

        self::assertNull(S3::getTransactionQuoteFile(1, 2, 3, 4));
    }

    public function testGetTransactionQuoteCandidateKeysIncludesLegacyFallback(): void
    {
        S3::setBucketFolder('root');

        self::assertSame([
            'root/1/tenders/2/transactions/4/quotes/3.zip',
            'root/1/tenders/2/transactions/quotes/3.zip',
        ], S3::getTransactionQuoteCandidateKeys(1, 2, '3.zip', 4));

        self::assertSame([
            'root/1/tenders/2/transactions/quotes/3.zip',
        ], S3::getTransactionQuoteCandidateKeys(1, 2, '3.zip'));
    }

    public function testGetAllTransactionQuoteFilesForProjectListsOnlyQuoteFiles(): void
    {
        S3::setBucket('bucket');
        S3::setBucketFolder('root');
        $client = new FakeS3Client();
        $transactionQuoteKey = 'root/7/tenders/11/transactions/500/quotes/3.zip';
        $legacyQuoteKey = 'root/7/tenders/11/transactions/quotes/4.zip';
        $client->paginatorPages = [
            [
                'Contents' => [
                    ['Key' => $transactionQuoteKey],
                    ['Key' => 'root/7/tenders/11/transactions/500/documents/contract.pdf'],
                    ['Key' => 'root/7/tenders/11/files/quotes/skip.zip'],
                ],
            ],
            [
                'Contents' => [
                    ['Key' => $legacyQuoteKey],
                ],
            ],
        ];
        S3::setClient($client);

        self::assertSame([
            $transactionQuoteKey => 'https://example.com/' . $transactionQuoteKey,
            $legacyQuoteKey => 'https://example.com/' . $legacyQuoteKey,
        ], S3::getAllTransactionQuoteFilesForProject(7));
        self::assertSame([
            'ListObjectsV2',
            [
                'Bucket' => 'bucket',
                'Prefix' => 'root/7/tenders/',
            ],
        ], $client->paginatorArgs);
    }

    public function testGetAllTransactionQuoteFilesForProjectReturnsEmptyOnPaginatorException(): void
    {
        S3::setBucket('bucket');
        S3::setBucketFolder('root');
        $client = new FakeS3Client();
        $client->exception = new \RuntimeException('S3 unavailable');
        S3::setClient($client);

        self::assertSame([], S3::getAllTransactionQuoteFilesForProject(7));
    }

    public function testTransactionUnzipFilesReturnsFalseOnException(): void
    {
        S3::setBucket('bucket');
        S3::setBucketFolder('root');
        $client = new FakeS3Client();
        $client->doesObjectExist = true;
        $client->exception = new \RuntimeException('boom');
        S3::setClient($client);

        self::assertFalse(S3::transactionUnzipFiles(1, 2, 'file.zip', '/tmp/file.zip', '/tmp/dir', 4));
    }

    public function testTransactionUnzipFilesExtractsArchive(): void
    {
        S3::setBucket('bucket');
        S3::setBucketFolder('root');
        $client = new FakeS3Client();
        $client->doesObjectExist = true;
        $client->onGetObject = function (array $args): void {
            $zip = new \ZipArchive();
            $zip->open($args['SaveAs'], \ZipArchive::CREATE);
            $zip->addFromString('doc.txt', 'demo');
            $zip->close();
        };
        S3::setClient($client);

        $zipPath = tempnam(sys_get_temp_dir(), 'zip');
        $extractDir = sys_get_temp_dir() . '/extract_' . uniqid('', true);
        mkdir($extractDir);

        self::assertTrue(S3::transactionUnzipFiles(1, 2, 'doc.zip', $zipPath, $extractDir, 4));
        self::assertFileExists($extractDir . '/doc.txt');

        S3::transactionClearTempFiles($zipPath, $extractDir);
    }

    public function testTransactionUnzipFilesFallsBackToLegacyPath(): void
    {
        S3::setBucket('bucket');
        S3::setBucketFolder('root');
        $client = new FakeS3Client();
        $newKey = 'root/1/tenders/2/transactions/4/quotes/doc.zip';
        $oldKey = 'root/1/tenders/2/transactions/quotes/doc.zip';
        $client->doesObjectExistMap = [
            $newKey => false,
            $oldKey => true,
        ];
        $client->onGetObject = function (array $args): void {
            $zip = new \ZipArchive();
            $zip->open($args['SaveAs'], \ZipArchive::CREATE);
            $zip->addFromString('doc.txt', 'legacy');
            $zip->close();
        };
        S3::setClient($client);

        $zipPath = tempnam(sys_get_temp_dir(), 'zip');
        $extractDir = sys_get_temp_dir() . '/extract_' . uniqid('', true);
        mkdir($extractDir);

        self::assertTrue(S3::transactionUnzipFiles(1, 2, 'doc.zip', $zipPath, $extractDir, 4));
        self::assertContains(['bucket', $newKey], $client->doesObjectExistArgs);
        self::assertContains(['bucket', $oldKey], $client->doesObjectExistArgs);
        self::assertFileExists($extractDir . '/doc.txt');

        S3::transactionClearTempFiles($zipPath, $extractDir);
    }

    public function testTransactionClearTempFilesRemovesArtifacts(): void
    {
        $zipPath = tempnam(sys_get_temp_dir(), 'zip');
        $dir = sys_get_temp_dir() . '/files_' . uniqid('', true);
        mkdir($dir);
        file_put_contents($dir . '/a.txt', 'tmp');

        S3::transactionClearTempFiles($zipPath, $dir);

        self::assertFileDoesNotExist($zipPath);
        self::assertDirectoryDoesNotExist($dir);
    }

    public function testListDirectoryReturnsKeys(): void
    {
        S3::setBucket('bucket');
        S3::setBucketFolder('root');
        $client = new FakeS3Client();
        $client->listObjectsResult = [
            'Contents' => [
                ['Key' => 'root/items/one.txt'],
                ['Key' => 'root/items/two.txt'],
            ],
        ];
        S3::setClient($client);

        self::assertSame(
            ['root/items/one.txt', 'root/items/two.txt'],
            S3::listDirectory('items/')
        );
    }

    private function createUpload(string $filename): UploadedFile
    {
        $path = tempnam(sys_get_temp_dir(), 'upload');
        file_put_contents($path, 'demo');

        return new UploadedFile(
            $path,
            $filename,
            'application/octet-stream',
            filesize($path),
            UPLOAD_ERR_OK,
            true
        );
    }
}

class FakeS3Client extends S3Client
{
    public ?array $lastPut = null;
    public ?array $lastDelete = null;
    public bool $doesObjectExist = false;
    public array $doesObjectExistMap = [];
    public array $doesObjectExistArgs = [];
    public ?string $objectUrl = null;
    public ?array $objectUrlArgs = null;
    public ?\Throwable $exception = null;
    public $onGetObject = null;
    public array $listObjectsResult = [];
    public array $paginatorPages = [];
    public ?array $paginatorArgs = null;

    public function __construct()
    {
    }

    public function putObject(array $args)
    {
        $this->lastPut = $args;
        return new \Aws\Result($args);
    }

    public function deleteObject(array $args)
    {
        $this->lastDelete = $args;
        return new \Aws\Result($args);
    }

    public function doesObjectExist($bucket, $key, array $options = []): bool
    {
        $this->objectUrlArgs = [$bucket, $key];
        $this->doesObjectExistArgs[] = [$bucket, $key];
        if (array_key_exists($key, $this->doesObjectExistMap)) {
            return $this->doesObjectExistMap[$key];
        }
        return $this->doesObjectExist;
    }

    public function getObjectUrl($bucket, $key)
    {
        $this->objectUrlArgs = [$bucket, $key];
        return $this->objectUrl ?? 'https://example.com/' . $key;
    }

    public function getObject(array $args)
    {
        if ($this->exception) {
            throw $this->exception;
        }

        if ($this->onGetObject) {
            ($this->onGetObject)($args);
        }

        return new \Aws\Result($args);
    }

    public function listObjectsV2(array $args): array
    {
        if ($this->listObjectsResult) {
            return $this->listObjectsResult;
        }

        return ['Contents' => []];
    }

    public function getPaginator($name, array $args = [])
    {
        if ($this->exception) {
            throw $this->exception;
        }

        $this->paginatorArgs = [$name, $args];
        return new \ArrayIterator($this->paginatorPages);
    }
}
