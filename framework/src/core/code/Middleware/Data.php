<?php

namespace Core\Middleware;
use Core\Middleware\Exception;
use Core\Data\Shape;

class Data
{
    /**
     * @param string $key
     * @param array<string, mixed> $values
     * @return Callable
     */
    public static function updateArray(string $key, array $values) : Callable {
        return function(Shape $shape) use ($key, $values) {
            $data = $shape->get($key, []);
            if(!is_array($data)) {
                throw new Exception(
                    "critical",
                    "Sub-optimal operation, trying to update array value when not array"
                );
            }
            foreach($values as $k =>$v) {
                $data[$k] = $v;
            }
            $shape->set($key, $data);
        };
    }

    /**
     * @param string $key
     * @param mixed $value
     * @return Callable
     */
    public static function set(string $key, mixed $value) : Callable
    {
        return function(Shape $shape) use ($key, $value) {
            $shape->set($key, $value);
        };
    }
}
