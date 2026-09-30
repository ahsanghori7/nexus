<?php

declare(strict_types=1);

namespace Tests\Unit\Domain\Transaction;

use App\Domain\Transaction\TransactionDocument;
use PHPUnit\Framework\TestCase;

class TransactionDocumentTest extends TestCase
{
    public function testCleanDropsNonFillableFields(): void
    {
        $document = new TransactionDocument();
        $input = [
            'transaction_id' => 11,
            'quote_version' => 2,
            'name' => 'quote.pdf',
            's3_key' => 'path',
            'extra' => 'x',
        ];

        self::assertSame([
            'transaction_id' => 11,
            'quote_version' => 2,
            'name' => 'quote.pdf',
            's3_key' => 'path',
        ], $document->clean($input));
    }

    public function testJsonSerializeReturnsAssignedValues(): void
    {
        $document = new TransactionDocument();
        $document->setData(['id' => 9, 'name' => 'quote.pdf']);

        self::assertSame(['id' => 9, 'name' => 'quote.pdf'], $document->jsonSerialize());
    }
}
