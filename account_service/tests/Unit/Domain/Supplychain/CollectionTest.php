<?php
declare(strict_types=1);

namespace Tests\Domain\Supplychain;

use App\Domain\AbstractModel;
use App\Domain\Account\SupplyChain;
use App\Domain\Supplychain\Collection;
use PHPUnit\Framework\TestCase;

final class CollectionTest extends TestCase
{
    public function testGetDistinctCollectionIdsCachesResult(): void
    {
        $supplyChain = new SupplyChainModelStub();
        $supplyChain->ids = [4, 8];
        $collection = $this->newCollection($supplyChain, new UserMappingModelStub());

        self::assertSame([4, 8], $collection->getDistinctCollectionIds());
        self::assertSame([4, 8], $collection->getDistinctCollectionIds());
        self::assertSame(1, $supplyChain->supplyChainIdsCalls);
    }

    public function testGetCollectionDataMergesAttributesAndUsers(): void
    {
        $supplyChain = new SupplyChainModelStub();
        $supplyChain->accounts = [
            [
                'id' => 20,
                'name' => 'Beta Ltd',
                'attribute_type' => 'trade',
                'attribute_id' => 100,
                'attribute' => 'Roofing',
            ],
            [
                'id' => 20,
                'name' => 'Beta Ltd',
                'attribute_type' => 'region',
                'attribute_id' => 200,
                'attribute' => 'South',
            ],
            [
                'id' => 10,
                'name' => 'Alpha Ltd',
                'attribute_type' => 'trade',
                'attribute_id' => 300,
                'attribute' => 'Plumbing',
            ],
        ];

        $userMapping = new UserMappingModelStub();
        $userMapping->mappings = [
            10 => [['id' => 1]],
            20 => [['id' => 2]],
        ];

        $collection = $this->newCollection($supplyChain, $userMapping);
        $result = $collection->getCollectionData();

        self::assertSame(
            [
                [
                    'id' => 10,
                    'name' => 'Alpha Ltd',
                    'attribute_id' => 300,
                    'trade' => [
                        ['id' => 300, 'label' => 'Plumbing'],
                    ],
                    'users' => [['id' => 1]],
                ],
                [
                    'id' => 20,
                    'name' => 'Beta Ltd',
                    'attribute_id' => 100,
                    'trade' => [
                        ['id' => 100, 'label' => 'Roofing'],
                    ],
                    'region' => [
                        ['id' => 200, 'label' => 'South'],
                    ],
                    'users' => [['id' => 2]],
                ],
            ],
            $result
        );

        self::assertSame([[123, 'supply_chain', [10, 20]]], $userMapping->calls);
    }

    public function testGetCollectionDataReturnsEmptyArrayWhenModelHasNoRows(): void
    {
        $collection = $this->newCollection(new SupplyChainModelStub(), new UserMappingModelStub());

        self::assertSame([], $collection->getCollectionData());
    }

    private function newCollection(SupplyChainModelStub $model, UserMappingModelStub $userMapping): Collection
    {
        $collection = new Collection(123, ['trade'], $userMapping);
        $ref = new \ReflectionProperty(Collection::class, 'model');
        $ref->setAccessible(true);
        $ref->setValue($collection, $model);
        return $collection;
    }
}

final class SupplyChainModelStub extends SupplyChain
{
    public array $ids = [];
    public array $accounts = [];
    public int $supplyChainIdsCalls = 0;
    public array $supplyChainAccountsCalls = [];

    public function getSupplyChainIds(int $aid, array $attributes = [], $limit = 0, $offset = 0, string $term = "", string $orderBy = "company", int $order = 0, ?string $activationStatus = null, ?string $pqqStatus = null)
    {
        $this->supplyChainIdsCalls++;
        return $this->ids;
    }

    public function getSupplyChainAccountsByParentId(int $aid, int $limit = 25, int $offset = 0, array $groupIds = [], array $attributes = [], string $term = "", string $orderBy = "company", int $order = 0 ,?string $activationStatus = null, ?string $pqqStatus = null)
    {
        $this->supplyChainAccountsCalls[] = func_get_args();
        return $this->accounts;
    }
}

final class UserMappingModelStub extends AbstractModel
{
    public array $mappings = [];
    public array $calls = [];

    public function getAccountUserMappings(int $accountId, string $type, array $supplyChainIds): array
    {
        $this->calls[] = [$accountId, $type, $supplyChainIds];
        return $this->mappings;
    }
}
