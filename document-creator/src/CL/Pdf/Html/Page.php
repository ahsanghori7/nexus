<?php

namespace CL\Pdf\Html;

class Page extends Abstraction {

    protected array $props = [];

    protected string $conditionalContent = "";

    /**
     * @param array $data
     */
    public function __construct(array $data = [])
    {
        parent::__construct($data);
        $this->conditionalContent = $data["conditionalContent"] ?? "";
    }

    /**
     * @return string
     */
    public function getConditionalContent(): string
    {
        return $this->conditionalContent;
    }

    /**
     * @param string $conditionalContent
     */
    public function setConditionalContent(string $conditionalContent): void
    {
        $this->conditionalContent = $conditionalContent;
    }

    /**
     * @return string
     */
    public function getTag(): string
    {
        return "div";
    }

    /**
     * @return string
     */
    public function getInlineStyles() : string {
        return '';
    }

    /**
     * @return string
     */
    public function render() : string {
        if ($this->getConditionalContent() === "Hide") {
            return "";
        }
        return parent::render();
    }

}
