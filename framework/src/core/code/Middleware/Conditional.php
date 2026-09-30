<?php

namespace Core\Middleware;

use Core\Data\Shape;

class Conditional
{
    /**
     * @param string $key
     * @param array<int,callable> $onSuccess
     * @param array<int,callable> $fallback
     * @return callable
     */
    public static function hasKey(string $key, array $onSuccess, array $fallback=[]) : callable {
        return function(Shape $a) use($key, $onSuccess, $fallback) {
            $items = $a->has($key) ? $onSuccess : $fallback;
            foreach($items as $item) {
                if(is_callable($item)){
                    $item($a);
                }
            }
        };
    }

    /**
     * @param mixed $condition
     * @param array $callbacks
     * @param bool $isShape
     * @return callable
     */
    public static function isTrue(mixed $condition, array $callbacks, bool $isShape = false) : callable {
        return function(Shape $a) use($condition, $callbacks, $isShape) {
            $condition = $isShape ? $a->get($condition) : $condition;
            if($condition) {
                foreach($callbacks as $callback) {
                    if(is_callable($callback)){
                        $callback($a);
                    }
                }
            }
        };
    }

    /**
     * @param string $key
     * @param string $condition
     * @param array $callbacks
     * @return callable
     */
    public static function isEqual(string $key, string $condition, array $callbacks) : callable {
        return function(Shape $a) use($key, $condition, $callbacks) {
            if($a->get($key) === $a->get($condition)) {
                foreach($callbacks as $callback) {
                    if(is_callable($callback)){
                        $callback($a);
                    }
                }
            }
        };
    }

    /**
     * @param string $key
     * @param array $onSuccess
     * @param array $fallback
     * @param mixed $condition
     * @return callable
     */
    public static function switched(string $key, array $onSuccess, array $fallback=[], mixed $condition=true) : callable {
        return function(Shape $a) use($key, $onSuccess, $fallback, $condition) {
            $value = $a->get($key, false);
            $items = ($value === $condition) ? $onSuccess : $fallback;
            foreach($items as $item) {
                if(is_callable($item)){
                    $item($a);
                }
            }
        };
    }

    /**
     * @param string $key
     * @param string $saveKey
     * @param mixed $v1
     * @param mixed $v2
     * @param mixed $condition
     * @return callable
     */
    public static function switchedSet(string $key, string $saveKey, mixed $v1, mixed $v2, mixed $condition=true) : callable {
        return function(Shape $a) use($key, $saveKey, $v1, $v2, $condition) {
            $a->set($saveKey,
                ($a->get($key, false) === $condition) ? $v1 : $v2
            );
        };
    }

    /**
     * @param string $key
     * @param callable $callback
     * @param int $count
     * @return callable
     */
    public static function collectionHasCount(string $key, callable $callback, int $count=0) : callable {
        return function(Shape $a) use($key, $callback, $count) {
            $collection = $a->getCollection($key);
            if(count($collection) === $count) {
                $callback($a, $collection);
            }
        };
    }

    /**
     * @param string $key
     * @param $onSuccess
     * @param $onFail
     * @return callable
     */
    public static function isset(string $key, $onSuccess = [], $onFail = []) : callable {
        return function(Shape $a) use($key, $onSuccess, $onFail) {
            $value = $a->get($key);
            $items = !empty($value) ? $onSuccess : $onFail;
            foreach($items as $item){
                if(is_callable($item)) { $item($a, $value); }
            }
        };
    }

    /**
     * @param string $key
     * @param $onSuccess
     * @param $onFail
     * @return callable
     */
    public static function notset(string $key, array $callbacks) : callable {
        return function(Shape $a) use($key, $callbacks) {
            return self::isset($key, [], $callbacks)($a);
        };
    }

    /**
     * @param string $key
     * @param array $allowedValues
     * @param $onSuccess
     * @param $onFail
     * @return callable
     */
    public static function in(string $key, array $allowedValues, $onSuccess = [], $onFail = []) : callable
    {
        return function(Shape $a) use ($key, $allowedValues, $onSuccess, $onFail) {
            $value = $a->get($key);
            $items = in_array($value, $allowedValues) ? $onSuccess : $onFail;

            foreach($items as $item){
                if(is_callable($item)) {
                    $item($a, $value);
                }
            }
        };
    }
}
