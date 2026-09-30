<?php

use App\Infrastructure\Environment;

require __DIR__ . '/../vendor/autoload.php';
require __DIR__ . '/Support/Fakes/FakeModels.php';

// Preload a deterministic environment file for tests to avoid parsing the
// development .env (which contains intentionally invalid lines).
if (!Environment::getValue('CLINK_URL')) {
    $tempEnvPath = tempnam(sys_get_temp_dir(), 'account-service-env');
    // Ensure the temp file always exists even if tempnam returns falsey value.
    if ($tempEnvPath === false) {
        $tempEnvPath = sys_get_temp_dir() . '/account-service-env-' . getmypid();
    }

    $envContents = implode("\n", [
        'CLINK_URL=https://account-service.test',
        'LOGO_MEDIA_HOST=https://cdn.account-service.test',
        'DB_TYPE=mysql',
        'DB_HOST=localhost',
        'DB_NAME=account_service',
        'DB_USER=test_user',
        'DB_PASSWORD=test_pass',
        'API_TOKEN_ENABLED=0',
        'API_TOKEN=0',
    ]);

    file_put_contents($tempEnvPath, $envContents);

    Environment::loadEnvFile(dirname($tempEnvPath), basename($tempEnvPath));

    register_shutdown_function(static function () use ($tempEnvPath): void {
        if (is_file($tempEnvPath)) {
            unlink($tempEnvPath);
        }
    });
}
