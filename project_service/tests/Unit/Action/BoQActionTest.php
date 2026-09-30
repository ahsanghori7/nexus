<?php

declare(strict_types=1);

namespace Tests\Unit\Action;

use App\Application\Actions\BoQ\BoQAction;
use App\Domain\Project\ProjectRepository;
use PHPUnit\Framework\TestCase;
use Psr\Http\Message\ResponseInterface;
use Psr\Http\Message\ServerRequestInterface;
use Psr\Log\LoggerInterface;
use Slim\Psr7\Factory\ResponseFactory;
use Slim\Psr7\Factory\ServerRequestFactory;
use Tests\TestDoubles\FakeCollection;

class BoQActionTest extends TestCase
{
    private ResponseFactory $responses;

    protected function setUp(): void
    {
        $this->responses = new ResponseFactory();
    }

    public function testListBoQReturnsPayload(): void
    {
        $builder = $this->createBuilder(['whereHas', 'with', 'get']);
        $builder->method('whereHas')->willReturnSelf();
        $builder->method('with')->willReturnSelf();
        $builder->method('get')->willReturn(new FakeCollection([
            ['id' => 1],
        ]));

        $repository = $this->createMock(ProjectRepository::class);
        $repository->expects(self::once())->method('getModel')->with('boqEntity')->willReturn($builder);

        $action = $this->createAction($repository);
        $response = $action->listBoQ($this->createRequest(), $this->createResponse(), ['pid' => 7]);

        self::assertSame(200, $response->getStatusCode());
    }

    public function testListBoQReturnsNotFoundWhenPidMissing(): void
    {
        $action = $this->createAction($this->createMock(ProjectRepository::class));
        $response = $action->listBoQ($this->createRequest(), $this->createResponse(), ['pid' => 0]);

        self::assertSame(404, $response->getStatusCode());
    }

    public function testGetBoqQuoteDocumentsByProjectReturnsTenderTransactionEntityMap(): void
    {
        $repository = $this->createMock(ProjectRepository::class);
        $repository->expects(self::once())
            ->method('getBoqQuoteDocumentsByProject')
            ->with(7)
            ->willReturn([
                10 => [
                    500 => 100,
                ],
                20 => [
                    501 => 200,
                ],
            ]);

        $action = $this->createAction($repository);
        $response = $action->getBoqQuoteDocumentsByProject($this->createRequest(), $this->createResponse(), ['pid' => 7]);

        self::assertSame(200, $response->getStatusCode());
        self::assertSame([
            'data' => [
                10 => [
                    500 => 100,
                ],
                20 => [
                    501 => 200,
                ],
            ],
        ], json_decode((string) $response->getBody(), true));
    }

    public function testGetBoqQuoteDocumentsByProjectRequiresProjectId(): void
    {
        $action = $this->createAction($this->createMock(ProjectRepository::class));
        $response = $action->getBoqQuoteDocumentsByProject($this->createRequest(), $this->createResponse(), ['pid' => 0]);

        self::assertSame(400, $response->getStatusCode());
    }

    public function testGetEntityByIdValidatesInput(): void
    {
        $action = $this->createAction($this->createMock(ProjectRepository::class));
        $response = $action->getEntityById($this->createRequest(), $this->createResponse(), ['eid' => 0]);

        self::assertSame(400, $response->getStatusCode());
    }

    public function testGetEntityByIdReturnsPayload(): void
    {
        $record = new class {
            public function toArray(): array
            {
                return ['id' => 10];
            }
        };

        $builder = $this->createBuilder(['where', 'with', 'exists', 'first']);
        $builder->method('where')->willReturnSelf();
        $builder->method('with')->willReturnSelf();
        $builder->method('exists')->willReturn(true);
        $builder->method('first')->willReturn($record);

        $repository = $this->createMock(ProjectRepository::class);
        $repository->method('getModel')->with('boqEntity')->willReturn($builder);

        $action = $this->createAction($repository);
        $response = $action->getEntityById($this->createRequest(), $this->createResponse(), ['eid' => 10]);

        self::assertSame(200, $response->getStatusCode());
        self::assertStringContainsString('"id": 10', (string) $response->getBody());
    }

