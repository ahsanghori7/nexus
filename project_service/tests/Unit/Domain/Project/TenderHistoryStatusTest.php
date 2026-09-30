<?php

declare(strict_types=1);

namespace Tests\Unit\Domain\Project;

use App\Domain\AbstractTypeModel;
use App\Domain\Project\TenderHistoryStatus;
use PHPUnit\Framework\TestCase;
use ReflectionClass;

class TenderHistoryStatusTest extends TestCase
{
    public function testAfterSaveClearsCachedLabels(): void
    {
        $status = new TenderHistoryStatus();
        $reflection = new ReflectionClass(AbstractTypeModel::class);
        $cache = $reflection->getProperty('cache');
        $cache->setAccessible(true);
        $cache->setValue(null, [TenderHistoryStatus::class => [1 => ['label' => 'Old']]]);

        $status->afterSave();

        self::assertSame([], $cache->getValue());
    }
}
