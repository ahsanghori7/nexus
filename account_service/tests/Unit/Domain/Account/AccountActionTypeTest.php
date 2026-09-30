<?php
declare(strict_types=1);

namespace Tests\Domain\Account;

use App\Domain\Account\AccountActionType;
use App\Infrastructure\Persistence\DB;
use PHPUnit\Framework\TestCase;
use Tests\TestDoubles\FakeRedBean;

final class AccountActionTypeTest extends TestCase
{
    protected function setUp(): void
    {
        FakeRedBean::reset();
        DB::addConnection('r', FakeRedBean::class);
    }

    public function testColumnsDescribeLabelField(): void
    {
        $model = new AccountActionType();

        $columns = $model->getColumns();

        $this->assertArrayHasKey('label', $columns);
        $this->assertSame('string', $columns['label']['type']);
        $this->assertTrue($columns['label']['required']);
    }

    public function testGetActionTypeIdReturnsDatabaseResult(): void
    {
        $model = new AccountActionType();
        $capturedSql = null;
        $capturedParams = null;
        FakeRedBean::$getRowHook = static function (string $sql, array $params) use (&$capturedSql, &$capturedParams) {
            $capturedSql = $sql;
            $capturedParams = $params;
            return ['id' => 42];
        };

        $result = $model->getActionTypeId('Created');

        $this->assertSame(42, $result);
        $this->assertNotNull($capturedSql);
        $this->assertStringContainsString('account_action_type WHERE label = ?', $capturedSql);
        $this->assertSame(['Created'], $capturedParams);
    }

    public function testGetActionTypeIdReturnsNullWhenNoRowFound(): void
    {
        $model = new AccountActionType();
        FakeRedBean::$getRowHook = static fn () => null;

        $this->assertNull($model->getActionTypeId('Missing'));
    }
}
