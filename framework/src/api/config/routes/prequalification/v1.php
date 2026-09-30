<?php

use Core\Config;
use Core\Middleware\Generic;
use Api\Middleware\ApiSession;
use Api\Middleware\Relay\PrequalificationMiddleware;

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
            "key" => "sections$",
            "middleware" => [
                PrequalificationMiddleware::loadPrequalificationSections(),
                Generic::set("json",  function ($a) {
                    return json_encode(['data' => $a->get("preq", [])]);
                })
            ]
        ]
    ]
];
