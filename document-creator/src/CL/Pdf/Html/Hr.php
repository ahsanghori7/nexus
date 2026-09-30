<?php

namespace CL\Pdf\Html;

class Hr extends Abstraction
{
    public function getTag(): string
    {
        return "hr";
    }

    public function getContent(): string
    {
        return $this->getSnippet("hr")->getContent();
    }
}
