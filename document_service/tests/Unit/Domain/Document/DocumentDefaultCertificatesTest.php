<?php

declare(strict_types=1);

namespace Tests\Unit\Domain\Document;

use App\Domain\Document\DocumentDefaultCertificates;
use App\Domain\Document\DocumentSubType;
use Illuminate\Database\Eloquent\Relations\HasOne;
use PHPUnit\Framework\TestCase;

class DocumentDefaultCertificatesTest extends TestCase
{
    public function testModelConfiguration(): void
    {
        $model = new DocumentDefaultCertificates();

        self::assertSame('document_default_certificates', $model->getTable());
        self::assertSame(['subtype', 'parent_id', 'name'], $model->getFillable());
        self::assertFalse($model->timestamps);

        self::assertSame([
            'id' => ['type' => 'int'],
            'subtype' => ['type' => 'int', 'required' => true],
            'parent_id' => ['type' => 'int', 'required' => true],
            'name' => ['type' => 'string', 'required' => true],
        ], $model->getColumns());
    }

    public function testDocumentSubTypeRelationUsesHasOne(): void
    {
        $model = $this->getMockBuilder(DocumentDefaultCertificates::class)
            ->onlyMethods(['hasOne'])
            ->getMock();

        $model->expects($this->once())
            ->method('hasOne')
            ->with(DocumentSubType::class, 'id', 'subtype')
            ->willReturn($this->createMock(HasOne::class));

        self::assertInstanceOf(HasOne::class, $model->documentSubType());
    }
}
