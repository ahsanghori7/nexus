<?php
declare(strict_types=1);

namespace Tests\Domain\Account;

use App\Domain\Account\AccountAction;
use App\Infrastructure\Persistence\DB;
use PHPUnit\Framework\TestCase;
use Tests\TestDoubles\FakeRedBean;

final class AccountActionTest extends TestCase
{
    protected function setUp(): void
    {
        FakeRedBean::reset();
        DB::addConnection('r', FakeRedBean::class);
    }

    public function testColumnsExposeExpectedMetadata(): void
    {
        $model = new AccountAction();

        $columns = $model->getColumns();

        $this->assertArrayHasKey('account_id', $columns);
        $this->assertSame('int', $columns['account_id']['type']);
        $this->assertArrayHasKey('action_date', $columns);
        $this->assertSame('date', $columns['action_date']['type']);
    }

    public function testFetchAllActionsReturnsDatabaseResults(): void
    {
        $model = new AccountAction();
        $expected = [
            [
                'id' => 1,
                'description' => 'Created',
            ],
        ];
        $capturedSql = null;
        FakeRedBean::$getAllHook = static function (string $sql) use (&$capturedSql, $expected) {
            $capturedSql = $sql;
            return $expected;
        };

        $result = $model->fetchAllActions();

        $this->assertSame($expected, $result);
        $this->assertNotNull($capturedSql);
        $this->assertStringContainsString('FROM account_action aa', $capturedSql);
        $this->assertStringContainsString('LEFT JOIN account_action_type', $capturedSql);
        $this->assertStringContainsString('ORDER BY aa.action_date DESC', $capturedSql);
    }
}
