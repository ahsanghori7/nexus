<?php

namespace Email\Template\Loader;

use Email\Template\AbstractTemplateLoader;

class FileTemplateLoader extends AbstractTemplateLoader
{

    /**
     * @return string
     */
    public function getHtml(): string
    {
        $template = $this->template_name;
        $file = dirname(__DIR__, 3)."/templates/$template";
        if(file_exists($file)){
            return file_get_contents($file);
        }
        return '';
    }

}
