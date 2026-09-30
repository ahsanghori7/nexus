<?php
declare(strict_types=1);

namespace Tests\TestDoubles;

class FakeRedBean
{
    public static array $calls = [];
    public static ?\Closure $xdispenseHook = null;
    public static ?\Closure $loadHook = null;
    public static ?\Closure $storeHook = null;
    public static ?\Closure $getRowHook = null;
    public static ?\Closure $getAllHook = null;
    public static ?\Closure $execHook = null;
    public static ?\Closure $findOneHook = null;
    public static ?\Closure $trashHook = null;
    public static int $defaultStoreReturn = 1;
    public static array $getAllResults = [];

    public static function reset(): void
    {
        self::$calls = [];
        self::$xdispenseHook = null;
        self::$loadHook = null;
        self::$storeHook = null;
        self::$getRowHook = null;
        self::$getAllHook = null;
        self::$execHook = null;
        self::$findOneHook = null;
        self::$trashHook = null;
        self::$defaultStoreReturn = 1;
        self::$getAllResults = [];
    }

    public static function xdispense(string $name)
    {
        self::$calls[] = ['xdispense', $name];
        if (self::$xdispenseHook) {
            return (self::$xdispenseHook)($name);
        }
        return new FakeRedBeanEntity($name);
    }

    public static function load(string $name, $id)
    {
        self::$calls[] = ['load', $name, $id];
        if (self::$loadHook) {
            return (self::$loadHook)($name, $id);
        }
        return new FakeRedBeanEntity($name);
    }

    public static function store($bean)
    {
        self::$calls[] = ['store', clone $bean];
        if (self::$storeHook) {
            return (self::$storeHook)($bean);
        }
        return self::$defaultStoreReturn;
    }

    public static function getRow(string $sql, array $params = [])
    {
        self::$calls[] = ['getRow', $sql, $params];
        if (self::$getRowHook) {
            return (self::$getRowHook)($sql, $params);
        }
        return null;
    }

    public static function getAll(string $sql)
    {
        $args = func_get_args();
        $params = $args[1] ?? [];
        self::$calls[] = ['getAll', $sql, $params];
        if (self::$getAllHook) {
            return (self::$getAllHook)($sql, $params);
        }
        if (self::$getAllResults) {
            return array_shift(self::$getAllResults);
        }
        return [];
    }

    public static function exec(string $sql)
    {
        self::$calls[] = ['exec', $sql];
        if (self::$execHook) {
            return (self::$execHook)($sql);
        }
        return 0;
    }

    public static function findOne(string $name, string $where, array $params)
    {
        self::$calls[] = ['findOne', $name, $where, $params];
        if (self::$findOneHook) {
            return (self::$findOneHook)($name, $where, $params);
        }
        return null;
    }

    public static function trash($bean)
    {
        self::$calls[] = ['trash', $bean];
        if (self::$trashHook) {
            return (self::$trashHook)($bean);
        }
        return null;
    }
}

class FakeRedBeanEntity
{
    public string $type;
    public array $data = [];

    public function __construct(string $type = 'bean')
    {
        $this->type = $type;
    }

    public function __set(string $name, $value): void
    {
        $this->data[$name] = $value;
    }

    public function __get(string $name)
    {
        return $this->data[$name] ?? null;
    }
}
