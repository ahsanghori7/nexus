<?php

declare(strict_types=1);

namespace Tests\Unit\Repository;

use App\Domain\Transaction\Transaction;
use App\Domain\Transaction\TransactionDocument;
use App\Domain\Transaction\TransactionRepository;
use App\Domain\Transaction\TransactionType;
use PHPUnit\Framework\TestCase;

class TransactionRepositoryTest extends TestCase
{
    public function testDefaultModelReturnsTransaction(): void
    {
        $repository = new TransactionRepository();

        self::assertInstanceOf(Transaction::class, $repository->getModel());
        self::assertInstanceOf(TransactionType::class, $repository->getModel('transactionType'));
        self::assertInstanceOf(TransactionDocument::class, $repository->getModel('transactionDocument'));
    }

    public function testGetModelThrowsForUnknownType(): void
    {
        $repository = new TransactionRepository();

        $this->expectException(\Exception::class);
        $repository->getModel('missing');
    }
}
