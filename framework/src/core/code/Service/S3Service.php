<?php

namespace Core\Service;

use Aws\S3\S3Client;
use Core\Data\Shape;
use ZipArchive;

class S3Service extends RestService
{
    /**
     * @var S3Client
     */
    protected S3Client $s3_client;

    /**
     * @return S3Client
     */
    public function getClient(): S3Client
    {
        if(!isset($this->s3_client)){
            $this->s3_client = new \Aws\S3\S3Client([
                'version' => $this->get("version"),
                'region'  => $this->get("region"),
                'credentials' => [
                    'key'    => $this->get("access_key"),
                    'secret' => $this->get("secret_key"),
                ]
            ]);
        }
        return $this->s3_client;
    }

    /**
     * @param string $bucket
     * @param string $key
     * @return bool
     */
    public function objectExists(string $bucket, string $key) : bool
    {
        return $this->getClient()->doesObjectExist($this->getBucket($bucket), $key);
    }

    /**
     * @param string $bucket
     * @param string $key
     * @return string
     */
    public function getURI(string $bucket, string $key): string
    {
        if($this->getClient()->doesObjectExist($bucket, $key)){
            return $this->getClient()->getObjectUrl($bucket, $key);
        }
        return '';
    }

    /**
     * @param string $bucketAlias Alias from config bucket list (e.g., 'document')
     * @param string $key Full S3 object key
     * @param int $expires Expiry seconds (default 900 = 15 minutes)
     * @return string
     */
    public function getSignedURI(string $bucketAlias, string $key, int $expires = 900): string
    {
        $bucket = $this->getBucket($bucketAlias);
        $cmd = $this->getClient()->getCommand('GetObject', [
            'Bucket' => $bucket,
            'Key'    => $key,
        ]);
        $request = $this->getClient()->createPresignedRequest($cmd, "+{$expires} seconds");
        return (string) $request->getUri();
    }

    /**
     * @param string $bucket
     * @return string
     * @throws \Exception
     */
    public function getBucket(string $bucket) : string {
        $get_bucket = strval($this->get("bucket.$bucket"));
        if(!$get_bucket) {
            throw new \Exception("Invalid aws bucket $bucket");
        }
        return $get_bucket;
    }

    /**
     * @param string $file
     * @param string $type
     * @param array<string, mixed> $parents
     * @return string
     */
    public function getKey(string $file, string $type, array $parents = []) : string {
        $key = $type . "/";
        if($parents) {
            $key .= implode("/", $parents) . "/";
        }
        if($prefix = $this->get("key_prefix")) {
            $key = $prefix . "/" . $key;
        }
        return $key . $file;
    }

    /**
     * @param array<string> $file
     * @param string $bucket
     * @param string $key
     * @return \Aws\Result<string,mixed>
     * @throws \Exception
     */
    public function upload(array $file, string $bucket, string $key): \Aws\Result
    {
        if(!$this->validateFileData($file)){
            throw new \Exception("Invalid file data");
        }
        return $this->getClient()->putObject([
            'Bucket'      => $this->getBucket($bucket),
            'Key'         => strval($this->getKey($file['name'], $key)),
            'SourceFile'  => $file['tmp_name'],
            'ContentType' => $file['type']
        ]);
    }

    /**
     * @param string $file
     * @param string $bucket
     * @param string $key
     * @return \Aws\Result
     * @throws \Exception
     */
    public function remove(string $file, string $bucket, string $key): \Aws\Result
    {
        return $this->getClient()->deleteObject([
            'Bucket' => $this->getBucket($bucket),
            'Key'    => strval($this->getKey($file, $key)),
        ]);
    }

    /**
     * @param string $bucket
     * @param string $key
     * @param string $text
     * @param array $meta
     * @return \Aws\Result
     * @throws \Exception
     */
    public function uploadContent(string $bucket, string $key, string $text, array $meta = []): \Aws\Result
    {
        $data = [
            'Bucket' => $this->getBucket($bucket),
            'Key' => $key,
            'Body' => $text,
        ];

        return $this->getClient()->putObject(array_merge($data, $meta));
    }

    /**
     * @param \Aws\Result<string> $result
     * @return string|null
     */
    public function getS3KeyFromResponse(\Aws\Result $result): ?string
    {
        $aws = $result->toArray();
        if ( isset($aws['ObjectURL']) ) {
            $url = parse_url(strval(urldecode($aws['ObjectURL'])), PHP_URL_PATH);
            if ( $url ) {
                $url = substr($url, 1);
                return strval($url);
            }
        }
        return null;
    }

    /**
     * @param string $key
     * @param string $bucket
     */
    public function download(string $bucket, string $key)
    {
        if (self::getClient()->doesObjectExist($bucket, $key)) {
            return self::getClient()->getObject([
                'Bucket' => $bucket,
                'Key' => $key,
            ]);
        }
        return null;
    }

    /**
     * @param string $bucket
     * @param string $key
     * @param string $path
     * @return \Aws\Result<string,mixed>|false
     */
    public function save(string $bucket, string $key, string $path): \Aws\Result|bool
    {
        if($this->getClient()->doesObjectExist($this->getBucket($bucket), $key)){
            return $this->getClient()->getObject([
                'Bucket' => $this->getBucket($bucket),
                'Key' => $key,
                'SaveAs' => $path
            ]);
        }
        return false;
    }

    /**
     * @param string $bucket
     * @param array $s3_keys
     * @param string $zip_name
     * @param string $zip_save_path
     * @return void
     */
    public function downloadDocumentsAsArchive(string $bucket, array $s3_keys, string $zip_name, string $zip_save_path): void
    {
        $zip        = new ZipArchive;
        $zip_path   = $zip_save_path . "/" . $zip_name;
        $files_path = $zip_save_path . "/files/";
        if(!is_dir($files_path)) {
            mkdir($files_path, 0764, true);
        }
        if(file_exists($zip_path)){
            unlink($zip_path);
        }
        if ($zip->open($zip_path, ZipArchive::CREATE) === TRUE ) {
            foreach($s3_keys as $s3_key){
                $name      = $s3_key['name'];
                $file_path = $files_path . $name;
                $this->save($bucket, urldecode($s3_key['s3_key']), $file_path);
                if(file_exists($file_path)) {
                    $zip->addFile($file_path, $name);
                }
            }
            $zip->close();
            array_map('unlink', array_filter((array) glob($files_path."*")));
        }
    }

    /**
     * @param array<string> $file
     * @return bool
     */
    public function validateFileData(array $file): bool
    {
        return
            (
                isset($file['name'], $file['tmp_name'], $file['type'], $file['size']) &&
                $file['size'] > 0
            );
    }

  /**
   * @param string $type
   * @param string $bucket
   * @param Shape $document
   * @return Shape
   * @throws \Exception
   */
    public function sendException(string $type, string $bucket, Shape $document)
    {
        try{
          $res = $this->upload($document->get('document'), $bucket, $type);
          if($res['@metadata']['statusCode'] !== 200){
            return new Shape([
              "write_response" => 'Document could not be uploaded to S3',
              'write_error'    => true
            ]);
          }
        }
        catch (\Exception $e){
          return new Shape([
            "write_response" => $e->getMessage(),
            'write_error'    => true
          ]);
        }
    }
}
