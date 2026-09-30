<?php
declare(strict_types=1);

namespace Tests\Infrastructure\Persistence;

use App\Infrastructure\Persistence\DB;
use PHPUnit\Framework\TestCase;

final class DBTest extends TestCase
{
    private array $originalConnections = [];

    protected function setUp(): void
    {
        parent::setUp();
        $this->originalConnections = $this->readStaticProperty('connections');
    }

    protected function tearDown(): void
    {
        $this->writeStaticProperty('connections', $this->originalConnections);
        parent::tearDown();
    }

    public function testAddAndRetrieveConnection(): void
    {
        DB::addConnection('test', new \stdClass());
        $connection = DB::getConnection('test');

        self::assertInstanceOf(\stdClass::class, $connection);
    }

    public function testGetFindAllLimitReturnsDefault(): void
    {
        self::assertSame(100, DB::getFindAllLimit());
    }

    /**
     * @dataProvider whereProvider
     */
    public function testCreateSqlWhereBuildsClauses(string $input, string $expected): void
    {
        $clause = DB::createSqlWhere($input, 'id', 'AND', 'OR');
        self::assertSame($expected, $clause);
    }

    /**
     * @return array<int,array{string,string}>
     */
    public static function whereProvider(): array
    {
        return [
            ['5', ' AND `id` = 5 '],
            ['1,2,3', ' AND ( `id` = 1 OR  `id` = 2 OR  `id` = 3 )'],
        ];
    }

    /**
     * @return mixed
     */
    private function readStaticProperty(string $property)
    {
        $ref = new \ReflectionClass(DB::class);
        $prop = $ref->getProperty($property);
        $prop->setAccessible(true);
        return $prop->getValue();
    }

    private function writeStaticProperty(string $property, $value): void
    {
        $ref = new \ReflectionClass(DB::class);
        $prop = $ref->getProperty($property);
        $prop->setAccessible(true);
        $prop->setValue(null, $value);
    }
}
