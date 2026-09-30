<?php
declare(strict_types=1);

namespace Tests\Application\Actions\Account;

use App\Application\Actions\Account\AttributeV2Action;
use App\Application\Actions\Action;
use App\Domain\AbstractModel;
use App\Infrastructure\Persistence\DB;
use Psr\Log\LoggerInterface;
use Slim\Psr7\Response;
use Tests\TestCase;
use Tests\TestDoubles\FakeRedBean;

final class AttributeV2ActionTest extends TestCase
{
    protected function setUp(): void
    {
        parent::setUp();
        FakeRedBean::reset();
        DB::addConnection('r', FakeRedBean::class);
    }

    public function testGetAttributesReturnsCollectionData(): void
    {
        FakeRedBean::$getAllResults = [
            [
                ['id' => 3, 'label' => 'Facade'],
            ],
        ];

        $action = $this->createAction(new AttributeRepositoryStub());
        $response = $action->getAttributes(
            $this->createRequest('GET', '/v1/attribute')
                ->withQueryParams(['type' => 'trade']),
            new Response(),
            []
        );

        self::assertSame(200, $response->getStatusCode());
        $payload = $this->decode($response);
        self::assertSame([['id' => 3, 'label' => 'Facade']], $payload['data']);
    }

    public function testGetAttributeMappingsUsesRepositoryModel(): void
    {
        $repository = new AttributeRepositoryStub();
        $repository->mappingCollection = [
            2 => ['locations' => [['id' => 8, 'label' => 'North']]],
        ];

        $action = $this->createAction($repository);
        $response = $action->getAttributeMappings(
            $this->createRequest('GET', '/v1/attribute/mapping'),
            new Response(),
            ['parent_id' => '5', 'group_id' => '2', 'attribute_type' => 'locations']
        );

        self::assertSame(200, $response->getStatusCode());
        $payload = $this->decode($response);
        self::assertSame(
            [['locations' => [['id' => 8, 'label' => 'North']]]],
            $payload['data']
        );
    }

    public function testCreateMappingSyncsDifferences(): void
    {
        $repository = new AttributeRepositoryStub();
        $repository->mappingCollection = [
            3 => ['locations' => [['id' => 1], ['id' => 2]]],
        ];

        $action = $this->createAction($repository);
        $this->setActionData($action, ['locations' => [2, 4], 'trades' => [5]]);

        $response = $action->createMapping(
            $this->createRequest('POST', '/v1/attribute/mapping'),
            new Response(),
            ['parent_id' => '6', 'group_id' => '3']
        );

        self::assertSame(203, $response->getStatusCode());
        self::assertSame(
            [
                [
                    'account_id' => 6,
                    'group_id' => 3,
                    'attribute_id' => 4,
                ],
                [
                    'account_id' => 6,
                    'group_id' => 3,
                    'attribute_id' => 5,
                ],
            ],
            $repository->mappingSaves
        );
        self::assertSame(
            [
                [
                    'account_id' => 6,
                    'group_id' => 3,
                    'attribute_id' => 1,
                ],
            ],
            $repository->mappingDeletes
        );
    }

    public function testDeleteMappingRemovesAttribute(): void
    {
        $repository = new AttributeRepositoryStub();

        $action = $this->createAction($repository);
        $response = $action->deleteMapping(
            $this->createRequest('DELETE', '/v1/attribute/6/group/3/attribute/4'),
            new Response(),
            ['parent_id' => '6', 'group_id' => '3', 'id' => '4']
        );

        self::assertSame(203, $response->getStatusCode());
        self::assertSame(
            [
                [
                    'account_id' => 6,
                    'group_id' => 3,
                    'attribute_id' => 4,
                ],
            ],
            $repository->mappingDeletes
        );
    }

    public function testGetAttributesTypeReturnsTypeCollectionData(): void
    {
        FakeRedBean::$getAllResults = [
            [
                ['id' => 1, 'label' => 'Trade'],
                ['id' => 2, 'label' => 'Region'],
                ['id' => 3, 'label' => 'Location'],
            ],
        ];

        $action = $this->createAction(new AttributeRepositoryStub());
        $response = $action->getAttributesType(
            $this->createRequest('GET', '/v1/attribute/types'),
            new Response(),
            []
        );

        self::assertSame(200, $response->getStatusCode());
        $payload = $this->decode($response);
        self::assertSame([
            ['id' => 1, 'label' => 'Trade'],
            ['id' => 2, 'label' => 'Region'],
            ['id' => 3, 'label' => 'Location'],
        ], $payload['data']);
    }

