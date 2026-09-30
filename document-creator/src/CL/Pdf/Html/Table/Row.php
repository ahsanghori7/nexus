<?php

namespace CL\Pdf\Html\Table;

use CL\Pdf\Html\Abstraction;

class Row extends Abstraction {

    /**
     * @var bool
     */
    protected bool $renderChildren = false;

    /**
     * @var array|string[]
     */
    protected array $props = [
        "class" => "row"
    ];

    public function getTag(): string
    {
        return "tr";
    }

    public function getContent() : string {
        return $this->getSnippet("table-row")->getContent();
    }

}
