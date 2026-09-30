<?php

use App\Infrastructure\Environment;

require __DIR__ . '/vendor/autoload.php';

Environment::loadEnvFile(__DIR__);


$projectServiceConfig = [
    'driver'    => 'mysql',
    'host'      => getenv('DB_HOST'),
    'port'      => '3306',
    'database'  => getenv('DB_NAME'),
    'username'  => getenv('DB_USER'),
    'password'  => getenv('DB_PASSWORD'),
    'charset'   => 'utf8',
    'collation' => 'utf8_unicode_ci'
];

return [
    'paths' => [
        'migrations' => '%%PHINX_CONFIG_DIR%%/db/migrations',
        'seeds' => '%%PHINX_CONFIG_DIR%%/db/seeds',
    ],
    'fixtures' => __DIR__ . '/db/fixtures',
    'environments' => [
        'default_migration_table' => 'phinxlog',
        'default_environment' => 'main',
        'main' => [
            'adapter' => $projectServiceConfig['driver'],
            'host' => $projectServiceConfig['host'],
            'name' => $projectServiceConfig['database'],
            'user' => $projectServiceConfig['username'],
            'pass' => $projectServiceConfig['password'],
            'port' => $projectServiceConfig['port'],
            'charset' => $projectServiceConfig['charset'],
            'collation' => $projectServiceConfig['collation'],
        ],
    ],
    'version_order' => 'creation'
];
