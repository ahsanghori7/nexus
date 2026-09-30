<?php

namespace CL\Pdf\Html;

class Image extends Abstraction
{
    public function getTag(): string
    {
        return "image";
    }

    public function getContent() : string {
        return $this->getSnippet("image")->getContent();
    }
}
