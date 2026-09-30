<?php

if (!defined("DS")) {
    define("DS", DIRECTORY_SEPARATOR);
}

if (!defined("APPS_BASE")) {
    define("APPS_BASE", realpath(__DIR__));
}

if (!defined("APPS_SRC")) {
    define("APPS_SRC",  realpath(__DIR__ . DS . "src" . DS));
}

if (!defined("REQUEST_MODE")) {
    define("REQUEST_MODE",  (php_sapi_name() === 'cli') ? 'cli' : 'http');
}

/**
 * @return array<mixed,string>
 */
function getApps(): array
{
    $apps = [];
    if ($res = scandir((string)APPS_SRC)) {
        foreach (array_slice($res, 2) as $r) {
            $path = APPS_SRC . DS . $r;
            if (is_dir($path)) {
                $apps[$r] = $path;
            }
        }
    }
    return $apps;
}
