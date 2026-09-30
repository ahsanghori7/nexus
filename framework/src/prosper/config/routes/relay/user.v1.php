<?php

use Core\Middleware\Generic;
use Core\Middleware\Session;
use Core\Middleware\Service\AccountMiddleware;
use Core\Middleware\Service\PrequalificationMiddleware;
use Prosper\Middleware\Relay;
use Prosper\Middleware\Relay\User;

return [
    "key" => "^relay$",
    "rules" => [Relay::isResource("user")],
    "middleware" => [
        Session::validate()
    ],
    "type" => "http",
    "onError" => [
        "relayError" => function ($e, $a) {
            $a->set("json", $e->getMessage());
        },
        "onError" => [
            "noSession" => Generic::notAuthorised()
        ],
    ],
    "actions" => [
        [
            "key" => "change_password$",
            "method" => "PATCH",
            "middleware" => [
                User::validatePassword(),
                User::changePassword(),
                Generic::set("json",  function ($a) {
                    return json_encode(["success" => $a->get("success", false)]);
                }),
            ],
            "onError" => [
                "passwordValidate" => function ($e, $a) {
                    $a->set("json", $e->getMessage());
                },
            ]
        ],
        [
            "key" => "check_promo_token$",
            "method" => "PATCH",
            "onError" => [
                "invalidToken" =>
                function ($ex, $a) {
                    Generic::set("json",  function () {
                        return json_encode(["success" => false]);
                    })($a);
                },
            ],
            "middleware" => [
                function ($a) {
                    $json = $a->getRoute()->getRequest()->getJson();
                    $token = $json ? $json->get("promo_token") : false;
                    if ($token) {
                        $a->set("promo_token", $token);
                        AccountMiddleware::existsByToken("promo_token", "promo", "promo_token")($a);
                        $promoToken = $a->get("promo_token");
                        $meta = $promoToken ? json_decode($promoToken->get("meta"), true) : null;
                        $tokenAward = $meta ? $meta["token_award"] : 0;
                        $a->set("token_award", $tokenAward);
                    }
                    if ($a->get("token_award")) {
                        AccountMiddleware::getService()->delete("token/$token");
                    }
                },
                Generic::set("json",  function ($a) {
                    return json_encode(["success" => (bool)$a->get("token_award"), "token_award" => $a->get("token_award")]);
                }),
            ]
        ],
        [
            "key"  => "default_certificates",
            "method" => "GET",
            "middleware" => [
                PrequalificationMiddleware::loadDefaultCertificates(),
                Generic::set("json",  function ($a) {
                    return json_encode(["data" => $a->get("default_certificates")->getItemsAsArray()]);
                }),
            ]
        ],
    ]
];
