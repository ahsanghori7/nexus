<?php

namespace CL\Pdf\Html\Table;

class Image extends \CL\Pdf\Html\Image
{
    /**
     * @return string
     */
    public function getTag(): string
    {
        return "";
    }

    /**
     * @return string
     */
    public function render(): string
    {
        return $this->getContent();
    }
}
