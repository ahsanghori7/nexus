<?php

use Admin\Middleware\Relay;
use Admin\Middleware\Relay\User;
use Core\Data\Shape;
use Core\Middleware\Session;
use Core\Middleware\Generic;
use Core\Middleware\Service\PrequalificationMiddleware;
use Prosper\Middleware\AccountMiddleware as ProsperAccountMiddleware;
use Core\Service\Manager;

return [
    "key"   => "^relay$",
    "rules" => [Relay::isResource("user")],
    "type" => "http",
    "onError" => [
        "relayError" => function ($e, $a) {
            $a->set("json", $e->getMessage());
        },
        "noSession" => Generic::notAuthorised()
    ],
    "middleware" => [
        Session::validate()
    ],
    "actions" => [
        [
            "key"    => "user$",
            "middleware" => [
                Generic::collectUrlArguments([
                    "limit"  => 100,
                    "offset" => 0,
                    "order" => "created_at",
                    "desc" => true,
                    "query"  => null,
                    "region" => "",
                    "trade" => "",
                    "subscriptions" => "",
                    "type"   => ["required" => true]
                ]),
                Relay::load("account", new Shape(["resource" => "account/list"])),
                User::flatten(),
                Relay::map("links", ["count" => "total"], "info"),
                Relay::setJsonResponse(["data", "info"])
            ]
        ],
        [
            "key" => "user\/engagement\/(?<uid>[0-9]{1,7})$",
            "middleware" => [
                ProsperAccountMiddleware::loadUserEngagement("uriArgs.uid"),
                function ($a) {
                    $types = Manager::getService('account')->fetch("token/type")->getCollection("data")->filterByExistInArray('label', ['session'])->getIds();
                    if ($a->get("engagement")) {
                        $engagement_filtered = $a->get("engagement")->filterByExistInArray('token_type_id', $types);
                        $a->set("engagement", $engagement_filtered);
                        if ($engagement_filtered->count()) {
                            ProsperAccountMiddleware::countTotalEngagement()($a);
                            ProsperAccountMiddleware::filterEngagementByPreviousDays()($a);
                            $a->set("result", [
                                'total'      => $a->get("engagement_total"),
                                'last_login' => $engagement_filtered->getLast()->get("created_at"),
                                'last_month' => count($a->get("engagement_filtered"))
                            ]);
                        }
                    }
                },
                Generic::set("json",  function ($action) {
                    return json_encode(["data" => $action->get("result", [
                        'total'      => 0,
                        'last_login' => 0,
                        'last_month' => 0,
                    ])]);
                })
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
