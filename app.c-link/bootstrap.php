<?php

declare(strict_types=1);

require __DIR__ . '/vendor/autoload.php';

const CLI_ROOT = __DIR__;
define('APP',  CLI_ROOT . "/app/");
define('BASE_DIR', CLI_ROOT);
define('SITE_NAME',  'App C-Link');

try {
    \App\core\Environment::loadEnvFile(CLI_ROOT);
} catch (Exception $e) {
    echo $e->getMessage();
    die;
}

define('SITE_URL', \App\core\Environment::getValue("APP_CLINK_URL", 'http://app.c-link.local'));
define("DASHBOARD_URL", SITE_URL . "/main-contractor");
define('PUBLIC_ROOT', SITE_URL);
define('FILES_PATH',  PUBLIC_ROOT . "/");

define('NAVBAR_ICON', \App\core\Environment::getValue("NAVBAR_ICON", false));
define('COMMS_URL', \App\core\Environment::getValue("COMMS_URL", 'http://app.c-link.local:3000'));
