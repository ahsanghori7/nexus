<?php

namespace Core\Data;

class Rule
{
    /**
     * @param mixed $subject
     * @param mixed $test
     * @return bool
     */
    public static function eqString(mixed $subject, mixed $test) : bool {
        if(is_string($subject) && is_string($test)) {
            return (strcasecmp($subject, $test) === 0);
        }
        return false;
    }
}