    public function testGetEntityByTenderIdReturnsPayload(): void
    {
        $record = new class {
            public function toArray(): array
            {
                return ['id' => 4];
            }
        };

        $builder = $this->createBuilder(['where', 'with', 'exists', 'first']);
        $builder->method('where')->willReturnSelf();
        $builder->method('with')->willReturnSelf();
        $builder->method('exists')->willReturn(true);
        $builder->method('first')->willReturn($record);

        $repository = $this->createMock(ProjectRepository::class);
        $repository->method('getModel')->with('boqEntity')->willReturn($builder);

        $action = $this->createAction($repository);
        $response = $action->getEntityByTenderId($this->createRequest(), $this->createResponse(), ['tid' => 5]);

        self::assertSame(200, $response->getStatusCode());
    }

    public function testGetEntityByTenderIdRequiresId(): void
    {
        $action = $this->createAction($this->createMock(ProjectRepository::class));
        $response = $action->getEntityByTenderId($this->createRequest(), $this->createResponse(), ['tid' => 0]);
        self::assertSame(400, $response->getStatusCode());
    }

    public function testGetResourceByIdRequiresId(): void
    {
        $action = $this->createAction($this->createMock(ProjectRepository::class));
        $response = $action->getResourceById($this->createRequest(), $this->createResponse(), ['id' => 0]);
        self::assertSame(400, $response->getStatusCode());
    }

    public function testGetResourceByIdReturnsPayload(): void
    {
        $record = new class {
            public function toArray(): array
            {
                return ['id' => 5];
            }
        };
        $builder = $this->createBuilder(['where', 'with', 'exists', 'first']);
        $builder->method('where')->willReturnSelf();
        $builder->method('with')->willReturnSelf();
        $builder->method('exists')->willReturn(true);
        $builder->method('first')->willReturn($record);

        $repository = $this->createMock(ProjectRepository::class);
        $repository->method('getModel')->with('boqResourceMapping')->willReturn($builder);

        $action = $this->createAction($repository);
        $response = $action->getResourceById($this->createRequest(), $this->createResponse(), ['id' => 2]);
        self::assertSame(200, $response->getStatusCode());
    }

    public function testGetResourceByIdReturnsEmptyWhenMissing(): void
    {
        $builder = $this->createBuilder(['where', 'with', 'exists']);
        $builder->method('where')->willReturnSelf();
        $builder->method('with')->willReturnSelf();
        $builder->method('exists')->willReturn(false);

        $repository = $this->createMock(ProjectRepository::class);
        $repository->method('getModel')->with('boqResourceMapping')->willReturn($builder);

        $action = $this->createAction($repository);
        $response = $action->getResourceById($this->createRequest(), $this->createResponse(), ['id' => 2]);
        self::assertSame(200, $response->getStatusCode());
        self::assertStringContainsString('[]', (string) $response->getBody());
    }

    public function testGetResourcesByEntityIdReturnsPayload(): void
    {
        $builder = $this->createBuilder(['where', 'with', 'exists', 'get']);
        $builder->method('where')->willReturnSelf();
        $builder->method('with')->willReturnSelf();
        $builder->method('exists')->willReturn(true);
        $builder->method('get')->willReturn(new FakeCollection([['resource' => 1]]));

        $repository = $this->createMock(ProjectRepository::class);
        $repository->method('getModel')->with('boqResourceMapping')->willReturn($builder);

        $action = $this->createAction($repository);
        $response = $action->getResourcesByEntityId($this->createRequest(), $this->createResponse(), ['eid' => 9]);
        self::assertSame(200, $response->getStatusCode());
        self::assertStringContainsString('resource', (string) $response->getBody());
    }

