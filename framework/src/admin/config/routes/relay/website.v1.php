<?php

use Admin\Middleware\Relay;
use Core\Data\Shape;
use Core\Middleware\Session;
use Core\Middleware\Generic;


return [
    "key"   => "^relay$",
    "rules" => [Relay::isResource("website")],
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
            "key"    => "website$",
            "middleware" => [
                Relay::passthru("account", new Shape(["resource" => "account/website"]))
            ]
        ]
    ]
];
