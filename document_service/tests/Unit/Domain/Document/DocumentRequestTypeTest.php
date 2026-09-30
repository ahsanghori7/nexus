<?php

declare(strict_types=1);

namespace Tests\Unit\Domain\Document;

use App\Domain\Document\DocumentRequestType;
use PHPUnit\Framework\TestCase;

class DocumentRequestTypeTest extends TestCase
{
    public function testModelConfiguration(): void
    {
        $model = new DocumentRequestType();

        self::assertSame('request_type', $model->getTable());
        self::assertSame(['id', 'label'], $model->getFillable());
        self::assertFalse($model->timestamps);

        self::assertSame([
            'id' => ['type' => 'int'],
            'label' => ['type' => 'int', 'required' => true],
        ], $model->getColumns());
    }
}
