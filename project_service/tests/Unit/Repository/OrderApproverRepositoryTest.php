<?php

declare(strict_types=1);

namespace Tests\Unit\Repository;

use App\Domain\OrderApprover\OrderApprover;
use App\Domain\OrderApprover\OrderApproverRepository;
use App\Domain\OrderApprover\OrderApproverStatus;
use App\Domain\OrderApprover\OrderLog;
use PHPUnit\Framework\TestCase;

class OrderApproverRepositoryTest extends TestCase
{
    public function testDefaultModelReturnsOrderApprover(): void
    {
        $repository = new OrderApproverRepository();

        self::assertInstanceOf(OrderApprover::class, $repository->getModel());
        self::assertInstanceOf(OrderApproverStatus::class, $repository->getModel('orderApproverStatus'));
        self::assertInstanceOf(OrderLog::class, $repository->getModel('orderLog'));
    }

    public function testGetModelThrowsWhenUnknown(): void
    {
        $repository = new OrderApproverRepository();

        $this->expectException(\Exception::class);
        $repository->getModel('invalid');
    }
}
