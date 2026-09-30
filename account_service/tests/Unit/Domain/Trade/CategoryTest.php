<?php
declare(strict_types=1);

namespace Tests\Domain\Trade;

use App\Domain\Trade\Category;
use PHPUnit\Framework\TestCase;

final class CategoryTest extends TestCase
{
    public function testGetSelectBuildsJoinAcrossMappingTables(): void
    {
        $category = new Category();
        $sql = $category->getSelect();

        self::assertStringContainsString('trade_category_mapping m', $sql);
        self::assertStringContainsString('join trade_category c', strtolower($sql));
        self::assertStringContainsString('join trade t', strtolower($sql));
        self::assertStringContainsString('c.id as cat_id', strtolower($sql));
        self::assertStringContainsString('t.id as trade_id', strtolower($sql));
    }

    public function testApplyLimitLeavesSqlUntouched(): void
    {
        $category = new Category();
        $sql = 'SELECT * FROM trades';

        self::assertSame($sql, $category->applyLimit($sql, 100, 20));
    }
}
