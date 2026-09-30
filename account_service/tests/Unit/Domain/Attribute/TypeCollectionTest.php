<?php
declare(strict_types=1);

namespace Tests\Domain\Attribute;

use App\Domain\Attribute\TypeCollection;
use App\Domain\AbstractModel;
use PHPUnit\Framework\TestCase;

final class TypeCollectionTest extends TestCase
{
    public function testGetCollectionDataReturnsModelData(): void
    {
        $stub = new TypeCollectionModelStub([['id' => 2, 'label' => 'Premium']]);
        $collection = new TypeCollection();
        $this->setCollectionModel($collection, $stub);

        $result = $collection->getCollectionData();

        self::assertSame([['id' => 2, 'label' => 'Premium']], $result);
        self::assertSame([[]], $stub->allCalls);
        self::assertSame($stub, $collection->getModel());
    }

    private function setCollectionModel(TypeCollection $collection, AbstractModel $model): void
    {
        $ref = new \ReflectionClass(TypeCollection::class);
        $prop = $ref->getProperty('model');
        $prop->setAccessible(true);
        $prop->setValue($collection, $model);
    }
}

if (!class_exists(TypeCollectionModelStub::class)) {
    final class TypeCollectionModelStub extends AbstractModel
    {
        public array $allCalls = [];

        /**
         * @param array<int,array<string,mixed>> $result
         */
        public function __construct(private array $result)
        {
        }

        public function all(array $filters = []): array
        {
            $this->allCalls[] = $filters;
            return $this->result;
        }
    }
}
