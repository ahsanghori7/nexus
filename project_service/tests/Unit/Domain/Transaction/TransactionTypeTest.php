<?php

declare(strict_types=1);

namespace Tests\Unit\Domain\Transaction;

use App\Domain\AbstractTypeModel;
use App\Domain\Transaction\TransactionType;
use PHPUnit\Framework\TestCase;
use ReflectionClass;

class TransactionTypeTest extends TestCase
{
    public function testAfterSaveClearsCache(): void
    {
        $type = new TransactionType();
        $reflection = new ReflectionClass(AbstractTypeModel::class);
        $cache = $reflection->getProperty('cache');
        $cache->setAccessible(true);
        $cache->setValue(null, [TransactionType::class => [1 => ['label' => 'Existing']]]);

        $type->afterSave();

        self::assertSame([], $cache->getValue());
    }
}
