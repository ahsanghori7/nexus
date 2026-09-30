<?php


namespace Core\Layer\Cli\Incoming;

use Core\Data\Shape;

class Arguments
{
    /**
     * @param array $options
     * @return Shape
     */
    public static function parse(array $options=[]) : Shape {
        $args = new Shape();
        foreach ($options as $i => $k) {
            if($name = self::getArgName(strval($k))) {
                $args->set($name, self::getValue($options[$i + 1] ?? true));
            }
        }

        return $args;
    }

    /**
     * @param string $key
     * @return string
     */
    public static function getArgName(string $key) : string {
        if(strpos($key, "-") === 0) {
            return substr($key, 1);
        }
        return "";
    }

    /**
     * @param mixed $value
     * @return mixed
     */
    public static function getValue(mixed $value) : mixed
    {
        if(is_string($value)) {
            if(self::getArgName($value)) {
                return true;
            }
        }
        return $value;
    }
}
