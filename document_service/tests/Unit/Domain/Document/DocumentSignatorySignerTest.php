<?php

declare(strict_types=1);

namespace Tests\Unit\Domain\Document;

use App\Domain\Document\DocumentSignatorySigner;
use PHPUnit\Framework\TestCase;

class DocumentSignatorySignerTest extends TestCase
{
    public function testModelConfiguration(): void
    {
        $model = new DocumentSignatorySigner();

        self::assertSame('document_signatory_signer', $model->getTable());
        self::assertSame(
            ['id', 'signatory_id', 'signer_user_id', 'signer_status_id', 'signer_updated_at'],
            $model->getFillable()
        );
        self::assertFalse($model->timestamps);

        self::assertSame([
            'id' => ['type' => 'int'],
            'signatory_id' => ['type' => 'int', 'required' => true],
            'signer_user_id' => ['type' => 'int', 'required' => true],
            'signer_status_id' => ['type' => 'int', 'required' => true],
            'signer_updated_at' => ['type' => 'string', 'required' => false],
        ], $model->getColumns());
    }
}
