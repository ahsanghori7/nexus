<?php
declare(strict_types=1);

namespace App\Domain\TestDomain;

final class Manage
{
    public static array $invocations = [];

    public static function reset(): void
    {
        self::$invocations = [];
    }

    public static function index(): void
    {
        self::$invocations[] = 'index';
    }

    public static function custom(): void
    {
        self::$invocations[] = 'custom';
    }
}

namespace Tests\Infrastructure\Cli;

use App\Infrastructure\Cli\Handler;
use PHPUnit\Framework\TestCase;

final class HandlerTest extends TestCase
{
    protected function setUp(): void
    {
        \App\Domain\TestDomain\Manage::reset();
    }

    public function testHandleExecutesRequestedCommand(): void
    {
        $handler = new Handler();

        $this->withArgv(['cli.php', 'TestDomain', 'custom'], function () use ($handler) {
            $handler->handle();
        });

        $this->assertSame(['custom'], \App\Domain\TestDomain\Manage::$invocations);
    }

    public function testHandleRequiresDomainArgument(): void
    {
        $handler = new Handler();

        $this->expectException(\Exception::class);
        $this->expectExceptionMessage('Missing argument domain');

        $this->withArgv(['cli.php'], function () use ($handler) {
            $handler->handle();
        });
    }

    public function testHandleThrowsWhenDomainClassMissing(): void
    {
        $handler = new Handler();

        $this->expectException(\Exception::class);
        $this->expectExceptionMessage('Invalid domain');

        $this->withArgv(['cli.php', 'UnknownDomain'], function () use ($handler) {
            $handler->handle();
        });
    }

    public function testHandleThrowsWhenMethodMissing(): void
    {
        $handler = new Handler();

        $this->expectException(\Exception::class);
        $this->expectExceptionMessage('Invalid method');

        $this->withArgv(['cli.php', 'TestDomain', 'missing'], function () use ($handler) {
            $handler->handle();
        });
    }

    /**
     * @param array<int, string> $argvValues
     * @param callable $callback
     */
    private function withArgv(array $argvValues, callable $callback): void
    {
        global $argv;
        $previous = $argv ?? null;
        $argv = $argvValues;

        try {
            $callback();
        } finally {
            if ($previous === null) {
                unset($argv);
            } else {
                $argv = $previous;
            }
        }
    }
}
