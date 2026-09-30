<?php

namespace CompanyProfile\Middleware;

use Core\Middleware\ServiceMiddleware;

class S3Middleware extends ServiceMiddleware
{

    const SERVICE = 's3';

    /**
     * @param string $file_key
     * @param string $type
     * @return \Closure
     */
    public static function updateLogo(string $file_key = 'logo', string $type = 'logo'): \Closure
    {
        return function ($action) use ($file_key, $type) {
            $data = $action->getRoute()->getRequest()->getData();
            $file = $data->getShape("files")->get($file_key);
            $hash = md5(strval($action->get("aid")));
            if(method_exists(self::getService(), 'upload')) {
                $file['name'] = $type . '.png';
                self::getService()->upload($file, 'asset', "account/logo/$hash");
            }
        };
    }

    /**
     * @param string $type
     * @return \Closure
     */
    public static function removeLogo(string $type = 'logo'): \Closure
    {
        return function ($action) use ($type) {
            $hash = md5(strval($action->get("aid")));
            if(method_exists(self::getService(), 'remove')) {
                self::getService()->remove($type . '.png', 'asset', "account/logo/$hash");
            }
        };
    }

}
