<?php

declare(strict_types=1);

use App\Application\Handlers\HttpErrorHandler;
use App\Application\Handlers\ShutdownHandler;
use App\Application\ResponseEmitter\ResponseEmitter;
use DI\ContainerBuilder;
use Slim\Factory\AppFactory;
use Slim\Factory\ServerRequestCreatorFactory;
use App\Infrastructure\Cli\Handler as Cli;

require __DIR__ . '/vendor/autoload.php';

//Populate config from envfile
App\Infrastructure\Environment::loadEnvFile(
  realpath(__DIR__)
);
// Instantiate PHP-DI ContainerBuilder
$containerBuilder = new ContainerBuilder();

if ( false ) { // Should be set to true in production
  $containerBuilder->enableCompilation(__DIR__ . '/var/cache');
}

// Set up settings
$settings = require __DIR__ . '/app/settings.php';
$settings($containerBuilder);

// Set up connection
$connection = require __DIR__ . '/app/connections.php';

// Set up dependencies
$dependencies = require __DIR__ . '/app/dependencies.php';
$dependencies($containerBuilder);

// Set up repositories
$repositories = require __DIR__ . '/app/repositories.php';
$repositories($containerBuilder);

// Build PHP-DI Container instance
$container = $containerBuilder->build();

// Instantiate the app
AppFactory::setContainer($container);
$app = AppFactory::create();

const CLI_ROOT = __DIR__;
$cli = new Cli;
$cli->handle();
