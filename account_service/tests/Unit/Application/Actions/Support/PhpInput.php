<?php
declare(strict_types=1);

namespace Tests\Application\Actions\Support;

final class PhpInput
{
    private static string $contents = '';

    public static function set(string $contents): void
    {
        self::$contents = $contents;
    }

    public static function clear(): void
    {
        self::$contents = '';
    }

    public static function get(): string
    {
        return self::$contents;
    }
}
