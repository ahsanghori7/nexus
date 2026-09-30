<?php
declare(strict_types=1);

namespace Tests\Domain\Trade;

use App\Domain\Trade\TradeGroup;
use PHPUnit\Framework\TestCase;

final class TradeGroupTest extends TestCase
{
    public function testGetSelectJoinsTradeTable(): void
    {
        $tradeGroup = new TradeGroup();
        $sql = strtolower($tradeGroup->getSelect());

        self::assertStringContainsString('trade_group tg', $sql);
        self::assertStringContainsString('join trade t on t.id = tg.trade_id', $sql);
        self::assertStringContainsString('tg.id as id', $sql);
        self::assertStringContainsString('tg.type_id as type_id', $sql);
        self::assertStringContainsString('tg.trade_id as trade_id', $sql);
        self::assertStringContainsString('t.label as trade_label', $sql);
    }
}
