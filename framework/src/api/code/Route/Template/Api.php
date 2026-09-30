<?php

namespace Api\Route\Template;

use Core\Config;
use Core\Middleware\Generic;
use Api\Middleware\ApiSession;
use Core\Router\Route\Template\Http;

class Api extends Http {

    /**
     * Override the Http template to add Api specific errors and middleware and session validation
     * @return array
     */
    public static function getTemplate() {
        $session_handler = Config::get("session.handler", ApiSession::class);
        $template = parent::getTemplate();

        //Errors
        $template["onError"] = array_merge($template["onError"], [
            "invalidToken"  => $session_handler::invalidApiToken(),
            "operationError" => Generic::exceptionResponse("HTTP/1.0 400"),
            "validationError" => Generic::exceptionResponse("HTTP/1.0 422"),
        ]);
        //Middleware
        $template["middleware"] = array_merge($template["middleware"], [
            function($a) use ($session_handler) {
                if($a->getRoute()->getRequest()->get("method") !== "OPTIONS"){
                    $session_handler::validate()($a);
                }
            },
            function($a) {
                $json = $a->getRoute()->getRequest()->getJson();
                if($json) {
                    $a->set("payload", $json);
                }
            }
        ]);

        return $template;
    }
}
