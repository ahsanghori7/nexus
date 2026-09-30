<?php
declare(strict_types=1);

namespace Tests\Domain\Threshold;

use App\Domain\Threshold\ApprovalThresholdsUserMapping;
use App\Infrastructure\Persistence\DB;
use PHPUnit\Framework\TestCase;
use Tests\TestDoubles\FakeRedBean;

final class ApprovalThresholdsUserMappingTest extends TestCase
{
    protected function setUp(): void
    {
        FakeRedBean::reset();
        DB::addConnection('r', FakeRedBean::class);
    }

    public function testGetByOrderValueBuildsExpectedQuery(): void
    {
        $model = new ApprovalThresholdsUserMapping();
        $capturedSql = null;
        $expected = [
            ['id' => 7, 'email' => 'approver@example.test'],
        ];
        FakeRedBean::$getAllHook = static function (string $sql) use (&$capturedSql, $expected) {
            $capturedSql = $sql;
            return $expected;
        };

        $result = $model->getByOrderValue(42, 500.0, 10);

        $this->assertSame($expected, $result);
        $this->assertNotNull($capturedSql);
        $this->assertStringContainsString('approval_thresholds at2', $capturedSql);
        $this->assertStringContainsString('JOIN approval_thresholds_user_mapping atum', $capturedSql);
        $this->assertStringContainsString('at2.account_id = 42', $capturedSql);
        $this->assertStringContainsString('u.id <> 10', $capturedSql);
        $this->assertStringContainsString('500', $capturedSql);
    }

    public function testGetUsersRecordsCountCreatesInClause(): void
    {
        $model = new ApprovalThresholdsUserMapping();
        $capturedSql = null;
        FakeRedBean::$getAllHook = static function (string $sql) use (&$capturedSql) {
            $capturedSql = $sql;
            return [
                ['user_id' => 4, 'record_count' => 2],
            ];
        };

        $result = $model->getUsersRecordsCount([4, 5]);

        $this->assertSame([
            ['user_id' => 4, 'record_count' => 2],
        ], $result);
        $this->assertNotNull($capturedSql);
        $this->assertStringContainsString('IN (4,5)', $capturedSql);
        $this->assertStringContainsString('GROUP BY user_id', $capturedSql);
        $this->assertStringContainsString('ORDER BY record_count DESC', $capturedSql);
    }
}
