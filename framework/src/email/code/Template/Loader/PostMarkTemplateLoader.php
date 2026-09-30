<?php

namespace Email\Template\Loader;

use Email\Template\AbstractTemplateLoader;
use Postmark\PostmarkClient;
use Core\Config;

class PostMarkTemplateLoader extends AbstractTemplateLoader
{

    /**
     * @return int
     * @throws \Exception
     */
    public function getID(): int
    {
        $client = new PostmarkClient(Config::get("clients.postmark.auth"));
        $templates = $client->listTemplates(templateType: 'Standard');
        if($templates){
            $template_id = 0;
            for($a = 0; $a < $templates->totalcount; $a++){
                if($templates->templates[$a]['name'] === $this->template_name){
                    $template_id = $templates->templates[$a]['TemplateId'];
                    break;
                }
            }
            return $template_id;
        }
        return 0;
    }

    /**
     * @return string
     * @throws \Exception
     */
    public function getHtml(): string
    {
        $client = new PostmarkClient(Config::get("clients.postmark.auth"));
        $templates = $client->listTemplates(templateType: 'Standard');
        if($templates){
            $template_id = 0;
            for($a = 0; $a < $templates->totalcount; $a++){
                if($templates->templates[$a]['name'] === $this->template_name){
                    $template_id = $templates->templates[$a]['TemplateId'];
                    break;
                }
            }
            return $client->getTemplate($template_id)->htmlbody;
        }
        return '';
    }

}
