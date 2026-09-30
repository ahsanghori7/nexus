<?php

namespace Core\Router\Route\Template;

abstract class Base {
    public static function getTemplate() {
        return [
            "type" => "base",
            "onError" => [],
            "middleware" => [],
            "default_action" => [],
        ];
    }
}
