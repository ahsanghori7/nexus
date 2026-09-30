<?php
declare(strict_types=1);

namespace Tests\Domain\Region;

use App\Domain\Region\RegionMapping;
use PHPUnit\Framework\TestCase;
use Tests\Support\Fakes\FakeDB;

final class RegionMappingTest extends TestCase
{
    protected function setUp(): void
    {
        parent::setUp();
        FakeDB::reset();
    }

    public function testGetGroupUsesCustomQuery(): void
    {
        $mapping = new RegionMappingStub();
        $mapping->getAllResult = [['id' => 1]];

        $result = $mapping->getGroup(7, 3);

        self::assertSame([['id' => 1]], $result);
        self::assertCount(1, $mapping->getAllCalls);
        [$sql, $params] = $mapping->getAllCalls[0];
        self::assertStringContainsString('WHERE group_id =? and type_id = ?', $sql);
        self::assertSame([7, 3], $params);
    }

    public function testSaveMappingsBuildsInsertStatements(): void
    {
        $mapping = new RegionMappingStub();
        $mapping->saveMappings(5, 9, [11, 12]);

        self::assertStringContainsString('INSERT INTO region_mapping (`account_id`,`type_id`,`region_id`)', FakeDB::$lastExec[0] ?? '');
        self::assertStringContainsString('(5, 9, 11)', FakeDB::$lastExec[0] ?? '');
        self::assertStringContainsString('(5, 9, 12)', FakeDB::$lastExec[0] ?? '');
    }

    public function testSaveMappingsIncludesGroupIdWhenProvided(): void
    {
        $mapping = new RegionMappingStub();
        $mapping->saveMappings(6, 4, [20], 3);

        self::assertStringContainsString('`group_id`', FakeDB::$lastExec[0] ?? '');
        self::assertStringContainsString('(6, 4, 20, 3)', FakeDB::$lastExec[0] ?? '');
    }

    public function testGetByIdsBatchesQueriesAndAggregates(): void
    {
        FakeDB::queueGetAllResult([
            ['account_id' => 1, 'region_id' => 99],
            ['account_id' => 1, 'region_id' => 100],
        ]);
        FakeDB::queueGetAllResult([
            ['account_id' => 2, 'region_id' => 101],
        ]);

        $mapping = new RegionMappingStub();
        $result = $mapping->getByIds([1, 2], 15, 4, 1);

        self::assertSame(
            [
                1 => [99, 100],
                2 => [101],
            ],
            $result
        );

        $calls = array_filter(FakeDB::$methodCalls, static fn(array $call) => $call[0] === 'getAll');
        self::assertCount(2, $calls);
        self::assertStringContainsString('IN(1)', $calls[0][1]);
        self::assertSame([15, 4], $calls[0][2]);
        self::assertStringContainsString('IN(2)', $calls[1][1]);
        self::assertSame([15, 4], $calls[1][2]);
    }
}

final class RegionMappingStub extends RegionMapping
{
    public array $getAllCalls = [];
    public array $getAllResult = [];

    public function getName(): string
    {
        return 'region_mapping';
    }

    public function getDB()
    {
        return FakeDB::class;
    }

    public function getAll(string $sql, array $params = [])
    {
        $this->getAllCalls[] = [$sql, $params];
        return $this->getAllResult;
    }
}
