<?php

namespace CL\Pdf\Html\Table;

use CL\Pdf\Html\Abstraction;

class Thead extends Abstraction {

    /**
     * @var array|string[]
     */
    protected array $props = [
        "class" => "thead"
    ];

    public function getTag(): string
    {
        return "tr";
    }

    /**
     * @return string
     */
    public function renderChildren() : string {
        return $this->getSnippet("thead")->getContent();
    }
}
