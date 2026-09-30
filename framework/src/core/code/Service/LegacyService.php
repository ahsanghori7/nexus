<?php

namespace Core\Service;

class LegacyService extends RestService
{

    /**
     * @param string $suffix
     * @return string
     * @throws \Exception
     */
    public function getPath(string $suffix = "") : string
    {

        $url = $this->get("url", "");
        if(is_string($url)) {
            $url = rtrim($url, "/") . "?action=". ltrim($suffix,"/");
        }
        else {
            throw new \Exception("Url must be string");
        }
        return $url;
    }


}
