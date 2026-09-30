<?php
namespace App\Models\Document;

use App\Models\Abstraction;
use App\Models\Document;

class Category extends Abstraction {

    /*
     * Categories with custom rules
     */
    public const ALLOCATE_CUSTOM_TENDERS = [
        'Architectural',
        'Structural',
        'M&E'
    ];

    /**
     * @param string $type
     * @return bool
     */
    public function isType(string $type) : bool {
        return (strcasecmp($type, $this->getData("entity_type")) === 0);
    }

    /**
     * @param array $types
     * @return bool
     */
    public function isOfType(array $types) : bool {
        return in_array(true, array_map(function($v) { return $this->isType($v); }, $types));
    }

    /**
     * @return bool
     */
    public function hasDocuments() : bool {
        $docs = $this->getData("documents");
        return (is_array($docs) && count($docs) > 0);
    }

    /**
     * @return array
     */
    public function getDocuments() : array {
        $docs = [];
        foreach($this->getData("documents") as $doc) {
            $docs[] = new Document($doc, $doc["id"]);
        }
        return $docs;
    }

    /**
     * @return array
     */
    public function getStructuralDocuments() : array {
        $docs = [];
        foreach($this->getData("documents") as $doc) {
            if($doc['type'] == \App\Api\Document::DOCUMENT_STRUCTURAL_TYPE){
                $docs[] = new Document($doc, $doc["id"]);
            }
        }
        return $docs;
    }

    /**
     * @param int $instruction_id
     * @return array
     */
    public function getInstructionDocuments(int $instruction_id) : array {
        $docs = [];
        foreach($this->getData("documents") as $doc) {
            $doc_meta = json_decode($doc['meta'], true);
            if(isset($doc_meta['instruction_id']) && $doc_meta['instruction_id'] == $instruction_id) {
                if ( $doc['type'] == \App\Api\Document::DOCUMENT_STRUCTURAL_TYPE ) {
                    $docs[] = new Document($doc, $doc["id"]);
                }
            }
        }
        return $docs;
    }

    /**
     * @param string $to
     * @return array
     */
    public function download(string $to) : array {
        $res = [];
        if($this->hasDocuments()) {
            foreach($this->getDocuments() as $document) {
               $res[$document->getId()] = $document->download($to);
            }
        }
        return $res;
    }

    /**
     * @param string $to
     * @return array
     */
    public function downloadStructural(string $to) : array {
        $res = [];
        if($this->hasDocuments()) {
            foreach($this->getStructuralDocuments() as $document) {
                $res[$document->getId()] = $document->download($to);
            }
        }
        return $res;
    }

    /**
     * @param string $to
     * @param int $instruction_id
     * @return array
     */
    public function downloadInstruction(string $to, int $instruction_id) : array {
        $res = [];
        if($this->hasDocuments()) {
            foreach($this->getInstructionDocuments($instruction_id) as $document) {
                $res[$document->getId()] = $document->download($to);
            }
        }
        return $res;
    }

    /**
     * @return array|mixed|null
     */
    public function getParentId()
    {
        return $this->getData('parent_id');
    }

    /**
     * @return array|mixed|null
     */
    public function getEntityId()
    {
        return $this->getData('entity_id');
    }

    /**
     * @return bool
     */
    public function hasCustomDrawingsRules(): bool
    {
        return !(in_array($this->getData("label"), self::ALLOCATE_CUSTOM_TENDERS, true));
    }

    /**
     * @param int $status_id
     * @return array
     */
    public function filterDocumentsByStatusId(int $status_id): array
    {
        return array_filter($this->getDocuments(), static function ($document) use ($status_id) {
            return $document->getData("status") === $status_id;
        });
    }

    /**
     * @param array $documents
     * @return Document|null
     */
    public function getLatestDocument(array $documents): ?Document
    {
        $publishedDocuments = array_values($documents);
        usort($publishedDocuments, static function ($a, $b) {
            return strtotime($b->getData("created_at")) - strtotime($a->getData("created_at"));
        });
        return array_shift($publishedDocuments);
    }
}
