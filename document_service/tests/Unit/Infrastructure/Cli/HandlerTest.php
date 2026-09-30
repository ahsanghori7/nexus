<?php

declare(strict_types=1);

namespace Tests\Unit\Infrastructure\Cli;

use App\Infrastructure\Cli\Handler;
use PHPUnit\Framework\TestCase;

class HandlerTest extends TestCase
{
    /** @var array<int, string> */
    private array $originalArgv = [];

    protected function setUp(): void
    {
        global $argv;
        $this->originalArgv = $argv ?? [];
    }

    protected function tearDown(): void
    {
        global $argv;
        $argv = $this->originalArgv;
    }

    public function testHandleThrowsWhenDomainMissing(): void
    {
        $this->expectException(\Exception::class);

        (new Handler())->handle();
    }

    public function testHandleThrowsForInvalidDomain(): void
    {
        global $argv;
        $argv = ['cli.php', 'UnknownDomain'];

        $this->expectExceptionMessage('Invalid domain');

        (new Handler())->handle();
    }

    public function testHandleThrowsForInvalidMethod(): void
    {
        global $argv;
        $argv = ['cli.php', 'MethodDomain', 'missing'];

        $this->expectExceptionMessage('Invalid method');

        (new Handler())->handle();
    }

    public function testHandleExecutesStaticManageMethod(): void
    {
        global $argv;
        $argv = ['cli.php', 'TestDomain', 'custom'];

        (new Handler())->handle();

        self::assertTrue(\App\Domain\TestDomain\Manage::$called);
    }
}

namespace App\Domain\TestDomain;

class Manage
{
    public static bool $called = false;

    public static function custom(): void
    {
        self::$called = true;
    }
}

namespace App\Domain\MethodDomain;

class Manage
{
}
