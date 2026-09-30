<?php

declare(strict_types=1);

namespace Tests\Unit\Domain\Document;

use App\Domain\Document\Category;
use App\Domain\Document\CategoryMapping;
use App\Domain\Document\Document;
use App\Domain\Document\DocumentOwnerMapping;
use App\Domain\Document\DocumentRepository;
use App\Domain\Document\Tender;
use Illuminate\Database\Eloquent\Builder;
use PHPUnit\Framework\MockObject\MockObject;
use PHPUnit\Framework\TestCase;

class DocumentRepositoryTest extends TestCase
{
    public function testConstantsReturnStatusMap(): void
    {
        $repository = new DocumentRepository();

        self::assertSame([
            'status' => [
                1 => 'published',
                2 => 'draft',
            ],
        ], $repository->constants());
    }

    public function testCreateCategoryMappingUsesQueryBuilderCreate(): void
    {
        $payload = ['document_id' => 1, 'category_id' => 2];
        $builder = $this->createBuilderMock();
        $builder->expects($this->once())
            ->method('create')
            ->with($payload);

        $model = $this->createMock(CategoryMapping::class);
        $model->expects($this->once())
            ->method('newQuery')
            ->willReturn($builder);

        $repository = new DocumentRepositoryFake(['categoryMapping' => $model]);

        $repository->createCategoryMapping($payload);
    }

    public function testCreateDocumentOwnerMappingUsesQueryBuilderCreate(): void
    {
        $payload = ['document_id' => 3, 'owner_id' => 5];
        $builder = $this->createBuilderMock();
        $builder->expects($this->once())
            ->method('create')
            ->with($payload);

        $model = $this->createMock(DocumentOwnerMapping::class);
        $model->expects($this->once())
            ->method('newQuery')
            ->willReturn($builder);

        $repository = new DocumentRepositoryFake(['documentOwnerMapping' => $model]);

        $repository->createDocumentOwnerMapping($payload);
    }

    public function testAddDocumentTenderStoresAndReturnsModel(): void
    {
        $payload = ['tender' => 'data'];
        $model = $this->createMock(Tender::class);
        $model->expects($this->once())
            ->method('store')
            ->with($payload);

        $repository = new DocumentRepositoryFake(['tender' => $model]);

        self::assertSame($model, $repository->addDocumentTender($payload));
    }

    public function testAddDocumentCategoryStoresAndReturnsModel(): void
    {
        $payload = ['category' => 'data'];
        $model = $this->createMock(Category::class);
        $model->expects($this->once())
            ->method('store')
            ->with($payload);

        $repository = new DocumentRepositoryFake(['category' => $model]);

        self::assertSame($model, $repository->addDocumentCategory($payload));
    }

    public function testDocumentHasOwnerReturnsFalseWhenOwnerMissing(): void
    {
        $builder = $this->createBuilderMock([['owner' => [['owner_id' => 1], ['owner_id' => 2]]]], true);

        $document = $this->createMock(Document::class);
        $document->method('newQuery')->willReturn($builder);

        $repository = new DocumentRepositoryFake(['document' => $document]);

        self::assertFalse($repository->documentHasOwner(10, 3));
    }

    public function testDocumentHasOwnerReturnsTrueWhenOwnerPresent(): void
    {
        $builder = $this->createBuilderMock([['owner' => [['owner_id' => 4]]]], true);

        $document = $this->createMock(Document::class);
        $document->method('newQuery')->willReturn($builder);

        $repository = new DocumentRepositoryFake(['document' => $document]);

        self::assertTrue($repository->documentHasOwner(5, 4));
    }

    public function testDocumentHasOwnerReturnsTrueWhenNoRecordsExist(): void
    {
        $builder = $this->createBuilderMock([], false);

        $document = $this->createMock(Document::class);
        $document->method('newQuery')->willReturn($builder);

        $repository = new DocumentRepositoryFake(['document' => $document]);

        self::assertTrue($repository->documentHasOwner(7, 1));
    }

    public function testFilterByCategoryFiltersByEntityAndParent(): void
    {
        $data = [
            [
                'categories' => [
                    ['entity_id' => 1, 'parent_id' => 2],
                    ['entity_id' => 3, 'parent_id' => 4],
                ],
            ],
            [
                'categories' => [
                    ['entity_id' => 5, 'parent_id' => 6],
                ],
            ],
        ];

        $builder = $this->createBuilderMock($data);

        $repository = new DocumentRepositoryFake([]);

        $filtered = $repository->filterByCategory($builder, '3', '4');

        self::assertSame([$data[0]], $filtered);
    }

    public function testFilterByCategoryReturnsAllWhenNoFilters(): void
    {
        $data = [
            ['categories' => [['entity_id' => 1, 'parent_id' => 2]]],
        ];
        $builder = $this->createBuilderMock($data);

        $repository = new DocumentRepositoryFake([]);

        self::assertSame($data, $repository->filterByCategory($builder));
    }

    /**
     * @param array<string, mixed>|array<int, array<string, mixed>> $data
     */
    private function createBuilderMock(array $data = [], bool $exists = true): Builder&MockObject
    {
        /** @var Builder&MockObject $builder */
        $builder = $this->getMockBuilder(Builder::class)
            ->disableOriginalConstructor()
            ->onlyMethods(['with', 'where', 'get', 'create'])
            ->addMethods(['exists'])
            ->getMock();

        $builder->method('with')->willReturnSelf();
        $builder->method('where')->willReturnSelf();
        $builder->method('exists')->willReturn($exists);
        $builder->method('get')->willReturn($this->createCollection($data));
        $builder->method('create')->willReturn(null);

        return $builder;
    }

    /**
     * @param array<string, mixed>|array<int, array<string, mixed>> $data
     */
    private function createCollection(array $data): object
    {
        return new class($data) {
            /**
             * @param array<string, mixed>|array<int, array<string, mixed>> $data
             */
            public function __construct(private array $data)
            {
            }

            /**
             * @return array<string, mixed>|array<int, array<string, mixed>>
             */
            public function toArray(): array
            {
                return $this->data;
            }
        };
    }
}

class DocumentRepositoryFake extends DocumentRepository
{
    /** @var array<string, object> */
    protected $models;

    /**
     * @param array<string, object> $models
     */
    public function __construct(array $models)
    {
        $this->models = $models;
    }

    public function getModel(string $name = "")
    {
        if ($name === '') {
            $name = self::DEFAULT_MODEL;
        }

        if (isset($this->models[$name])) {
            return $this->models[$name];
        }

        return parent::getModel($name);
    }
}
