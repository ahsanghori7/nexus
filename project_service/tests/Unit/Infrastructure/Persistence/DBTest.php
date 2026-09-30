<?php

declare(strict_types=1);

namespace Tests\Unit\Infrastructure\Persistence;

use App\Infrastructure\Persistence\DB;
use PHPUnit\Framework\TestCase;
use ReflectionProperty;

class DBTest extends TestCase
{
    protected function tearDown(): void
    {
        $property = new ReflectionProperty(DB::class, 'connections');
        $property->setAccessible(true);
        $property->setValue(null, []);
    }

    public function testAddAndFetchConnection(): void
    {
        $conn = new \stdClass();
        DB::addConnection('default', $conn);

        self::assertSame($conn, DB::getConnection('default'));
    }

    public function testMissingConnectionThrowsException(): void
    {
        $this->expectException(\Exception::class);
        DB::getConnection('missing');
    }
}