    public function testCreateEntityStoresTrimmedTenderId(): void
    {
        $entityModel = $this->createBuilder(['store']);
        $entityModel->expects(self::once())
            ->method('store')
            ->with(['tender_id' => '5'])
            ->willReturn($this->createStoreResult(12));

        $repository = $this->createMock(ProjectRepository::class);
        $repository->method('getModel')->with('boqEntity')->willReturn($entityModel);

        $action = $this->createAction($repository);
        $response = $action->createEntity($this->createRequest('POST'), $this->createResponse(), ['tid' => ' 5 ']);

        self::assertSame(200, $response->getStatusCode());
        self::assertStringContainsString('12', (string) $response->getBody());
    }

    public function testCreateItemReturnsNotFoundWhenEntityMissing(): void
    {
        $entityModel = $this->createBuilder(['where', 'exists']);
        $entityModel->method('where')->willReturnSelf();
        $entityModel->method('exists')->willReturn(false);

        $repository = $this->createMock(ProjectRepository::class);
        $repository->method('getModel')->with('boqEntity')->willReturn($entityModel);

        $action = $this->createAction($repository);
        $action->setRequestData(['boq_entity_id' => 5]);
        $response = $action->createItem($this->createRequest('POST'), $this->createResponse(), ['eid' => 5]);

        self::assertSame(404, $response->getStatusCode());
    }

    public function testCreateItemCreatesMappingAndVersion(): void
    {
        $entityModel = $this->createBuilder(['where', 'exists']);
        $entityModel->method('where')->willReturnSelf();
        $entityModel->method('exists')->willReturn(true);

        $itemModel = $this->createBuilder(['store']);
        $itemModel->expects(self::once())
            ->method('store')
            ->with(['boq_entity_id' => 2])
            ->willReturn($this->createStoreResult(33));

        $mappingModel = $this->createBuilder(['store']);
        $mappingModel->expects(self::once())
            ->method('store')
            ->with(self::callback(function (array $payload): bool {
                return $payload['boq_item_id'] === 33 && $payload['label'] === 'New';
            }))
            ->willReturn($this->createStoreResult(44));

        $versionModel = $this->createBuilder(['store']);
        $versionModel->expects(self::once())
            ->method('store')
            ->with([
                'boq_item_mapping_id' => 44,
                'version' => 7,
            ])
            ->willReturn($this->createStoreResult(90));

        $repository = $this->createMock(ProjectRepository::class);
        $repository->method('getModel')->willReturnMap([
            ['boqEntity', $entityModel],
            ['boqItem', $itemModel],
            ['boqItemMapping', $mappingModel],
            ['boqItemVersion', $versionModel],
        ]);

        $action = $this->createAction($repository);
        $action->setRequestData([
            'boq_entity_id' => 2,
            'version_id' => 7,
            'label' => 'New',
        ]);

        $response = $action->createItem($this->createRequest('POST'), $this->createResponse(), []);
        self::assertSame(200, $response->getStatusCode());
        self::assertStringContainsString('33', (string) $response->getBody());
    }

    public function testUpdateItemReturnsNotFoundWhenEntityMissing(): void
    {
        $entityModel = $this->createBuilder(['where', 'exists']);
        $entityModel->method('where')->willReturnSelf();
        $entityModel->method('exists')->willReturn(false);

        $repository = $this->createMock(ProjectRepository::class);
        $repository->method('getModel')->with('boqEntity')->willReturn($entityModel);

        $action = $this->createAction($repository);
        $action->setRequestData(['boq_entity_id' => 9]);
        $response = $action->updateItem($this->createRequest('PATCH'), $this->createResponse(), ['id' => 3]);

        self::assertSame(404, $response->getStatusCode());
    }

    public function testUpdateItemUpdatesMappingAndCreatesVersion(): void
    {
        $entityModel = $this->createBuilder(['where', 'exists']);
        $entityModel->method('where')->willReturnSelf();
        $entityModel->method('exists')->willReturn(true);

        $mappingModel = $this->createBuilder(['where', 'exists', 'update']);
        $mappingModel->method('where')->willReturnSelf();
        $mappingModel->method('exists')->willReturn(true);
        $mappingModel->expects(self::once())->method('update')->with(['label' => 'Updated']);

        $versionModel = $this->createBuilder(['store']);
        $versionModel->expects(self::once())
            ->method('store')
            ->with([
                'boq_item_mapping_id' => 11,
                'status' => 2,
                'version' => 4,
            ]);

        $repository = $this->createMock(ProjectRepository::class);
        $repository->method('getModel')->willReturnMap([
            ['boqEntity', $entityModel],
            ['boqItemMapping', $mappingModel],
            ['boqItemVersion', $versionModel],
        ]);

        $action = $this->createAction($repository);
        $action->setRequestData([
            'boq_entity_id' => 8,
            'version' => 4,
            'label' => 'Updated',
        ]);

        $response = $action->updateItem($this->createRequest('PATCH'), $this->createResponse(), ['id' => 11]);
        self::assertSame(203, $response->getStatusCode());
    }

