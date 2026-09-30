<?php

namespace Core\Middleware\Service;

use Core\Service\Manager;
use Core\Middleware\ServiceMiddleware;

class PrequalificationMiddleware extends ServiceMiddleware
{
    /**
     * @param string $aidKey
     * @return callable
     */
    public static function loadDefaultCertificates(): callable
    {
        return function ($action) {
            try {
                $data = Manager::getService('document')->fetch("document/preq_default_certificates")->getCollection('data');
            } catch (\Exception $e) {
                $data = [];
            }
            $action->set("default_certificates", $data);
        };
    }
}
