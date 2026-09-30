<?php

namespace Core;
use Core\Data\Shape;


class Config {

    /**
     * @var Shape
     */
    protected static Shape $data;

    /**
     * @param array<string, mixed> $data
     * @return Shape
     */
    public static function update(array $data) : Shape {
        if(!isset(self::$data)) {
            self::$data = new Shape();
        }

        foreach($data as $key => $items) {
            if(!self::$data->has($key)) {
                self::$data->set($key, $items);
            }
            else {
                self::mergeConfig($key, $items);
            }
        }
        return self::$data;
    }

    /**
     * @param string $key
     * @param mixed $data
     * @return void
     */
    public static function mergeConfig(string $key, mixed $data) : void {
        $values = self::$data->get($key);
        if(is_array($values)) {
            if(is_array($data)) {
                $values = array_merge($values, $data);
            }
            else {
                $values[] = $data;
            }
            self::$data->set($key, $values);
        }
        else {
            self::$data->set($key, $data);
        }
    }

    /**
     * @param string|null $k
     * @param mixed|null $default
     * @return mixed
     * @throws \Exception
     */
    public static function get(string $k = null, mixed $default = null) : mixed {
        $data = self::access();
        if($k && !$data->has($k) && is_null($default)) {
            throw new \Exception("Invalid config key $k or null value found");
        }
        return $data->get($k, $default);
    }

    /**
     * @param string $k
     * @return Shape
     * @throws \Exception
     */
    public static function getShape(string $k) : Shape {
        return self::access()->getShape($k);
    }

    /**
     * @param string $k
     * @return array<string, array<Callable>>
     */
    public static function getCallbacks(string $k) : array {
        $items     = self::get($k);
        if(is_null($items)) {
            return [];
        }
        if(!is_array($items)) {
            throw new \Exception("Config $k must be an array");
        }

        foreach($items as $k => $callbacks) {
            if(!is_string($k)) {
                throw new \Exception("Config $k must be an associative array");
            }
            if(!is_array($callbacks)) {
                throw new \Exception("Config $k must be an associative array");
            }
            foreach($callbacks as $callback) {
                if(!is_callable($callback)) {
                    throw new \Exception("Config $k must be an associative array of callables");
                }
            }
        }
        return $items;
    }

    /**
     * @param string $k
     * @return array<mixed>
     * @throws \Exception
     */
    public static function getArray(string $k) : array {
        $data = self::get($k);
        if(!is_array($data)) {
            throw new \Exception("Invalid data type for $k, array expected");
        }
        return $data;
    }

    /**
     * @return Shape
     */
    public static function access() : Shape {
        if(!isset(self::$data)) {
            self::$data = new Shape();
        }
        return self::$data;
    }

    /**
     * @param string $k
     * @param string $prefix
     * @return string
     */
    public static function getUrl(string $k, string $prefix = "") : string {
        $v = self::get($k, "");
        return rtrim(strval($v), "/") . "/" . ltrim($prefix, "/");
    }

    /**
     * @param string $key
     * @return void
     * @throws \Exception
     */
    public static function dump(string $key) {
        var_dump(self::get($key));
    }
}
