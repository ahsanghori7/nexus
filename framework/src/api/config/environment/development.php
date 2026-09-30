<?php

use Api\Middleware\DevSession;
use Core\System\Environment as E;
use Core\Config as C;
use Core\System\Exception\Formatter;

return [
    "handlers" => [
        "PreHTTPResponseMiddleware" => [
            function($args) {
                $output = $args->get("output");
            }
        ],
        "PreMatchUrl" => [
            function($x){
                //var_dump($x);
            },
        ],
        "RouteException" => [function($shape) {
            $exception = $shape->get("routeException");
            Formatter::output($exception, 'Route Exception');
        }],
        "CriticalSystemException" => [
            function($exception) {
                Formatter::output($exception, 'Critical System Exception');
            }
        ]
    ],
    "session" => [
        "handler" => DevSession::class,
        "dev_token" => E::get("SESSION_DEV_TOKEN"),
        "login" => [
            "auto_login_enabled" => C::get("SESSION_DEV_LOGIN_ENABLED", false),
            "email" => E::get("SESSION_LOGIN_EMAIL"),
            "password" => E::get("SESSION_LOGIN_PASSWORD"),
        ]
    ],
];
