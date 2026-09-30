<?php

namespace CL\Pdf\Html;

class Coverpage extends Page
{
    public function renderChildren(): string
    {
        return $this->getSnippet("cover")->getContent();
    }
}
