<?php

namespace App\Infrastructure\Persistence;

use App\Infrastructure\Environment as Env;
use Aws\S3\S3Client;
use Slim\Psr7\UploadedFile;
use ZipArchive;

class S3
{

  protected static $client;

  /**
   * @var string
   */
  protected static $bucket = '';

  /**
   * @var string
   */
  protected static $bucket_folder = '';

  /**
   * @return S3Client
   */
  public static function getClient (): S3Client
  {
    if ( !self::$client ) {
      self::$client = new S3Client([
        'version' => Env::getValue("AWS_S3_VERSION"),
        'region' => Env::getValue("AWS_S3_REGION"),
        'credentials' => [
          'key' => Env::getValue("AWS_S3_ACCESS_KEY_ID"),
          'secret' => Env::getValue("AWS_S3_SECRET_ACCESS_KEY"),
        ],
        'suppress_php_deprecation_warning' => true
      ]);
    }

    return self::$client;
  }

  /**
   * Allow tests to replace the underlying client
   */
  public static function setClient(?S3Client $client): void
  {
      self::$client = $client;
  }

  /**
   * @param string $zip
   * @param string $files
   */
  public static function transactionClearTempFiles(string $zip, string $files): void
  {
    gc_collect_cycles(); //this is need per the issue described here https://github.com/aws/aws-sdk-php/issues/841

    if(is_file($zip)){
      unlink($zip);
    }
    self::deleteDirectory($files);
  }

  /**
   * @param string $dir
   */
  public static function deleteDirectory(string $dir): void
  {
    if(is_dir($dir)) {
      array_map('unlink', array_filter((array)glob($dir . "/*")));
      rmdir($dir);
    }
  }

  /**
   * @param int $pid
   * @param int $tid
   */
  public static function getTransactionQuoteFile(int $pid, int $tid, $sid, ?int $qid = null): ?string
  {
    $bucket = self::getBucket();
    $candidateKeys = self::getTransactionQuoteCandidateKeys($pid, $tid, $sid . ".zip", $qid);

    foreach ($candidateKeys as $key) {
      if (self::getClient()->doesObjectExist($bucket, $key)) {
        return self::getClient()->getObjectUrl($bucket, $key);
      }
    }

    return null;
  }

  /**
   * @param int $pid
   * @param int $tid
   * @param string $filename
   * @param int|string|null $qid
   * @return array
   */
  public static function getTransactionQuoteCandidateKeys(int $pid, int $tid, string $filename, $qid = null): array
  {
    $candidateKeys = [];
    if ($qid !== null) {
      $candidateKeys[] = self::getBucketDestination(sprintf('%s/tenders/%s/transactions/%s/quotes/%s', $pid, $tid, $qid, $filename));
    }
    $candidateKeys[] = self::getBucketDestination(sprintf('%s/tenders/%s/transactions/quotes/%s', $pid, $tid, $filename));

    return $candidateKeys;
  }

  /**
   * @param int $pid
   * @return array
   */
  public static function getAllTransactionQuoteFilesForProject(int $pid): array
  {
    $bucket = self::getBucket();
    $prefix = self::getBucketDestination(sprintf('%s/tenders/', $pid));
    $files = [];

    try {
      $paginator = self::getClient()->getPaginator('ListObjectsV2', [
        'Bucket' => $bucket,
        'Prefix' => $prefix
      ]);

      foreach ($paginator as $page) {
        if (!empty($page['Contents'])) {
          foreach ($page['Contents'] as $object) {
            if (strpos($object['Key'], '/transactions/') !== false && strpos($object['Key'], '/quotes/') !== false) {
              $files[$object['Key']] = self::getClient()->getObjectUrl($bucket, $object['Key']);
            }
          }
        }
      }
    } catch (\Exception $e) {
      return [];
    }

    return $files;
  }

  /**
   * @param int $pid
   * @param int $tid
   * @param string $file_name
   * @param string $zipPath
   * @param string $files
   * @param int|null $qid
   * @return bool
   */
  public static function transactionUnzipFiles(int $pid, int $tid, string $file_name, string $zipPath, string $files, ?int $qid = null): bool
  {
    $bucket = self::getBucket();
    $candidateKeys = self::getTransactionQuoteCandidateKeys($pid, $tid, $file_name, $qid);

    foreach ($candidateKeys as $candidateKey) {
      $response = self::getClient()->doesObjectExist($bucket, $candidateKey);
      if(!$response){
        continue;
      }
      try{
        self::getClient()->getObject([
          'Bucket' => $bucket,
          'Key' => $candidateKey,
          'SaveAs' => $zipPath
        ]);

        if(is_file($zipPath)) {
          $zip = new ZipArchive;
          if ( $zip->open($zipPath) === TRUE ) {
            $zip->extractTo($files);
            $zip->close();
            return true;
          }
        }

        return true;
      }catch (\Exception $e){
        return false;
      }
    }

    return false;
  }

