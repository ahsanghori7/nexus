<?php

namespace Core\Middleware\Relay;

use Core\Router\Route\Action;
use Core\Middleware\Exception as MiddlewareException;

class ExceptionHandler
{
    /**
     * @return Callable
     */
    public static function missingArguments() : Callable {
        return function(MiddlewareException $e, Action $shape) {
            $errorJson = json_decode($e->getMessage(), true);
            if($errorJson) {
                $shape->set("json", $e->getMessage());
            }
        };
    }
}
