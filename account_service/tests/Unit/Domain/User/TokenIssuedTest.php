<?php
declare(strict_types=1);

namespace Tests\Domain\User;

use App\Domain\User\TokenIssued;
use PHPUnit\Framework\TestCase;

final class TokenIssuedTest extends TestCase
{
    public function testApplyFiltersAddsDateAndTokenTypeClauses(): void
    {
        $model = new TokenIssued();

        $sql = $model->applyFilters(
            'SELECT * FROM token_issued',
            [
                'account_id' => 7,
                'start_date' => '2024-01-01',
                'end_date' => '2024-01-31',
                'token_type' => 'free',
            ]
        );

        self::assertStringContainsString("WHERE account_id = '7'", $sql);
        self::assertStringContainsString("CAST(timestamp AS Date) >= '2024-01-01'", $sql);
        self::assertStringContainsString("CAST(timestamp AS Date) <= '2024-01-31'", $sql);
        self::assertStringContainsString('cost = 0', $sql);
    }

    public function testApplyFiltersHandlesPaidTokensWithoutBaseFilters(): void
    {
        $model = new TokenIssued();

        $sql = $model->applyFilters('SELECT * FROM token_issued', ['token_type' => 'paid']);

        self::assertStringContainsString('WHERE cost > 0', $sql);
    }
}