  /**
   * @param UploadedFile $file
   * @param int $pid
   * @param int $tid
   * @return \Aws\Result
   */
  public static function upload (UploadedFile $file, int $pid, int $tid, int $qid): \Aws\Result
  {
    return self::getClient()->putObject([
      'Bucket' => self::getBucket(),
      'Key' => self::getBucketDestination(sprintf('%s/tenders/%s/transactions/%s/quotes/%s', $pid, $tid, $qid, $file->getClientFilename())),
      'SourceFile' => $file->getFilePath()
    ]);
  }

  /**
   * Un-zipped copy of a single quote file, stored where the boq quote-document
   * download reads from: {environment}/documents/quote-documents/{qid}/{name}.
   *
   * Requires AWS_S3_DOCUMENT_BUCKET (must be the same bucket the framework and
   * app.c-link resolve for 'document') and ENVIRONMENT (must equal the
   * framework's ENV key prefix). No fallback bucket on purpose: writing to the
   * wrong bucket would succeed silently and leave the file undownloadable.
   *
   * @param string $filePath
   * @param string $fileName
   * @param int $qid transaction id
   * @return string the stored s3 key
   * @throws \RuntimeException when the document bucket is not configured
   */
  public static function uploadTransactionDocument(string $filePath, string $fileName, int $qid): string
  {
    $bucket = Env::getValue("AWS_S3_DOCUMENT_BUCKET");
    if (!$bucket) {
      throw new \RuntimeException("AWS_S3_DOCUMENT_BUCKET is not configured; skipping quote document capture");
    }

    $key = sprintf(
      '%s/documents/quote-documents/%s/%s',
      Env::getValue("ENVIRONMENT"),
      $qid,
      self::rename($fileName)
    );

    self::getClient()->putObject([
      'Bucket' => $bucket,
      'Key' => $key,
      'SourceFile' => $filePath
    ]);

    return $key;
  }

  /**
   * @param UploadedFile $file
   * @return bool
   */
  public static function validate (UploadedFile $file): bool
  {
    $valid = true;

    if (
      !self::validateSize($file) ||
      !self::validateType($file)
    ) {
      $valid = false;
    }

    return $valid;
  }

  /**
   * @param int $pid
   * @param int $cid
   * @param string $file
   * @return \Aws\Result
   */
  public static function delete (int $pid, int $cid, string $file): \Aws\Result
  {
    return self::getClient()->deleteObject([
      'Bucket' => self::getBucket(),
      'Key' => self::getBucketDestination(sprintf('%s/%s/%s', $pid, $cid, $file)),
    ]);
  }

  /**
   * @param UploadedFile $file
   * @TODO implement the script to get the file type
   */
  public static function getType (UploadedFile $file)
  {

  }

  /**
   * @return mixed
   */
  public static function getMaxSize ()
  {
    return Env::getValue("MAX_FILE_SIZE");
  }

  /**
   * @param UploadedFile $file
   * @return bool
   */
  public static function validateSize (UploadedFile $file): bool
  {
    return $file->getSize() <= self::getMaxSize() && $file->getSize() > 0;
  }

  /**
   * @param UploadedFile $file
   * @return bool
   * @TODO implement the validate for file types
   */
  public static function validateType (UploadedFile $file): bool
  {
    $type = self::getType($file);

    return true;
  }

  /**
   * @param string $file
   * @return string
   * @TODO implement a rename logic
   */
  public static function rename (string $file): string
  {
    return $file;
  }

  /**
   * @param string $dest
   * @return string
   */
  public static function getBucketDestination (string $dest): string
  {
    return rtrim(self::getBucketFolder(), '/') . '/' . self::rename($dest);
  }

  /**
   * @return mixed
   */
  public static function getBucketList ()
  {
    return self::getClient()->listBuckets();
  }

  /**
   * @return string
   */
  public static function getBucket (): string
  {
    if ( !self::$bucket ) {
      return Env::getValue("AWS_S3_BUCKET");
    }

    return self::$bucket;
  }

  /**
   * @param string $bucket
   */
  public static function setBucket (string $bucket): void
  {
    self::$bucket = $bucket;
  }

  /**
   * @param string $path
   */
  public static function setBucketFolder (string $path): void
  {
    self::$bucket_folder = $path;
  }

  /**
   * @return string
   */
  public static function getBucketFolder (): string
  {
    if ( !self::$bucket_folder ) {
      return Env::getValue("AWS_S3_BUCKET_FOLDER");
    }

    return self::$bucket_folder;
  }

  public static function listDirectory($directory, $delimiter = "/") {
      $result = self::getClient()->listObjectsV2([
        'Bucket' => self::getBucket(),
        'Prefix' => $directory,
        'Delimiter' => $delimiter // / limits the results to immediate children
      ]);

      $files = [];
      if ($result['Contents']) {
          foreach ($result['Contents'] as $object) {
            $files[] = $object["Key"];
          }
      }

      return $files;
  }
}
