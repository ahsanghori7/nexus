<?php

declare(strict_types=1);

namespace Tests\Unit\Domain\Document;

use App\Domain\Document\Category;
use App\Domain\Document\CategoryMapping;
use App\Domain\Document\Document;
use Illuminate\Database\Eloquent\Relations\HasOne;
use PHPUnit\Framework\TestCase;

class CategoryMappingTest extends TestCase
{
    public function testModelConfiguration(): void
    {
        $model = new CategoryMapping();

        self::assertSame('document_category_mapping', $model->getTable());
        self::assertSame(['document_id', 'category_id', 'created_at'], $model->getFillable());
        self::assertFalse($model->timestamps);

        self::assertSame([
            'id' => ['type' => 'int'],
            'document_id' => ['type' => 'int', 'required' => true],
            'category_id' => ['type' => 'int', 'required' => true],
            'created_at' => ['type' => 'string', 'required' => false],
        ], $model->getColumns());
    }

    public function testGetColumnNamesHandlesAliasAndBlacklist(): void
    {
        $model = new CategoryMapping();

        self::assertSame(
            ['cm.id', 'cm.document_id', 'cm.category_id', 'cm.created_at'],
            $model->getColumnNames('cm')
        );
        self::assertSame(
            ['document_id', 'created_at'],
            $model->getColumnNames('', ['id', 'category_id'])
        );
    }

    public function testDocumentRelationUsesHasOne(): void
    {
        $model = $this->getMockBuilder(CategoryMapping::class)
            ->onlyMethods(['hasOne'])
            ->getMock();

        $model->expects($this->once())
            ->method('hasOne')
            ->with(Document::class, 'id')
            ->willReturn($this->createMock(HasOne::class));

        self::assertInstanceOf(HasOne::class, $model->document());
    }

    public function testCategoryRelationUsesHasOne(): void
    {
        $model = $this->getMockBuilder(CategoryMapping::class)
            ->onlyMethods(['hasOne'])
            ->getMock();

        $model->expects($this->once())
            ->method('hasOne')
            ->with(Category::class, 'id')
            ->willReturn($this->createMock(HasOne::class));

        self::assertInstanceOf(HasOne::class, $model->category());
    }
}