    public function testUpdateItemMappingReturnsNotFoundWhenMissing(): void
    {
        $versionModel = $this->createBuilder(['where', 'exists']);
        $versionModel->method('where')->willReturnSelf();
        $versionModel->method('exists')->willReturn(false);

        $repository = $this->createMock(ProjectRepository::class);
        $repository->method('getModel')->with('boqItemVersion')->willReturn($versionModel);

        $action = $this->createAction($repository);
        $response = $action->updateItemMapping($this->createRequest('PATCH'), $this->createResponse(), ['id' => 7]);
        self::assertSame(404, $response->getStatusCode());
    }

    public function testUpdateItemMappingUpdatesVersion(): void
    {
        $versionModel = $this->createBuilder(['where', 'exists', 'update']);
        $versionModel->method('where')->willReturnSelf();
        $versionModel->method('exists')->willReturn(true);
        $versionModel->expects(self::once())->method('update')->with(['status' => 3]);

        $repository = $this->createMock(ProjectRepository::class);
        $repository->method('getModel')->with('boqItemVersion')->willReturn($versionModel);

        $action = $this->createAction($repository);
        $action->setRequestData(['status' => 3]);
        $response = $action->updateItemMapping($this->createRequest('PATCH'), $this->createResponse(), ['id' => 7]);
        self::assertSame(203, $response->getStatusCode());
    }

    public function testUpdateResourceMapping(): void
    {
        $resourceModel = $this->createBuilder(['where', 'exists', 'update']);
        $resourceModel->method('where')->willReturnSelf();
        $resourceModel->method('exists')->willReturn(true);
        $resourceModel->expects(self::once())->method('update')->with(['status' => 1]);

        $repository = $this->createMock(ProjectRepository::class);
        $repository->method('getModel')->with('boqResourceVersion')->willReturn($resourceModel);

        $action = $this->createAction($repository);
        $action->setRequestData(['status' => 1]);
        $response = $action->updateResourceMapping($this->createRequest('PATCH'), $this->createResponse(), ['id' => 4]);
        self::assertSame(203, $response->getStatusCode());
    }

    public function testUpdateResourceMappingReturnsNotFound(): void
    {
        $resourceModel = $this->createBuilder(['where', 'exists']);
        $resourceModel->method('where')->willReturnSelf();
        $resourceModel->method('exists')->willReturn(false);

        $repository = $this->createMock(ProjectRepository::class);
        $repository->method('getModel')->with('boqResourceVersion')->willReturn($resourceModel);

        $action = $this->createAction($repository);
        $response = $action->updateResourceMapping($this->createRequest('PATCH'), $this->createResponse(), ['id' => 4]);
        self::assertSame(404, $response->getStatusCode());
    }

