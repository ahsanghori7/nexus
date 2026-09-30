<?php

declare(strict_types=1);

namespace Tests\Unit\Domain\Document;

use App\Domain\Document\DocumentRequest;
use PHPUnit\Framework\TestCase;

class DocumentRequestTest extends TestCase
{
    public function testModelConfiguration(): void
    {
        $model = new DocumentRequest();

        self::assertSame('document_request', $model->getTable());
        self::assertSame(
            [
                'id',
                'type',
                'subtype',
                'request_type',
                'label',
                'document_owner',
                'requestor_id',
                'requested_at',
                'request_fullfilled_at',
            ],
            $model->getFillable()
        );
        self::assertFalse($model->timestamps);

        self::assertSame([
            'id' => ['type' => 'int'],
            'type' => ['type' => 'int', 'required' => true],
            'subtype' => ['type' => 'int', 'required' => true],
            'request_type' => ['type' => 'int', 'required' => true],
            'label' => ['type' => 'string', 'required' => true],
            'document_owner' => ['type' => 'id', 'required' => true],
            'requestor_id' => ['type' => 'id', 'required' => true],
            'requested_at' => ['type' => 'string', 'required' => true],
            'request_fullfilled_at' => ['type' => 'string', 'required' => true],
        ], $model->getColumns());
    }
}
