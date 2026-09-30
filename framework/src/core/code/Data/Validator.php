<?php

namespace Core\Data;

class Validator
{
    /**
     * @param mixed $value
     * @return bool
     */
    public static function isShape(mixed $value) : bool
    {
        return is_object($value) && is_a($value, Shape::class);
    }

    /**
     * @param mixed $value
     * @return bool
     */
    public static function isArrayWithItems(mixed $value) : bool
    {
        return (is_array($value) && count($value) > 0);
    }

    /**
     * @param mixed $value
     * @return bool
     */
    public static function isEmail(mixed $value) : bool {
        return is_string(filter_var($value, FILTER_VALIDATE_EMAIL));
    }
}
