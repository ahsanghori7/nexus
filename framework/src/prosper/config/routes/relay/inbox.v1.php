<?php

use Prosper\Middleware\Relay;
use Core\Middleware\Generic;
use Core\Middleware\Session;
use Core\Data\Shape;

return [
    "key" => "^relay$",
    "rules" => [Relay::isResource("inbox")],
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
            "key" => "room$",
            "middleware" => [
                function ($shape) {
                    $shape->set("args", ["token" => $shape->get("session.token")]);
                },
                Relay::passthru("comms", new Shape(["resource" => "rooms"]))
            ]
        ]
    ]
];
