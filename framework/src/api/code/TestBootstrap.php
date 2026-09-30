<?php

namespace Api;

if (!defined("APP")) {
    define("APP", "api");
}

require_once(realpath(__DIR__ . "/../../core/code/TestBootstrap.php"));

use Core\TestBootstrap as CoreTestBootstrap;

class TestBootstrap extends CoreTestBootstrap {}
