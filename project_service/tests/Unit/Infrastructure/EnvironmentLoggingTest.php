<?php

declare(strict_types=1);

namespace Tests\Unit\Infrastructure;

use App\Infrastructure\Environment;
use PHPUnit\Framework\TestCase;

class EnvironmentLoggingTest extends TestCase
{
    public function testInvalidLineWritesToErrorLogWhenWarningsNotSuppressed(): void
    {
        $fixture = dirname(__DIR__, 3) . '/.env.test.bad';
        $logFile = tempnam(sys_get_temp_dir(), 'env-log');
        $previousLog = ini_get('error_log');
        $previousLogErrors = ini_get('log_errors');
        $previousLogger = Environment::getLogger();
        $previousSkip = getenv('SKIP_ENV_WARNINGS');

        ini_set('log_errors', '1');
        ini_set('error_log', $logFile);
        Environment::reset();
        Environment::setLogger(null);
        putenv('SKIP_ENV_WARNINGS');

        try {
            Environment::loadEnvFile(dirname($fixture), basename($fixture));
        } finally {
            Environment::setLogger($previousLogger);
            if ($previousLog !== false) {
                ini_set('error_log', (string) $previousLog);
            }
            if ($previousLogErrors !== false) {
                ini_set('log_errors', (string) $previousLogErrors);
            }
            if ($previousSkip === false) {
                putenv('SKIP_ENV_WARNINGS');
            } else {
                putenv('SKIP_ENV_WARNINGS=' . $previousSkip);
            }
        }

        $contents = file_get_contents($logFile) ?: '';
        if (is_file($logFile)) {
            unlink($logFile);
        }

        self::assertStringContainsString('Invalid line in .env file', $contents);
    }
}
