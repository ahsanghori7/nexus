<?php

declare(strict_types=1);

namespace Tests\Unit\Domain\Document;

use App\Domain\Document\DocumentRequestMapping;
use PHPUnit\Framework\TestCase;

class DocumentRequestMappingTest extends TestCase
{
    public function testModelConfiguration(): void
    {
        $model = new DocumentRequestMapping();

        self::assertSame('document_request_mapping', $model->getTable());
        self::assertSame(['request_id', 'document_id'], $model->getFillable());
        self::assertFalse($model->timestamps);

        self::assertSame([
            'request_id' => ['type' => 'int', 'required' => true],
            'document_id' => ['type' => 'int', 'required' => true],
        ], $model->getColumns());
    }
}
