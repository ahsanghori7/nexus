<?php

namespace Core\Middleware;

use Core\Data\Shape;
use Core\Middleware\Exception as MiddlewareException;

class Validator
{

    /**
     * @param string $key
     * @param bool $exceptionOnFalse
     * @return callable
     */
    public static function isEmail(string $key, $exceptionOnFalse=false) : callable {
        return function(Shape $a) use($key, $exceptionOnFalse) {
            $a->set("email_is_valid", filter_var($a->get($key), FILTER_VALIDATE_EMAIL));
            if($exceptionOnFalse && !$a->get("email_is_valid")) {
                throw new MiddlewareException("validation_error", "Email provided is not an email");
            }
        };
    }
}
