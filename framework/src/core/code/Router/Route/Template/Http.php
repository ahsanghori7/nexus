<?php

namespace Core\Router\Route\Template;
use Core\Middleware\Generic;
use Core\Router\Route\Template\Base;

class Http extends Base {
    /**
     * @return array
     */
    public static function getTemplate() {
        return [
            "type" => "http",
            "onError" => [
                "tooManyRequests"  => Generic::tooManyRequests(),
                "noEntityFound"    => Generic::exceptionResponse("HTTP/1.0 404"),
                "authError"        => Generic::exceptionResponse("HTTP/1.0 403", "Authentication Error"),
                "serviceError"     => Generic::exceptionResponse("HTTP/1.0 500", "Service Error"),
                "badRequest"       => Generic::exceptionResponse("HTTP/1.0 503", "Bad Request"),
            ],
            "middleware" => [],
            "default_action" => [
                "middleware" => [
                function($a) {
                    //ToDo: Add some more context and info
                    $a->set("message", "No Route Found");
                },
                Generic::set("json",  function ($a) {
                    $a->set("headers", ["HTTP/1.0 404 No Route Found" => ""]);
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
            ]
        ];
    }
}
