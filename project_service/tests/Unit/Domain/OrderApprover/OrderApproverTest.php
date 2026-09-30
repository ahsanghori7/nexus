<?php

declare(strict_types=1);

namespace Tests\Unit\Domain\OrderApprover;

use App\Domain\OrderApprover\OrderApprover;
use App\Domain\OrderApprover\OrderApproverStatus;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use PHPUnit\Framework\TestCase;

class OrderApproverTest extends TestCase
{
    protected function setUp(): void
    {
        FakeDb::$queries = [];
        FakeDb::$results = [];
    }

    public function testGetRequiredActionsDataHonoursDateRangeFilter(): void
    {
        FakeDb::$results = [['id' => 1]];
        $approver = new StubOrderApprover();
        $approver->setDbClass(FakeDb::class);

        $result = $approver->getRequiredActionsData(7, [
            'start_date' => '2024-01-01',
            'end_date' => '2024-01-31',
        ]);

        self::assertSame([['id' => 1]], $result);
        self::assertNotEmpty(FakeDb::$queries);
        self::assertStringContainsString("BETWEEN '2024-01-01' AND '2024-01-31'", FakeDb::$queries[0]);
        self::assertStringContainsString('approver_user_id = 7', FakeDb::$queries[0]);
    }

    public function testGetCompletedActionsDataUsesEndDateFallback(): void
    {
        FakeDb::$results = [['id' => 9]];
        $approver = new StubOrderApprover();
        $approver->setDbClass(FakeDb::class);

        $approver->getCompletedActionsData(3, [
            'end_date' => '2024-02-15',
        ]);

        self::assertNotEmpty(FakeDb::$queries);
        self::assertStringContainsString("oa.created_at <= '2024-02-15'", FakeDb::$queries[0]);
        self::assertStringContainsString('requester_user_id = 3', FakeDb::$queries[0]);
    }

    public function testStatusRelationUsesBelongsTo(): void
    {
        $relation = $this->createMock(BelongsTo::class);
        $approver = $this->getMockBuilder(OrderApprover::class)->onlyMethods(['belongsTo'])->getMock();
        $approver->expects(self::once())
            ->method('belongsTo')
            ->willReturnCallback(static function ($related, $foreignKey) use ($relation) {
                self::assertSame(OrderApproverStatus::class, $related);
                self::assertSame('status_id', $foreignKey);
                return $relation;
            });

        self::assertSame($relation, $approver->status());
    }
}

class StubOrderApprover extends OrderApprover
{
    private string $dbClass = FakeDb::class;

    public function setDbClass(string $dbClass): void
    {
        $this->dbClass = $dbClass;
    }

    public function getDB()
    {
        return $this->dbClass;
    }
}

class FakeDb
{
    public static array $queries = [];
    public static array $results = [];

    public static function select(string $sql): array
    {
        self::$queries[] = $sql;
        return self::$results;
    }
}
