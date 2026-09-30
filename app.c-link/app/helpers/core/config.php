<?php


if (! function_exists('setJsConfig')) {
    function setJsConfig($key = null, $value = null){
        return App\core\Config::setJsConfig($key, $value) ?? NULL;
    }
}
