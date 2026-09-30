<?php

namespace CL\Pdf\Html\Table;

use CL\Pdf\Html\Abstraction;

class Table extends Abstraction
{

    /**
     * @var array|string[]
     */
    protected array $props = [
        "class" => "table"
    ];

    public function getTag(): string
    {
        return "table";
    }

    /**
     * @return string
     */
    public function renderChildren(): string
    {
        return $this->getSnippet("table")->getContent();
    }
}
