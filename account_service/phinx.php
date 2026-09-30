<?php
use App\Infrastructure\Environment;

require __DIR__ . '/vendor/autoload.php';

Environment::loadEnvFile(__DIR__);

$accountServiceConfig = [
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
        'seeds' => '%%PHINX_CONFIG_DIR%%/db/seeds'
    ],
    'environments' => [
        'default_migration_table' => 'phinxlog',
        'default_environment' => 'main',
        'main' => [
            'adapter' => $accountServiceConfig['driver'],
            'host' => $accountServiceConfig['host'],
            'name' => $accountServiceConfig['database'],
            'user' => $accountServiceConfig['username'],
            'pass' => $accountServiceConfig['password'],
            'port' => $accountServiceConfig['port'],
            'charset' => $accountServiceConfig['charset'],
            'collation' => $accountServiceConfig['collation'],
        ],
    ],
    'version_order' => 'creation'
];
