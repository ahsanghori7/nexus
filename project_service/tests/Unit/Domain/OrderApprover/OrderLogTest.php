<?php

declare(strict_types=1);

namespace Tests\Unit\Domain\OrderApprover;

use App\Domain\OrderApprover\OrderLog;
use PHPUnit\Framework\TestCase;

class OrderLogTest extends TestCase
{
    public function testCreatedAtAttributeConvertsToLondonTime(): void
    {
        $log = new OrderLog();

        self::assertSame('2024-07-01 13:00:00', $log->getCreatedAtAttribute('2024-07-01 12:00:00'));
    }

    public function testUpdatedAtAttributeAllowsNull(): void
    {
        $log = new OrderLog();

        self::assertNull($log->getUpdatedAtAttribute(null));
    }
}
