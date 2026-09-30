<?php

namespace Hubspot\Middleware;

use Core\Config;
use Core\Middleware\Generic;

class HubspotMiddleware
{
    const TOKEN_TYPE_PROMO = 8;

    /**
     * @return callable
     */
    public static function validTokenData(): callable
    {
        return function ($a) {
            //By Default Auth a route, but allow routes to be public
            $requiresAuth = $a->getRoute()->get("requires_auth", true);
            if ($requiresAuth) {
                $token = $a->getRoute()
                    ->getRequest()
                    ->getArgs()
                    ->get(Config::get("hubspot.api_token_name"));
                if (!$token) {
                    $a->set("error", ['No Token Provided'], true);
                }
                if ($token !== Config::get("hubspot.api_token")) {
                    $a->set("error", ['Api Token Mismatch'], true);
                }
            }
        };
    }

    /**
     * @param array $keysData
     * @return callable
     */
    public static function setTokenContent(array $keysData = ["token_credit_total", "email"]): callable
    {
        return function ($a) use ($keysData) {
            $json = $a->getRoute()->getRequest()->getJson()->toArray();
            foreach ($keysData as $param) {
                if (isset($json[$param])) {
                    $a->set($param, $json[$param]);
                } else {
                    $a->set("error", "$param not provided");
                }
            }
            $a->set("token_type", self::TOKEN_TYPE_PROMO);
        };
    }
}
