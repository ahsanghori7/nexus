<?php

declare(strict_types=1);

namespace Tests\Unit\Domain\OrderApprover;

use App\Domain\AbstractTypeModel;
use App\Domain\OrderApprover\OrderApproverStatus;
use PHPUnit\Framework\TestCase;
use ReflectionClass;

class OrderApproverStatusTest extends TestCase
{
    protected function tearDown(): void
    {
        $this->clearCache();
    }

    public function testGetLabelAndIdUsesCachedValues(): void
    {
        $this->clearCache();
        $status = $this->getMockBuilder(OrderApproverStatus::class)->onlyMethods(['findAll'])->getMock();
        $status->expects(self::once())->method('findAll')->willReturn([
            ['id' => 2, 'label' => 'Approved'],
        ]);

        self::assertSame('Approved', $status->getLabel(2));
        self::assertSame(2, $status->getLabelId('approved'));

        $status->afterSave();
        $ref = new ReflectionClass(AbstractTypeModel::class);
        $prop = $ref->getProperty('cache');
        $prop->setAccessible(true);

        self::assertSame([], $prop->getValue());
    }

    private function clearCache(): void
    {
        $ref = new ReflectionClass(AbstractTypeModel::class);
        $prop = $ref->getProperty('cache');
        $prop->setAccessible(true);
        $prop->setValue(null, []);
    }
}
