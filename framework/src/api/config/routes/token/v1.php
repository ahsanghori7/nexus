<?php

use Core\Config;
use Core\Service\Manager;
use Core\Middleware\Generic;
use Core\Middleware\Service\AccountMiddleware;
use Api\Middleware\ApiSession;

$session_handler = Config::get("session.handler", ApiSession::class);
return [
    "type" => "http",
    "onError" => [
        "formValidation" => Generic::badRequest(),
        "invalidToken"   => $session_handler::invalidApiToken(),
        "tooManyRequests"  => Generic::tooManyRequests(),
        "noEntityFound"    => Generic::exceptionResponse("HTTP/1.0 404"),
        "EndpointFetchFailure" => Generic::exceptionResponse("HTTP/1.0 500"),
    ],
    "middleware" => [
        function ($action) use ($session_handler) {
            //browser will send before a OPTIONS request, without the authorisation token, and then will send the real request
            if ($action->getRoute()->getRequest()->get("method") !== "OPTIONS") {
                $session_handler::validate()($action);
            }
        },
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
            "key" => "^verify\/(?<token>[0-9a-z]+)$",
            "middleware" => [
                function ($a) {
                    $tokenCode = $a->get("uriArgs.token");
                    $token = Manager::getService('account')->fetch('token', ['token' => $tokenCode])->getCollection('data');
                    $a->set("token", $token->count() ? $token->first() : null);
                },
                Generic::set("json",  function ($a) {
                    return json_encode(['data' => $a->get("token")]);
                })
            ]
        ]
    ]
];
