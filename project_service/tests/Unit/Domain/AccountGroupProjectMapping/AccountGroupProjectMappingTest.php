<?php

declare(strict_types=1);

namespace Tests\Unit\Domain\AccountGroupProjectMapping;

use App\Domain\AccountGroupProjectMapping\AccountGroupProjectMapping;
use PHPUnit\Framework\TestCase;

class FakeDb
{
    public static array $selectCalls = [];

    public static function reset(): void
    {
        self::$selectCalls = [];
    }

    public static function select(string $sql, array $params = []): array
    {
        self::$selectCalls[] = [$sql, $params];
        return [['id' => 1, 'project_id' => $params[0] ?? null, 'account_group_id' => 10]];
    }
}

class FakeDeleteQuery
{
    public static array $calls = [];

    public static function reset(): void
    {
        self::$calls = [];
    }
}

class AccountGroupProjectMappingTest extends TestCase
{
    protected function setUp(): void
    {
        FakeDb::reset();
        FakeDeleteQuery::reset();
    }

    public function testGetByProjectIdBuildsQueryWithProjectIdAndOrder(): void
    {
        $model = new class extends AccountGroupProjectMapping {
            public function getDb()
            {
                return FakeDb::class;
            }
        };

        $result = $model->getByProjectId(42);

        self::assertSame([['id' => 1, 'project_id' => 42, 'account_group_id' => 10]], $result);
        self::assertCount(1, FakeDb::$selectCalls);
        self::assertStringContainsString('FROM account_group_project_mapping', FakeDb::$selectCalls[0][0]);
        self::assertStringContainsString('WHERE project_id = ?', FakeDb::$selectCalls[0][0]);
        self::assertStringContainsString('ORDER BY created_at DESC', FakeDb::$selectCalls[0][0]);
        self::assertSame([42], FakeDb::$selectCalls[0][1]);
    }

    public function testDeleteByProjectIdUsesWhereClauseAndDeletesMatchingRecords(): void
    {
        $model = new class extends AccountGroupProjectMapping {
            public static function where(string $column, int $value)
            {
                return new class($column, $value) {
                    private string $column;
                    private int $value;

                    public function __construct(string $column, int $value)
                    {
                        $this->column = $column;
                        $this->value = $value;
                    }

                    public function delete(): void
                    {
                        FakeDeleteQuery::$calls[] = [
                            'column' => $this->column,
                            'value' => $this->value,
                        ];
                    }
                };
            }
        };

        $model->deleteByProjectId(7);

        self::assertSame([
            ['column' => 'project_id', 'value' => 7],
        ], FakeDeleteQuery::$calls);
    }
}
