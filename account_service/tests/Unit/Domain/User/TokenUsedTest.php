<?php
declare(strict_types=1);

namespace Tests\Domain\User;

use App\Domain\User\TokenUsed;
use PHPUnit\Framework\TestCase;
use Tests\Support\Fakes\FakeDB;

final class TokenUsedTest extends TestCase
{
    protected function setUp(): void
    {
        parent::setUp();
        FakeDB::reset();
    }

    public function testGetSelectIncludesAliasAndColumns(): void
    {
        $model = new TokenUsed();
        $sql = $model->getSelect();

        self::assertStringContainsString('used.*', $sql);
        self::assertStringContainsString(' token_used used', strtolower($sql));
    }

    public function testApplyFiltersAddsDateClauses(): void
    {
        $model = new TokenUsed();

        $sql = $model->applyFilters(
            'SELECT * FROM token_used',
            [
                'token_type' => 2,
                'start_date' => '2024-03-01',
                'end_date' => '2024-03-31',
            ]
        );

        self::assertStringContainsString("WHERE token_type = '2'", $sql);
        self::assertStringContainsString("CAST(created_at AS Date) >= '2024-03-01'", $sql);
        self::assertStringContainsString("CAST(created_at AS Date) <= '2024-03-31'", $sql);
    }

    public function testFindAllFiltersByUserAndAccount(): void
    {
        FakeDB::queueGetAllResult([
            ['user_id' => 1, 'account_id' => 9],
            ['user_id' => 1, 'account_id' => 8],
            ['user_id' => 2, 'account_id' => 9],
        ]);

        $model = new TokenUsedWithFakeDb();

        $result = $model->findAll(['user_id' => 1, 'account_id' => 9]);

        self::assertSame([['user_id' => 1, 'account_id' => 9]], array_values($result));
        self::assertStringContainsString("user_id = '1'", FakeDB::$lastGetAllQuery ?? '');
        self::assertStringContainsString("account_id = '9'", FakeDB::$lastGetAllQuery ?? '');
    }
}

final class TokenUsedWithFakeDb extends TokenUsed
{
    public function getDB()
    {
        return FakeDB::class;
    }
}
