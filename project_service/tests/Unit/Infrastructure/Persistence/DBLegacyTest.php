<?php

declare(strict_types=1);

namespace Tests\Unit\Infrastructure\Persistence;

use App\Infrastructure\Persistence\DB;
use PHPUnit\Framework\TestCase;

class DBLegacyTest extends TestCase
{
    protected function tearDown(): void
    {
        $property = new \ReflectionProperty(DB::class, 'connections');
        $property->setAccessible(true);
        $property->setValue(null, []);
    }

    public function testAddConnection(): void
    {
        DB::addConnection('test', 'connection');
        self::assertEquals('connection', DB::getConnection('test'));
    }

    public function testGetConnection(): void
    {
        DB::addConnection('test', 'connection');
        DB::addConnection('a', '');
        DB::addConnection('b', 'test');

        self::assertEquals('connection', DB::getConnection('test'));
        self::assertEquals('', DB::getConnection('a'));
        self::assertEquals('test', DB::getConnection('b'));

        $this->expectException(\Exception::class);
        DB::getConnection('testa');
    }
}
