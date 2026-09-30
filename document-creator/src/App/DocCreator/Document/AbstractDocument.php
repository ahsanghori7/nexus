<?php

namespace App\DocCreator\Document;

use App\DocCreator\DocCreator;
use App\DocCreator\Shortcode\DocumentShortcode;

abstract class AbstractDocument{

    /**
     * @var DocCreator
     */
    protected $doc_creator;

    public function __construct(DocCreator $doc_creator){

        $this->doc_creator = $doc_creator;
    }

    /**
     * @return DocCreator
     */
    public function getDocCreator(): DocCreator
    {
        return $this->doc_creator;
    }

    /**
     * @return array
     */
    public function parseShortcodes(): array
    {
        return ((new DocumentShortcode($this->getDocCreator()))->parseShortcodes());

    }

    abstract public function getDataModels(): array;

}