    public function testCreateResourceBuildsAllRecords(): void
    {
        $entityModel = $this->createBuilder(['where', 'exists']);
        $entityModel->method('where')->willReturnSelf();
        $entityModel->method('exists')->willReturn(true);

        $resourceModel = new StoreModelStub($this->createStoreResult(10));
        $mappingModel = new StoreModelStub($this->createStoreResult(15));
        $versionModel = new StoreModelStub($this->createStoreResult(90));

        $repository = $this->createMock(ProjectRepository::class);
        $repository->method('getModel')->willReturnMap([
            [BoQAction::ENTITY_TABLE, $entityModel],
            ['boqResource', $resourceModel],
            ['boqResourceMapping', $mappingModel],
            ['boqResourceVersion', $versionModel],
        ]);

        $action = $this->createAction($repository);
        $action->setRequestData([
            'boq_id' => 5,
            'type' => 3,
            'text' => 'Note',
            'id_account' => 'acct',
            'status' => 1,
            'version' => 2,
        ]);

        $response = $action->createResource($this->createRequest('POST'), $this->createResponse(), []);
        self::assertSame(200, $response->getStatusCode());
        self::assertStringContainsString('"id": 10', (string) $response->getBody());
        self::assertSame([['text' => 'Note', 'id_account' => 'acct']], $resourceModel->calls);
        self::assertSame([[
            'boq_id' => 5,
            'boq_resource_id' => 10,
            'boq_resource_type_id' => 3,
        ]], $mappingModel->calls);
        self::assertSame([[
            'boq_resource_mapping_id' => 15,
            'version' => 2,
            'status' => 1,
        ]], $versionModel->calls);
    }

    public function testCreateResourceVersionReturnsMappingId(): void
    {
        $resourceModel = new StoreModelStub($this->createStoreResult(11));
        $mappingModel = new StoreModelStub($this->createStoreResult(19));
        $versionModel = new StoreModelStub($this->createStoreResult(25));

        $repository = $this->createMock(ProjectRepository::class);
        $repository->method('getModel')->willReturnMap([
            ['boqResource', $resourceModel],
            ['boqResourceMapping', $mappingModel],
            ['boqResourceVersion', $versionModel],
        ]);

        $action = $this->createAction($repository);
        $action->setRequestData([
            'boq_id' => 5,
            'boq_resource_type_id' => 2,
            'text' => 'Doc',
            'id_account' => 'acct',
            'version' => 3,
            'status' => 2,
        ]);

        $response = $action->createResourceVersion($this->createRequest('POST'), $this->createResponse(), []);
        self::assertSame(200, $response->getStatusCode());
        self::assertStringContainsString('19', (string) $response->getBody());
        self::assertSame([['text' => 'Doc', 'id_account' => 'acct']], $resourceModel->calls);
        self::assertSame([[
            'boq_id' => 5,
            'boq_resource_type_id' => 2,
            'boq_resource_id' => 11,
        ]], $mappingModel->calls);
        self::assertSame([[
            'boq_resource_mapping_id' => 19,
            'version' => 3,
            'status' => 2,
        ]], $versionModel->calls);
    }

    public function testUpdateResourceByIdUpdatesText(): void
    {
        $resourceModel = $this->createBuilder(['where', 'exists', 'update']);
        $resourceModel->method('where')->willReturnSelf();
        $resourceModel->method('exists')->willReturn(true);
        $resourceModel->expects(self::once())->method('update')->with(['text' => 'Updated']);

        $repository = $this->createMock(ProjectRepository::class);
        $repository->method('getModel')->with('boqResource')->willReturn($resourceModel);

        $action = $this->createAction($repository);
        $action->setRequestData(['text' => 'Updated']);
        $response = $action->updateResourceById($this->createRequest('PATCH'), $this->createResponse(), ['id' => 2]);
        self::assertSame(200, $response->getStatusCode());
    }

    public function testListUnitReturnsCollection(): void
    {
        $unitModel = $this->createBuilder(['exists', 'get']);
        $unitModel->method('exists')->willReturn(true);
        $unitModel->method('get')->willReturn(new FakeCollection([['name' => 'Unit']]));

        $repository = $this->createMock(ProjectRepository::class);
        $repository->method('getModel')->with('unit')->willReturn($unitModel);

        $action = $this->createAction($repository);
        $response = $action->listUnit($this->createRequest(), $this->createResponse(), []);
        self::assertSame(200, $response->getStatusCode());
    }

    public function testListUnitReturnsNotFoundWhenEmpty(): void
    {
        $unitModel = $this->createBuilder(['exists']);
        $unitModel->method('exists')->willReturn(false);
        $repository = $this->createMock(ProjectRepository::class);
        $repository->method('getModel')->with('unit')->willReturn($unitModel);

        $action = $this->createAction($repository);
        $response = $action->listUnit($this->createRequest(), $this->createResponse(), []);
        self::assertSame(404, $response->getStatusCode());
    }

