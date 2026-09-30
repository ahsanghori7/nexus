<?php

use Core\Config;
use Core\Service\Manager;
use Core\Middleware\Generic;
use Api\Middleware\ApiSession;
use Api\Middleware\Relay\CompaniesMiddleware;

$session_handler = Config::get("session.handler", ApiSession::class);
return [
    "type" => "http",
    "onError" => [
        "formValidation" => Generic::badRequest(),
        "invalidToken"   => $session_handler::invalidApiToken(),
        "tooManyRequests"  => Generic::tooManyRequests(),
        "noEntityFound"    => Generic::exceptionResponse("HTTP/1.0 404"),
        "projectOwnershipError" => Generic::exceptionResponse("HTTP/1.0 403"),
        "EndpointFetchFailure" => Generic::exceptionResponse("HTTP/1.0 500"),
    ],
    "default_action" => [
        "middleware" => [
            function ($a) {
                //ToDo: Add some more context and info
                $a->set("message", "No Api Route Found");
            },
            Generic::set("json",  function ($a) {
                $a->set("headers", ["HTTP/1.0 404 No Api Route Found" => ""]);
                return json_encode(['message' => $a->get("message", ""), "code" => 404]);
            })
        ]
    ],
    "actions" => [
        //CORS HANDLER
        [
            "key" => ".+",
            "method" => "OPTIONS",
            "middleware" => [
                Generic::corsResponse()
            ]
        ],
        [
            "key" => "company_options\/(?<region_id>[0-9]{1,7})$",
            "middleware" => [
                function ($action) use ($session_handler) {
                    //browser will send before a OPTIONS request, without the authorisation token, and then will send the real request
                    if ($action->getRoute()->getRequest()->get("method") !== "OPTIONS") {
                        $session_handler::validate()($action);
                    }
                },
                function ($action) {
                    $regionId = intval($action->get("uriArgs.region_id"));
                    $account = $action->getShape("account");
                    $aid = $account->int("id");

                    // Check ghost mode
                    $meta = json_decode($action->get("meta", ""));
                    if ($meta) {
                        $meta = get_object_vars($meta);
                        $environment = Config::get("environment");
                        $uid = $meta["ghost_$environment"];
                        if ($uid) {
                            $user = Manager::getService('account')->fetch("user/$uid/profile")->getShape('data');
                            $aid = $user->int("account_id");
                        }
                    }

                    $action->set("aid", $aid);
                    CompaniesMiddleware::loadByRegion($regionId)($action);
                    $spList = Manager::getService('account')->fetch("account/$aid/supply_chain_v2")->getCollection('data');
                    $spList = array_map(function ($sp) {
                        return intval($sp['child_id']);
                    }, $spList->getItemsAsArray());
                    $action->set("supply_chain_list", $spList);

                    CompaniesMiddleware::checkSupplyChain("accounts", "supply_chain_list")($action);
                },
                Generic::set("json",  function ($a) {
                    return json_encode(['data' => $a->get("accounts", [])]);
                })
            ]
        ],
        [
            "key" => "company_exists\/(?<region_id>[0-9]{1,7})$",
            "middleware" => [
                function ($action) {
                    $regionId = intval($action->get("uriArgs.region_id"));
                    CompaniesMiddleware::loadByRegion($regionId, alwaysStrict: true)($action);
                    $companies = $action->get("accounts");
                    $action->set("exists", $companies && $companies->count());
                },
                Generic::set("json",  function ($a) {
                    return json_encode(['data' => $a->get("exists")]);
                })
            ]
        ]
    ]
];
