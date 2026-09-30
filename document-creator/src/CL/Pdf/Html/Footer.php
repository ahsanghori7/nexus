<?php

namespace CL\Pdf\Html;

class Footer extends Abstraction
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
        return "footer";
    }

    public function getContent(): string
    {
        return $this->getSnippet("footer", $this->vars)->getContent();
    }

    /**
     * The header is never empty, but we get the content from a snippet
     * @return bool
     */
    public function isEmpty(): bool
    {
        return false;
    }

    /**
     * @return string
     * @throws \Exception
     */
    public function showPageNr()
    {
        return $this->getSnippet("page-nr", $this->vars)->getContent();
    }

    /**
     * @return array
     */
    public function getVars(): array
    {
        return $this->vars;
    }
}
