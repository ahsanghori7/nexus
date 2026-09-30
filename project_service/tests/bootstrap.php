<?php

use App\Infrastructure\Environment;

require __DIR__ . '/functions.php';
require __DIR__ . '/../vendor/autoload.php';

if (!class_exists(\Aws\S3\S3Client::class)) {
    require __DIR__ . '/TestDoubles/Aws/S3/S3Client.php';
}

if (!class_exists(\Aws\Result::class)) {
    require __DIR__ . '/TestDoubles/Aws/Result.php';
}

if (getenv('SKIP_ENV_WARNINGS') === '1') {
    Environment::setLogger(static function (): void {
        // swallow invalid .env line warnings during isolated runs
    });
}
