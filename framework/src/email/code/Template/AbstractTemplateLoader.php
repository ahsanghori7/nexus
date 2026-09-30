<?php

namespace Email\Template;

abstract class AbstractTemplateLoader
{

    /**
     * @var string
     */
    protected string $template_name;

    /**
     * @param string $template_name
     */
    public function setTemplate(string $template_name)
    {
        $this->template_name = $template_name;
    }


    abstract public function getHtml(): string;
}