    public function testGetTypesReturnsCollection(): void
    {
        $typeModel = $this->createBuilder(['exists', 'get']);
        $typeModel->method('exists')->willReturn(true);
        $typeModel->method('get')->willReturn(new FakeCollection([['label' => 'Note']]));

        $repository = $this->createMock(ProjectRepository::class);
        $repository->method('getModel')->with('boqResourceType')->willReturn($typeModel);

        $action = $this->createAction($repository);
        $response = $action->getTypes($this->createRequest(), $this->createResponse(), []);
        self::assertSame(200, $response->getStatusCode());
    }

    public function testGetTypesReturnsNotFoundWhenEmpty(): void
    {
        $typeModel = $this->createBuilder(['exists']);
        $typeModel->method('exists')->willReturn(false);

        $repository = $this->createMock(ProjectRepository::class);
        $repository->method('getModel')->with('boqResourceType')->willReturn($typeModel);

        $action = $this->createAction($repository);
        $response = $action->getTypes($this->createRequest(), $this->createResponse(), []);
        self::assertSame(404, $response->getStatusCode());
    }

    public function testDeleteItemByIdMarksStatusWhenFound(): void
    {
        $itemModel = $this->createBuilder(['where', 'exists', 'update']);
        $itemModel->method('where')->willReturnSelf();
        $itemModel->method('exists')->willReturn(true);
        $itemModel->expects(self::once())->method('update')->with(['status' => BoQAction::DELETE_STATUS_ID]);

        $repository = $this->createMock(ProjectRepository::class);
        $repository->method('getModel')->with('boqItemVersion')->willReturn($itemModel);

        $action = $this->createAction($repository);
        $response = $action->deleteItemById($this->createRequest('DELETE'), $this->createResponse(), ['id' => 5]);
        self::assertSame(203, $response->getStatusCode());
    }

    public function testDeleteItemByIdReturnsNoContentWhenMissing(): void
    {
        $itemModel = $this->createBuilder(['where', 'exists']);
        $itemModel->method('where')->willReturnSelf();
        $itemModel->method('exists')->willReturn(false);

        $repository = $this->createMock(ProjectRepository::class);
        $repository->method('getModel')->with('boqItemVersion')->willReturn($itemModel);

        $action = $this->createAction($repository);
        $response = $action->deleteItemById($this->createRequest('DELETE'), $this->createResponse(), ['id' => 5]);
        self::assertSame(203, $response->getStatusCode());
    }

    private function createAction(ProjectRepository $repository): TestableBoQAction
    {
        return new TestableBoQAction($this->createMock(LoggerInterface::class), $repository);
    }

    private function createBuilder(array $methods)
    {
        return $this->getMockBuilder(\stdClass::class)->addMethods($methods)->getMock();
    }

    private function createStoreResult(int $id): object
    {
        return new class($id)
        {
            private int $id;

            public function __construct(int $id)
            {
                $this->id = $id;
            }

            public function getId(): int
            {
                return $this->id;
            }
        };
    }

    private function createRequest(string $method = 'GET'): ServerRequestInterface
    {
        return (new ServerRequestFactory())->createServerRequest($method, '/boq');
    }

    private function createResponse(): ResponseInterface
    {
        return $this->responses->createResponse();
    }
}

class TestableBoQAction extends BoQAction
{
    private ?array $requestData = null;

    public function setRequestData(array $data): void
    {
        $this->requestData = $data;
    }

    public function getData($k = null, $default = null)
    {
        if ($this->requestData !== null) {
            if ($k !== null) {
                return $this->requestData[$k] ?? $default;
            }

            return $this->requestData;
        }

        return parent::getData($k, $default);
    }
}

class StoreModelStub
{
    /** @var array<int, array<string, mixed>> */
    public array $calls = [];
    private object $result;

    public function __construct(object $result)
    {
        $this->result = $result;
    }

    public function store(array $data): object
    {
        $this->calls[] = $data;
        return $this->result;
    }
}