    public function testGetAttributesCategoryReturnsCategoryData(): void
    {
        FakeRedBean::$getAllResults = [
            [
                ['id' => 1, 'label' => 'Primary Category'],
                ['id' => 2, 'label' => 'Secondary Category'],
            ],
        ];

        $action = $this->createAction(new AttributeRepositoryStub());
        $response = $action->getAttributesCategory(
            $this->createRequest('GET', '/v1/attribute/categories'),
            new Response(),
            ['parent_id' => '5']
        );

        self::assertSame(200, $response->getStatusCode());
        $payload = $this->decode($response);
        self::assertSame([
            ['id' => 1, 'label' => 'Primary Category'],
            ['id' => 2, 'label' => 'Secondary Category'],
        ], $payload['data']);
    }



    public function testGetAttributesWithNoQueryParams(): void
    {
        FakeRedBean::$getAllResults = [
            [
                ['id' => 1, 'label' => 'All Attributes'],
            ],
        ];

        $action = $this->createAction(new AttributeRepositoryStub());
        $response = $action->getAttributes(
            $this->createRequest('GET', '/v1/attribute'),
            new Response(),
            []
        );

        self::assertSame(200, $response->getStatusCode());
        $payload = $this->decode($response);
        self::assertSame([['id' => 1, 'label' => 'All Attributes']], $payload['data']);
    }



    private function createAction(AttributeRepositoryStub $repository): AttributeV2ActionUnderTest
    {
        $logger = $this->createMock(LoggerInterface::class);
        return new AttributeV2ActionUnderTest($logger, $repository);
    }

    private function setActionData(AttributeV2Action $action, array $data): void
    {
        $ref = new \ReflectionClass(Action::class);
        $prop = $ref->getProperty('data');
        $prop->setAccessible(true);
        $prop->setValue($action, $data);
    }

    /**
     * @return array<string,mixed>
     */
    private function decode(Response $response): array
    {
        /** @var array<string,mixed> $decoded */
        $decoded = json_decode((string) $response->getBody(), true, 512, JSON_THROW_ON_ERROR);
        return $decoded;
    }
}

final class AttributeV2ActionUnderTest extends AttributeV2Action
{
    public function __construct(LoggerInterface $logger, AttributeRepositoryStub $repository)
    {
        parent::__construct($logger);
        $this->repository = $repository;
    }
}

final class AttributeRepositoryStub
{
    public array $mappingCollection = [];
    public array $mappingSaves = [];
    public array $mappingDeletes = [];
    public array $categoryMappings = [];

    public function getModel(string $name = '')
    {
        return match ($name) {
            'account_attribute_mapping' => new AttributeMappingModelStub($this),
            'category_collection' => new AttributeCategoryModelStub($this),
            default => new class {
                public function __call(string $name, array $arguments)
                {
                    return [];
                }
            },
        };
    }
}

final class AttributeMappingModelStub extends AbstractModel
{
    public function __construct(private AttributeRepositoryStub $repository)
    {
    }

    public function getAccountAttributeMappings(int $accountId, array $groupIds = [], ?string $type = null): array
    {
        $result = [];
        foreach ($groupIds as $groupId) {
            if (!isset($this->repository->mappingCollection[$groupId])) {
                continue;
            }
            $group = $this->repository->mappingCollection[$groupId];
            if ($type !== null) {
                if (isset($group[$type])) {
                    $result[$groupId] = [$type => $group[$type]];
                }
            } else {
                $result[$groupId] = $group;
            }
        }
        return $result;
    }

    public function save(array $data, $insertOnly = false): self
    {
        $this->repository->mappingSaves[] = $data;
        return $this;
    }

    public function deleteWhere(array $data): void
    {
        $this->repository->mappingDeletes[] = $data;
    }

    public function getName(): string
    {
        return 'account_attribute_mapping';
    }

    public function getDb()
    {
        return new class {
        };
    }
}

final class AttributeCategoryModelStub extends AbstractModel
{
    public function __construct(private AttributeRepositoryStub $repository)
    {
    }

    public function getCategoryMappings(array $args, bool $includeAttributes = false): array
    {
        if ($includeAttributes) {
            return ['attributes' => $this->repository->categoryMappings['attributes'] ?? []];
        }
        return $this->repository->categoryMappings;
    }

    public function getName(): string
    {
        return 'category_collection';
    }

    public function getDb()
    {
        return new class {
        };
    }
}
