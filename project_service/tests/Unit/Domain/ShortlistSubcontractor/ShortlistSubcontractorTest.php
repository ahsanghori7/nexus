<?php

declare(strict_types=1);

namespace Tests\Unit\Domain\ShortlistSubcontractor;

use App\Domain\ShortlistSubcontractor\ShortlistSubcontractor;
use PHPUnit\Framework\TestCase;

class ShortlistSubcontractorFakeDb
{
    /** @var array<int, array{0: string, 1: array}> */
    public static array $selectCalls = [];

    /** @var array<int, array<string, mixed>> */
    public static array $selectResult = [['id' => 1]];

    public static function reset(): void
    {
        self::$selectCalls = [];
        self::$selectResult = [['id' => 1]];
    }

    public static function select(string $sql, array $params = []): array
    {
        self::$selectCalls[] = [$sql, $params];

        return self::$selectResult;
    }
}

class ShortlistSubcontractorTest extends TestCase
{
    protected function setUp(): void
    {
        ShortlistSubcontractorFakeDb::reset();
    }

    private function model(): ShortlistSubcontractor
    {
        return new class extends ShortlistSubcontractor {
            public function getDb()
            {
                return ShortlistSubcontractorFakeDb::class;
            }
        };
    }

    public function testGetByTenderIdBuildsQueryAndParams(): void
    {
        $result = $this->model()->getByTenderId(7, 15);

        self::assertSame([['id' => 1]], $result);
        self::assertCount(1, ShortlistSubcontractorFakeDb::$selectCalls);
        [$sql, $params] = ShortlistSubcontractorFakeDb::$selectCalls[0];
        self::assertStringContainsString('ss.tender_id = ?', $sql);
        self::assertStringContainsString('1 = 1', $sql);
        self::assertStringContainsString('FROM shortlisted_subcontractor ss', $sql);
        self::assertSame([7, 15], $params);
    }

    public function testGetByTenderIdsReturnsEmptyWhenNoValidIds(): void
    {
        $result = $this->model()->getByTenderIds(7, [0, -1, 'abc']);

        self::assertSame([], $result);
        self::assertSame([], ShortlistSubcontractorFakeDb::$selectCalls);
    }

    public function testGetByTenderIdsBuildsInClauseWithoutApprovedFilter(): void
    {
        $this->model()->getByTenderIds(3, [10, 20, 0]);

        [$sql, $params] = ShortlistSubcontractorFakeDb::$selectCalls[0];
        self::assertStringContainsString('ss.tender_id IN (?,?)', $sql);
        self::assertStringContainsString('1=1', $sql);
        self::assertSame([3, 10, 20], $params);
    }

    public function testGetByTenderIdsAppliesApprovedStatusFilter(): void
    {
        $this->model()->getByTenderIds(3, [10], true);

        [$sql, $params] = ShortlistSubcontractorFakeDb::$selectCalls[0];
        self::assertStringContainsString("ss.status != 'Approved'", $sql);
        self::assertSame([3, 10], $params);
    }

    public function testGetByProjectAndTenderIdsBuildsJoinAndParams(): void
    {
        $result = $this->model()->getByProjectAndTenderIds(9, [4, 4, 8]);

        self::assertSame([['id' => 1]], $result);
        [$sql, $params] = ShortlistSubcontractorFakeDb::$selectCalls[0];
        self::assertStringContainsString("a.entity_type = 'shortlisted_subcontractor'", $sql);
        self::assertStringContainsString('ss.tender_id IN (?,?)', $sql);
        self::assertSame([9, 4, 8], $params);
    }
}
