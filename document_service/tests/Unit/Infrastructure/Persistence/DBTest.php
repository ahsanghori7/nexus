<?php

declare(strict_types=1);

namespace Tests\Unit\Infrastructure\Persistence;

use App\Infrastructure\Persistence\DB;
use PHPUnit\Framework\TestCase;

class DBTest extends TestCase
{
    protected function tearDown(): void
    {
        $this->resetConnections();
    }

    public function testAddAndRetrieveConnection(): void
    {
        $connection = new \stdClass();

        DB::addConnection('default', $connection);

        self::assertSame($connection, DB::getConnection('default'));
        self::assertSame(100, DB::getFindAllLimit());
    }

    public function testGetConnectionThrowsWhenMissing(): void
    {
        $this->expectException(\Exception::class);

        DB::getConnection('missing');
    }

    private function resetConnections(): void
    {
        $ref = new \ReflectionClass(DB::class);
        foreach (['connections', 'findAllLimit'] as $property) {
            $prop = $ref->getProperty($property);
            $prop->setAccessible(true);
            $prop->setValue($property === 'connections' ? [] : 100);
        }
    }
}
