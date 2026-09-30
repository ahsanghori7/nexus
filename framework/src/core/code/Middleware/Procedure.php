<?php

namespace Core\Middleware;


use Core\Data\Shape;

class Procedure
{

    /**
     * @var string $argKey
     */
    protected static string $argKey = 'procedure_args';

    /**
     * @var array
     */
    protected static array $actions = [];

    /**
     * @param string $key
     * @param array $actions
     * @return void
     * @throws \Exception
     */
    public static function registerActions(string $key, array $actions) {
        if(isset(self::$actions[$key])) {
            throw new \Exception("key $key already exists");
        }
        self::$actions[$key] = $actions;
    }

    /**
     * @param string $key
     * @param array $argKeys
     * @return \Closure
     * @throws \Exception
     */
    public static function get(string $key, array $argKeys = []) {
        $items = self::$actions[$key] ?? [];
        if(!$items) {
            throw new \Exception("No actions found for $key");
        }
        return function($a) use ($items, $argKeys) {
            $a->set(self::$argKey, new Shape($argKeys));
            foreach($items as $item) {
                $item($a);
            }
        };
    }

    /**
     * @param string $key
     * @param $data
     * @return \Closure
     */
    public static function setData(string $key, $data)
    {
        return function($a) use ($key, $data) {
            $a->set(self::$argKey, new Shape([$key, $data]));
        };
    }

    /**
     * @param string $key
     * @return \Closure
     */
    public static function getData(string $key): \Closure
    {
        return function($a) use ($key) {
            return $a->get(sprintf("%s.%s", self::$argKey, $key));
        };
    }
}
