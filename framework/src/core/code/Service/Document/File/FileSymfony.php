<?php

namespace Core\Service\Document\File;

use Symfony\Component\HttpFoundation\File\UploadedFile;

class FileSymfony extends FileAbstract
{

    public const CLIENT = "symfony";

    /**
     * @var UploadedFile
     */
    public UploadedFile $client;

    public function __construct(array $document)
    {
        $this->client = new UploadedFile(...$document);
    }

    public function getClient(): UploadedFile
    {
        return $this->client;
    }

    public function getName(): string
    {
        return $this->getClient()->getClientOriginalName();
    }

    public function getPath(): string
    {
        return $this->getClient()->getPathName();
    }

    public function getSize(): bool|int
    {
        return $this->getClient()->getSize();
    }

    public function getType(): string
    {
        return $this->getClient()->getClientMimeType();
    }

    public function isValid(): bool
    {
        return $this->getClient()->isValid();
    }
}
