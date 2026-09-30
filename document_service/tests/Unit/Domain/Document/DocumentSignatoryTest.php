<?php

declare(strict_types=1);

namespace Tests\Unit\Domain\Document;

use App\Domain\Document\DocumentSignatory;
use App\Domain\Document\DocumentSignatorySigner;
use Illuminate\Database\Eloquent\Relations\HasMany;
use PHPUnit\Framework\TestCase;

class DocumentSignatoryTest extends TestCase
{
    public function testModelConfiguration(): void
    {
        $model = new DocumentSignatory();

        self::assertSame('document_signatory', $model->getTable());
        self::assertSame(['id', 'document_id', 'signatory_id'], $model->getFillable());
        self::assertFalse($model->timestamps);

        self::assertSame([
            'id' => ['type' => 'int'],
            'document_id' => ['type' => 'int', 'required' => true],
            'signatory_id' => ['type' => 'int', 'required' => true],
        ], $model->getColumns());
    }

    public function testSignerRelationUsesHasMany(): void
    {
        $model = $this->getMockBuilder(DocumentSignatory::class)
            ->onlyMethods(['hasMany'])
            ->getMock();

        $model->expects($this->once())
            ->method('hasMany')
            ->with(DocumentSignatorySigner::class, 'signatory_id')
            ->willReturn($this->createMock(HasMany::class));

        self::assertInstanceOf(HasMany::class, $model->signer());
    }
}
