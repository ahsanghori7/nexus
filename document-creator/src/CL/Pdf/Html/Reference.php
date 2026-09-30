<?php

namespace CL\Pdf\Html;

class Reference extends Abstraction
{
    public function getTag(): string
    {
        return "reference";
    }

    public function getContent(): string
    {
        return $this->getSnippet("reference")->getContent();
    }
}
