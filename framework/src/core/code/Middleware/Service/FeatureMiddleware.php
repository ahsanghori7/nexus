<?php

namespace Core\Middleware\Service;

use Core\Data\Shape;
use Core\Service\Manager;
use Core\Middleware\ServiceMiddleware;

class FeatureMiddleware extends ServiceMiddleware
{

    public static function fetchFeatures(): callable
    {
        return function ($a) {
            $collection = Manager::getService('account')->fetch("feature")->getCollection("data");
            $a->set("collection", $collection);
        };
    }

    public static function fetchAccountWithFeatures(): callable
    {
        return function ($a) {
            $aid = $a->get("uriArgs.aid", false);
            $serviceUrl = $aid ? "feature/accounts/$aid" : "feature/accounts";
            $collection = Manager::getService('account')->fetch($serviceUrl)->getCollection("data");
            $a->set("collection", $collection);
        };
    }

    public static function fetchAccountEnvelopes(): callable
    {
        return function ($a) {
            $aid = $a->get("uriArgs.aid", 0);
            $data = Manager::getService('account')->fetch("feature/envelope/$aid")->getShape("data");
            $a->set("data", $data);
        };
    }

    public static function updateEnvelopes(): callable
    {
        return function ($a) {
            $aid = $a->get("uriArgs.aid");
            $json = $a->getRoute()->getRequest()->getData()->getShape("json");
            Manager::getService('account')->update("feature/envelope/$aid", new Shape([
                'data' => $json->toArray(),
                'options' => [
                    CURLOPT_CUSTOMREQUEST => "PATCH"
                ]
            ]));
        };
    }
}
