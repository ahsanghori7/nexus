<?php

declare(strict_types=1);

namespace Tests\Unit\Domain\Logs;

use App\Domain\Logs\Logs;
use PHPUnit\Framework\TestCase;

class LogsWithScope extends Logs
{
    public static array $scopes = [];

    public static function resetScopes(): void
    {
        self::$scopes = [];
    }

    public static function addGlobalScope($scope, $implementation = null)
    {
        self::$scopes[] = [$scope, $implementation];
    }

    public static function triggerBooted(): void
    {
        static::booted();
    }
}

class LogsTest extends TestCase
{
    public function testBootedRegistersLatestScope(): void
    {
        LogsWithScope::resetScopes();
        LogsWithScope::triggerBooted();

        self::assertNotEmpty(LogsWithScope::$scopes);
        self::assertSame('latest', LogsWithScope::$scopes[0][0]);
        self::assertIsCallable(LogsWithScope::$scopes[0][1]);
    }

    public function testTableAndFillableAreConfigured(): void
    {
        $logs = new Logs();

        self::assertSame('logs', $logs->getTable());
        self::assertContains('type', $logs->getFillable());
    }
}
