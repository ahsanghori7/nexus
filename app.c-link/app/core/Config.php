<?php
namespace App\core;

class Config{

    private static $config = [];
    private static $prefix = [
        'config'   => 'config',
    ];

    public static function get($key){
        return self::_get($key, self::$prefix['config']);
    }

    public static function set($key, $value){
        self::_set($key, $value, self::$prefix['config']);
    }

    public static function getJsConfig(){
        return self::_get("js");
    }

    public static function setJsConfig($key, $value){
        self::_setJS($key, $value);
    }

    public static function loadSource(string $source)
    {
        if (!isset(self::$config[$source])) {

            $config_file = APP . 'config/' . $source . '.php';

            if (!file_exists($config_file)) {
                throw new \Exception("Configuration file " . $source . " doesn't exist");
            }

            self::$config[$source] = require $config_file . "";
            if(!self::$config[$source]){
                throw new \Exception("Empty config file");
            }
        }

        return self::$config[$source];
    }

    private static function _get($key = null, $source = 'config'){

        $data = self::loadSource($source);

        if(empty($key)){
            return $data;
        } else if(isset($data[$key])){
            return $data[$key];
        } else if(strpos($key, ".") !== false){
            $eKey = [];
            foreach(explode(".", $key) as $segment):
                $eKey[] = $segment;
                if(isset($data[$segment])){
                    $data = $data[$segment];
                }else{
                    throw new \Exception("Missing config key ".implode("->", $eKey));
                }
            endforeach;

        }else{
            throw new \Exception("Missing config key ".$key);
        }

        return $data;
    }

    private static function _set($key, $value, $source = 'config'){

        if (!isset(self::$config[$source])) {
            self::_get($key, $source);
        }

        if($key && $source){
            self::$config[$source][$key] = $value;
        }
    }

    private static function _setJS($key, $value, $source = 'config'){

        if (!isset(self::$config[$source])) {
            self::_get($key, $source);
        }

        if($key && $source){
            self::$config[$source]['js'][$key] = $value;
        }
    }
}
