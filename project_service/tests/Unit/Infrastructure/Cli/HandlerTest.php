<?php

declare(strict_types=1);

namespace Tests\Unit\Infrastructure\Cli;

use App\Infrastructure\Cli\Handler;
use PHPUnit\Framework\TestCase;

class HandlerTest extends TestCase
{
    protected function tearDown(): void
    {
        unset($GLOBALS['argv']);
        \App\Domain\Demo\Manage::$called = false;
    }

    public function testHandleThrowsWhenDomainMissing(): void
    {
        $GLOBALS['argv'] = ['cli.php'];
        $handler = new Handler();

        $this->expectException(\Exception::class);
        $this->expectExceptionMessage('Missing argument domain');
        $handler->handle();
    }

    public function testHandleThrowsWhenDomainClassMissing(): void
    {
        $GLOBALS['argv'] = ['cli.php', 'Missing'];
        $handler = new Handler();

        $this->expectException(\Exception::class);
        $this->expectExceptionMessage('Invalid domain');
        $handler->handle();
    }

    public function testHandleThrowsWhenMethodMissing(): void
    {
        $GLOBALS['argv'] = ['cli.php', 'Demo', 'unknown'];
        $handler = new Handler();

        $this->expectException(\Exception::class);
        $this->expectExceptionMessage('Invalid method');
        $handler->handle();
    }

    public function testHandleInvokesStaticMethod(): void
    {
        $GLOBALS['argv'] = ['cli.php', 'Demo', 'import'];
        $handler = new Handler();

        $handler->handle();

        self::assertTrue(\App\Domain\Demo\Manage::$called);
    }
}

namespace App\Domain\Demo;

class Manage
{
    public static bool $called = false;

    public static function index(): void
    {
    }

    public static function import(): void
    {
        self::$called = true;
    }
}
