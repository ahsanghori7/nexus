<?php
declare(strict_types=1);

namespace Tests\Support\Fakes;

/**
 * Lightweight in-memory DB stub that records all SQL calls.
 */
class FakeDB
{
    public static array $getAllResults = [];
    public static array $getRowResults = [];
    public static array $execResults = [];
    public static array $methodCalls = [];
    public static ?string $lastGetAllQuery = null;
    public static ?array $lastGetAllParams = null;
    public static ?array $lastGetRow = null;
    public static ?array $lastExec = null;

    public static function reset(): void
    {
        self::$getAllResults = [];
        self::$getRowResults = [];
        self::$execResults = [];
        self::$methodCalls = [];
        self::$lastGetAllQuery = null;
        self::$lastGetAllParams = null;
        self::$lastGetRow = null;
        self::$lastExec = null;
    }

    public static function queueGetAllResult($result): void
    {
        self::$getAllResults[] = $result;
    }

    public static function queueGetRowResult($result): void
    {
        self::$getRowResults[] = $result;
    }

    public static function queueExecResult($result): void
    {
        self::$execResults[] = $result;
    }

    public static function getAll(string $sql, array $params = []): array
    {
        self::$lastGetAllQuery = $sql;
        self::$lastGetAllParams = $params;
        self::$methodCalls[] = ['getAll', $sql, $params];

        if (self::$getAllResults) {
            return array_shift(self::$getAllResults);
        }

        return [];
    }

    public static function getAssoc(string $sql): array
    {
        return self::getAll($sql);
    }

    public static function getRow(string $sql, array $params = []): array
    {
        self::$lastGetRow = [$sql, $params];
        self::$methodCalls[] = ['getRow', $sql, $params];

        if (self::$getRowResults) {
            return array_shift(self::$getRowResults);
        }

        return [];
    }

    public static function exec(string $sql, array $params = [])
    {
        self::$lastExec = [$sql, $params];
        self::$methodCalls[] = ['exec', $sql, $params];

        if (self::$execResults) {
            return array_shift(self::$execResults);
        }

        return null;
    }
}
