<?php

namespace Core\Service\Document;

use Core\Service\Document\File\FileAbstract;
use Core\Service\Document\File\FileSymfony;
use Core\Service\Document\Storage\Storage;
use Core\Service\Document\Storage\StorageS3;

class DocumentService
{

    /**
     * @var array|\class-string[]
     */
    public array $storageModels = [
        's3' => StorageS3::class
    ];

    public array $documentModels = [
        'symfony' => FileSymfony::class
    ];

    /**
     * @var string
     */
    public string $upload_path = '';


    /**
     * @var array
     */
    public array $document = [];

    /**
     * @param array $document
     */
    public function __construct(array $document)
    {
        $this->document = $document;
    }

    /**
     * @param string $clientService
     * @return mixed|void
     * @throws \Exception
     */
    public function getDocumentClient(string $clientService = '')
    {
        if(!$clientService){
            $clientService = FileAbstract::getClientName();
        }
        if(isset($this->documentModels[$clientService])){
            return (new $this->documentModels[$clientService]($this->document));
        }
    }

    /**
     * @param string $storageService
     * @return mixed|void
     * @throws \Exception
     */
    public function getStorageClient(string $storageService = '')
    {
        if(!$storageService){
            $storageService = Storage::getDefaultStorage();
        }
        if(isset($this->storageModels[$storageService])){
            return (new $this->storageModels[$storageService]);
        }
    }

    /**
     * @param string $uploadPath
     * @return $this
     * @throws \Exception
     */
    public function upload(string $uploadPath): static
    {
        $storage = $this->getStorageClient();
        $this->upload_path = $storage->upload($this->getDocumentClient(), $uploadPath)->getUploadedPath();
        return $this;
    }

    /**
     * @return string
     */
    public function getUploadedPath(): string
    {
        return $this->upload_path;
    }
}
