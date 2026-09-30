<?php
declare(strict_types=1);

namespace Tests\Domain\Attribute;

use App\Domain\Attribute\CategoryCollection;
use App\Domain\AbstractModel;
use PHPUnit\Framework\TestCase;

final class CategoryCollectionTest extends TestCase
{
    public function testGetCollectionDataUsesModelAll(): void
    {
        $stub = new AttributeModelStub([['id' => 1, 'label' => 'Facade']], ['type' => 'trade']);
        $collection = new CategoryCollection();
        $this->setCollectionModel($collection, $stub);

        $result = $collection->getCollectionData(['type' => 'trade']);

        self::assertSame([['id' => 1, 'label' => 'Facade']], $result);
        self::assertSame([['type' => 'trade']], $stub->allCalls);
        self::assertSame($stub, $collection->getModel());
    }

    private function setCollectionModel(CategoryCollection $collection, AbstractModel $model): void
    {
        $ref = new \ReflectionClass(CategoryCollection::class);
        $prop = $ref->getProperty('model');
        $prop->setAccessible(true);
        $prop->setValue($collection, $model);
    }
}

if (!class_exists(AttributeModelStub::class)) {
    final class AttributeModelStub extends AbstractModel
    {
        public array $allCalls = [];

        /**
         * @param array<int,array<string,mixed>> $result
         */
        public function __construct(private array $result, private array $expectedFilter = [])
        {
        }

        public function all(array $filters = []): array
        {
            $this->allCalls[] = $filters;
            return $this->result;
        }
    }
}
