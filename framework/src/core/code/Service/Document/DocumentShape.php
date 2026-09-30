<?php

namespace Core\Service\Document;

use Core\Data\Shape;


class DocumentShape extends Shape
{
    /**
     * @param array $document
     * @throws \Exception
     */
    public function __construct(array $document)
    {
        parent::__construct(['document' => (new DocumentService($document))]);
    }

    /**
     * @return mixed
     */
    public function getDocument(): mixed
    {
        return $this->get("document");
    }

    /**
     * @param string $uploadPath
     * @return mixed
     */
    public function upload(string $uploadPath): mixed
    {
        return $this->getDocument()->upload($uploadPath);
    }

    /**
     * @return string
     */
    public function getName(): string
    {
        return $this->getDocument()->getDocumentClient()->getName();
    }

    /**
     * @param string $name
     * @param array $args
     * @return void
     */
    public function __call(string $name, array $args)
    {
        if ( is_callable([$this->getDocument(), $name]) && method_exists($this->getDocument(), $name) ) {
            return $this->getDocument()->$name();
        }
    }
}
