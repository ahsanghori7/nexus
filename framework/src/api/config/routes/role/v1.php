<?php

use Core\Config;
use Core\Middleware\Generic;
use Api\Middleware\ApiSession;
use Api\Middleware\RoleMiddleware;

$session_handler = Config::get("session.handler", ApiSession::class);

return [
    "type" => "http",
    "onError" => [
        "invalidToken" => $session_handler::invalidApiToken(),
    ],
    "middleware" => [
        function ($action) use ($session_handler) {
            if ($action->getRoute()->getRequest()->get("method") !== "OPTIONS") {
                $session_handler::validate()($action);
            }
        }
    ],
    "default_action" => [
        "middleware" => [
            function ($a) {
                $a->set("message", "No Role API Route Found");
            },
            Generic::set("json", function ($a) {
                $a->set("headers", ["HTTP/1.0 404 Not Found" => ""]);
                return json_encode(['message' => $a->get("message", ""), "code" => 404]);
            })
        ]
    ],
    "actions" => [
        [
            "key" => "roles-level$",
            "method" => "GET",
            "middleware" => [
                RoleMiddleware::getRoles(),
                Generic::set("json", function ($a) {
                    return json_encode(["data" => [
                        "status" => true,
                        "roles"  => $a->get("rolesData")
                    ]]);
                }),
            ]
        ],

    ],

];
