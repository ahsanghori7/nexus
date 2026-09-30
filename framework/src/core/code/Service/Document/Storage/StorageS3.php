<?php

namespace Core\Service\Document\Storage;

use Core\Service\Document\File\FileAbstract;

class StorageS3 extends Storage
{

    public const STORAGE = 's3';

    /**
     * @var mixed
     */
    public mixed $result;

    /**
     * @param FileAbstract $file
     * @param string $uploadPath
     * @return mixed
     * @throws \Exception
     */
    public function upload(FileAbstract $file, string $uploadPath): mixed
    {
        $this->result = $this->getStorage()->upload([
            'type'     => $file->getType(),
            'tmp_name' => $file->getPath(),
            'name'     => $file->getName(),
            'size'     => $file->getSize(),
        ], 'document', $uploadPath);
        return $this;
    }

    /**
     * @return mixed
     * @throws \Exception
     */
    public function getUploadedPath(): mixed
    {
        return $this->getStorage()->getS3KeyFromResponse($this->result);
    }
}
