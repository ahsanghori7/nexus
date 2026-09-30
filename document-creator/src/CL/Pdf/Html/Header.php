<?php

namespace CL\Pdf\Html;

class Header extends Abstraction
{
    /**
     * Header and Footer only have vars not props
     */
    protected array $vars = [];

    public function __construct(array $data = [])
    {
        $this->vars = $data;
        parent::__construct([]);
    }

    public function getTag(): string
    {
        return "header";
    }

    public function getContent() : string {
        return $this->getSnippet("header", $this->vars)->getContent();
    }

    /**
     * The header is never empty, but we get the content from a snippet
     * @return bool
     */
    public function isEmpty() : bool {
        return false;
    }
}
