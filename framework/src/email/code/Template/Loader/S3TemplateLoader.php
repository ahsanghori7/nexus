<?php

namespace Email\Template\Loader;


use Core\Service\Manager;
use Email\Template\AbstractTemplateLoader;

class S3TemplateLoader extends AbstractTemplateLoader
{

    /**
     * @return string
     * @throws \Exception
     */
    public function getHtml(): string
    {
        try{
            $template = Manager::getService("document")->fetch("document", [
                'type' => 4,
                'name' => $this->template_name
            ])->getShape('data');
            if ($template->get()) {
                $template = (array)$template->get();
                $template = array_shift($template);
                $res = Manager::getService("s3")->download(Manager::getService("s3")->getBucket("email"), $template['s3_key']);
                if($res && isset($res['Body'])) {
                    return $res['Body']->getContents();
                }
            }
        }catch (\Exception $e){
            throw new \Exception("Template not found");
        }

        throw new \Exception("Template not found");
    }

}
