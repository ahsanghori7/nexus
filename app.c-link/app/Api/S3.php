<?php

namespace App\Api;
use Aws\S3\S3Client;
use App\core\Environment as Env;
use App\core\Config;

class S3 extends Client
{
    /**
     * @return S3Client
     */
    public static function getClient() {
        return new \Aws\S3\S3Client([
            'version' => Env::getValue("AWS_S3_VERSION"),
            'region'  => Env::getValue("AWS_S3_REGION"),
            'credentials' => [
                'key'    => Env::getValue("AWS_S3_ACCESS_KEY_ID"),
                'secret' => Env::getValue("AWS_S3_SECRET_ACCESS_KEY"),
            ],
            'suppress_php_deprecation_warning' => Env::getValue("AWS_S3_PHP_SUPPRESS_WARNING", true),
        ]);
    }

    /**
     * @param string $bucket
     * @param string $key
     * @param string $src
     * @param string $type
     * @return \Aws\Result
     */
    public static function upload(string $bucket, string $key, string $src, string $type) {
        return self::getClient()->putObject([
            'Bucket' => self::getBucket($bucket),
            'Key' => $key,
            'SourceFile' => $src,
            'ContentType' => $type
        ]);
    }

    /**
     * @param string $bucket
     * @param string $key
     * @param string $text
     * @param array $meta
     * @return \Aws\Result
     */
    public static function uploadContent(string $bucket, string $key, string $text, array $meta = []): \Aws\Result
    {
        $data = [
            'Bucket' => self::getBucket($bucket),
            'Key' => $key,
            'Body' => $text,
        ];

        return self::getClient()->putObject(array_merge($data, $meta));
    }

    /**
     * @param string $bucket
     * @param string $key
     * @return bool
     */
    public static function objectExists(string $bucket, string $key) : bool
    {
        return self::getClient()->doesObjectExist($bucket, $key);
    }

  /**
   * @param string $key
   * @param string $bucket
   */
  public static function download(string $bucket, string $key)
  {
    if(self::getClient()->doesObjectExist($bucket, $key)){
      return self::getClient()->getObject([
        'Bucket' => $bucket,
        'Key' => $key,
      ]);
    }
  }

   /**
    * @param string $src
    * @param string $dest
    * @param string $bucket
    * @return bool
    */
   public static function copy(string $src,  string $dest,  string $bucket) : bool {
      $success = false;
      if(self::getClient()->doesObjectExist($bucket, $src)) {
          $res = self::getClient()->copyObject(array(
              'Bucket' => $bucket,
              'CopySource' => $bucket . "/" . $src,
              'Key' => $dest
          ));
          if($res) {
              $success = true;
          }
      }
      return $success;
  }

    /**
     * @param string $bucket
     * @param string $key
     * @return string
     */
  public static function getURI(string $bucket, string $key): string
  {
      if(self::getClient()->doesObjectExist($bucket, $key)){
          return self::getClient()->getObjectUrl($bucket, $key);
      }

      return '';
  }

  /**
   * @param string $bucket
   * @param string $key
   * @param string $path
   * @return \Aws\Result|false
   */
  public static function save(string $bucket, string $key, string $path)
  {
    if(self::getClient()->doesObjectExist($bucket, $key)){
      return self::getClient()->getObject([
        'Bucket' => $bucket,
        'Key' => $key,
        'SaveAs' => $path
      ]);
    }
    return false;
  }

    /**
     * @param string $doc_name
     * @return string
     */
  public static function getSaveTmpPath(string $doc_name): string
  {
      return Config::get("document.download.folder") . $doc_name;
  }

    /**
     * @param string $download_dir
     * @param string $bucket
     * @param string $key
     */
  public static function saveDir(string $download_dir, string $bucket, string $key): void
  {
      self::getClient()->downloadBucket($download_dir, self::getBucket($bucket), $key);
  }

    /**
     * @param string $id
     * @return string
     * @throws \Exception
     */
    public static function getBucket(string $id) : string {
        $bucket =  Env::getValue(sprintf("AWS_S3_%s_BUCKET", strtoupper($id)), false);
        if(!$bucket) {
            throw new \Exception("Invalid aws bucket id $id");
        }
        return $bucket;
    }

    /**
     * @param string $key
     * @param string $bucket
     * @return \Aws\Result
     */
    public static function remove(string $key, string $bucket) {
        return self::getClient()->deleteObject([
            'Bucket' => $bucket,
            'Key'    => $key
        ]);
    }

    /**
     * @param string $src
     * @param string $dest
     * @param string $bucket
     * @return bool
     */
    public static function move(string $src,  string $dest,  string $bucket) : bool {
        $success = false;
        if(self::getClient()->doesObjectExist($bucket, $src)) {
            $res = self::getClient()->copyObject(array(
                'Bucket' => $bucket,
                'CopySource' => $bucket . "/" . $src,
                'Key' => $dest
            ));

            if($res) {
                self::remove($src, $bucket);
                $success = true;
            }
        }
        return $success;
    }
    /**
     * @param string $file
     * @param string $type
     * @param array|null $parents
     * @return string
     */
    public static function getKey(string $file, string $type, ?array $parents=null) : string {
        $key = $type . "/";
        if($parents) {
            $key .= implode("/", $parents) . "/";
        }

        $prefix = self::getConfig()["key_prefix"];
        if($prefix) {
            $key = $prefix . "/" . $key;
        }

        return $key . $file;
    }

        /**
    * @return string
    */
    public static function getBucketFolder (): string
    {
        return Env::getValue("AWS_S3_BUCKET_FOLDER");
    }

    /**
     * @param string $dest
     * @return string
     */
    public static function getBucketDestination (string $dest): string
    {
        return rtrim(self::getBucketFolder(), '/') . '/' . $dest;
    }

    /**
   * @param int $pid
   * @param int $tid
   */
  public static function getTransactionQuoteFile(int $pid, int $tid, $sid, ?int $qid = null): ?string
  {
    $bucket = self::getBucket('DOCUMENT');
    $candidateKeys = [];
    if ($qid !== null) {
      $candidateKeys[] = self::getBucketDestination(sprintf('%s/tenders/%s/transactions/%s/quotes/%s', $pid, $tid, $qid, $sid . ".zip"));
    }
    $candidateKeys[] = self::getBucketDestination(sprintf('%s/tenders/%s/transactions/quotes/%s', $pid, $tid, $sid . ".zip"));

    foreach ($candidateKeys as $key) {
      $uri = self::getURI($bucket, $key);

      if ($uri && $uri !== '') {
        return $uri;
      }
    }

    return null;
  }
}
