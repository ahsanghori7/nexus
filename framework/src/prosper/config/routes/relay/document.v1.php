<?php

use Prosper\Middleware\Relay;
use Core\Middleware\Generic;
use Core\Middleware\Session;
use Api\Middleware\DocumentMiddleware;
use Core\Middleware\Procedure;

//Load the api document procedure
include_once(dirname(__DIR__, 4) . "/api/config/routes/document/procedures.php");

return [
    "key" => "^relay$",
    "rules" => [Relay::isResource("document")],
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
            "key" => "(?<did>[0-9]{1,7})\/download$",
            "middleware" => [
                Session::validate(),
                function ($shape) {
                    $shape->set("account", $shape->get("session.account"));
                    // Capture query parameter for inline display
                    $inline = $shape->getRoute()->getRequest()->getArgs()->get('inline', false);
                    $shape->set("inline_display", filter_var($inline, FILTER_VALIDATE_BOOLEAN));
                },
                Procedure::get("documentCheckOwnership", ['key' => 'id', 'value' => 'uriArgs.did']),
                DocumentMiddleware::downloadDocument(),
                DocumentMiddleware::outputDocument(),
            ]
        ]
    ]
];
