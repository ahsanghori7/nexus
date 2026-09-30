<?php

use Core\System\Environment as E;

return [
    "site_url"      => E::get("SUPPLY_CHAIN_SITE_URL"),
    "database" => [
        'driver'    => 'mysql',
        'host'      => E::get("DB_HOST", "0.0.0.0"),
        'database'  => E::get("DATABASE_ACCOUNT_SERVICE_NAME"),
        'username'  => E::get("DATABASE_ACCOUNT_SERVICE_USER"),
        'password'  => E::get("DATABASE_ACCOUNT_SERVICE_PASSWORD"),
        'charset'   => 'utf8',
        'collation' => 'utf8_unicode_ci',
        'prefix'    => '',
    ],
    "signup_email_enabled" => E::get("SIGNUP_EMAIL_ENABLED"),
    "handlers" => [
        "shutdown" => [function () {
        }]
    ],
];
