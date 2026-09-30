<?php

namespace Email\Template;

use Core\Data\Shape;

class Template
{

    /**
     * @var Shape
     */
    protected Shape $data;

    /**
     * @var string
     */
    protected string $start_tag = '{{';

    /**
     * @var string
     */
    protected string $end_tag   = '}}';

    /**
     * @var AbstractTemplateLoader
     */
    protected AbstractTemplateLoader $template;

    /**
     * Template constructor.
     * @param AbstractTemplateLoader $template
     */
    public function __construct(AbstractTemplateLoader $template)
    {
        $this->setTemplate($template);
    }

    /**
     * @return Shape
     */
    public function getTemplateData(): Shape
    {
        return $this->data;
    }

    /**
     * @param AbstractTemplateLoader $template
     * @return $this
     */
    public function setTemplate(AbstractTemplateLoader $template): Template
    {
        $this->template = $template;
        return $this;
    }

    /**
     * @return string
     */
    public function getHtml(): string
    {
        return $this->template->getHtml();
    }

    /**
     * @return string
     */
    public function getStartTag(): string
    {
        return $this->start_tag;
    }

    /**
     * @return string
     */
    public function getEndTag(): string
    {
        return $this->end_tag;
    }

    /**
     * @param string $shortcode
     * @return string
     */
    public function wrapShortcodeBetweenTags(string $shortcode): string
    {
        return sprintf("%s%s%s", $this->getStartTag(), $shortcode, $this->getEndTag());
    }

    /**
     * @return string
     */
    public function getPregMatchPattern(): string
    {
        return '/'.$this->getStartTag().'(.*?)'.$this->getEndTag().'/';
    }

    /**
     * @param Shape $data
     * @return string
     */
    public function getTemplateHtml(Shape $data): string
    {
        $matches = [];
        $content = $this->getHtml();
        $shortcodes = preg_match_all($this->getPregMatchPattern(), $content, $matches) ? $matches[1] : [];
        foreach($shortcodes as $shortcode){
            $content = str_replace($this->wrapShortcodeBetweenTags($shortcode), $data->get($shortcode, ""), $content);
        }
        return $content ?? '';
    }
}
