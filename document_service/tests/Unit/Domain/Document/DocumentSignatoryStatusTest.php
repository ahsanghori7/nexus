<?php

declare(strict_types=1);

namespace Tests\Unit\Domain\Document;

use App\Domain\Document\DocumentSignatoryStatus;
use PHPUnit\Framework\TestCase;

class DocumentSignatoryStatusTest extends TestCase
{
    public function testModelConfiguration(): void
    {
        $model = new DocumentSignatoryStatus();

        self::assertSame('document_signatory_status', $model->getTable());
        self::assertSame(['uid', 'label'], $model->getFillable());
        self::assertFalse($model->timestamps);

        self::assertSame([
            'id' => ['type' => 'int'],
            'uid' => ['type' => 'string', 'required' => true],
            'label' => ['type' => 'int', 'required' => true],
        ], $model->getColumns());
    }
}
