<?php

namespace Core\Service\Document;

use Core\Data\Shape;
use Core\Data\Collection;

class DocumentCollection extends Collection
{

    public const STORAGE_SERVICE = 's3';

    /**
     * @var array
     */
    public array $valid_documents = [];

    /**
     * @var array
     */
    public array $invalid_documents = [];

    /***
     * @param array $items
     * @param string $objectClass
     * @throws \Exception
     */
    public function __construct(array $items, string $objectClass = DocumentShape::class)
    {
        try{
            foreach($this->parseItems($items) as $item) {
                $documents[] = new DocumentShape([
                    $item['tmp_name'] ?? '',
                    $item['name'] ?? '',
                    $item['type'] ?? '',
                    $item['error'] ?? 0,
                    $item['size'] ?? 0,
                ]);
            }
            parent::__construct($documents ?? [], $objectClass);
        }catch (\Exception $e){
            //@TODO proper catch error
            echo $e->getMessage();die;
        }
    }

    /**
     * @param array $items
     * @return array
     */
    public function parseItems(array $items): array
    {
        $documents = [];
        foreach ($items as $type => $values) {
            if (is_array($values)) {
                foreach ($values as $key => $value) {
                    $documents[$key][$type] = $value;
                }
            } else {
                $documents[0][$type] = $values;
            }
        }
        return $documents;
    }

    /**
     * @return Shape
     * @throws \Exception
     */
    public function getDocuments(): Shape
    {
        foreach($this as $document) {
            if($document->getDocument()->getDocumentClient()->isValid()){
                $this->valid_documents[] = $document;
            }
            else{
                $this->invalid_documents[] = $document;
            }
        }
        return new Shape([
            'valid' => $this->valid_documents,
            'invalid' => $this->invalid_documents
        ]);
    }

    /**
     * @return mixed
     * @throws \Exception
     */
    public function getValidDocuments(): mixed
    {
        return $this->getDocuments()->get("valid");
    }

    /**
     * @return mixed
     * @throws \Exception
     */
    public function getInvalidDocuments(): mixed
    {
        return $this->getDocuments()->get("invalid");
    }
}
