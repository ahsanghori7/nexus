<?php
declare(strict_types=1);

namespace Tests\Application\Actions\Account;

require_once __DIR__ . '/SupplyChainActionDoubles.php';

use App\Application\Actions\Account\SupplyChainAction;
use App\Application\Actions\Action;
use Psr\Log\LoggerInterface;
use Slim\Psr7\Response;
use Tests\TestCase;

/**
 * @runTestsInSeparateProcesses
 * @preserveGlobalState disabled
 */
final class SupplyChainActionTest extends TestCase
{
    private static bool $doublesRegistered = false;

    protected function setUp(): void
    {
        parent::setUp();
        if (!self::$doublesRegistered) {
            SupplyChainActionDoubleRegistrar::register();
            self::$doublesRegistered = true;
        }
        SupplyChainCollectionStub::reset();
        SupplyChainDbStub::$repository = null;
        CategoryRepositoryDouble::reset();
        TradeRepositoryDouble::reset();
        RegionRepositoryDouble::reset();
    }

    public function testSubContractorDataReturnsTradesAndRegions(): void
    {
        $repository = new SupplyChainRepositoryStub();
        $repository->accountEntities[5] = ['id' => 5];
        $repository->supplyChainFindAllResult = [
            ['trade_id' => 11],
            ['trade_id' => 17],
        ];
        $repository->offeringRegionMappings = [
            ['region_id' => 4],
            ['region_id' => 9],
        ];

        $action = $this->createAction($repository);
        $response = $action->subContractorData(
            $this->createRequest('GET', '/v1/account/5/sub/9'),
            new Response(),
            ['id' => '5', 'sid' => '9']
        );

        self::assertSame(200, $response->getStatusCode());
        $payload = json_decode((string) $response->getBody(), true, 512, JSON_THROW_ON_ERROR);
        self::assertSame(
            [
                'exist' => true,
                'trades' => [11, 17],
                'regions' => [4, 9],
            ],
            $payload['data']
        );
    }

    public function testGetAllSupplyChainReturnsDbResults(): void
    {
        $repository = new SupplyChainRepositoryStub();
        $repository->supplyChainDbResults = [
            ['id' => 1],
            ['id' => 2],
        ];

        $action = $this->createAction($repository);
        $response = $action->getAllSupplyChain(
            $this->createRequest('GET', '/v1/account/supplychain'),
            new Response(),
            []
        );

        self::assertSame(200, $response->getStatusCode());
        $payload = json_decode((string) $response->getBody(), true, 512, JSON_THROW_ON_ERROR);
        self::assertSame($repository->supplyChainDbResults, $payload['data']);
    }

    public function testSubContractorDataReturnsEmptyWhenAccountMissing(): void
    {
        $repository = new SupplyChainRepositoryStub();
        $repository->entityExists = false;

        $action = $this->createAction($repository);
        $response = $action->subContractorData(
            $this->createRequest('GET', '/v1/account/1/sub/2'),
            new Response(),
            ['id' => '1', 'sid' => '2']
        );

        self::assertSame(200, $response->getStatusCode());
        $payload = json_decode((string) $response->getBody(), true, 512, JSON_THROW_ON_ERROR);
        self::assertSame(
            [
                'exist' => false,
                'trades' => [],
                'regions' => [],
            ],
            $payload['data']
        );
    }

    public function testGetAllReturnsNotFoundWhenAccountMissing(): void
    {
        $repository = new SupplyChainRepositoryStub();
        $repository->entityExists = false;

        $action = $this->createAction($repository);
        $response = $action->getAll(
            $this->createRequest('GET', '/v1/account/7/supplychain'),
            new Response(),
            ['id' => '7']
        );

        self::assertSame(404, $response->getStatusCode());
    }

    public function testGetAllPopulatesChainsWhenNotFiltering(): void
    {
        $repository = new SupplyChainRepositoryStub();
        $repository->accountEntities[5] = ['id' => 5];
        CategoryRepositoryDouble::$categories = [
            2 => [
                'label' => 'Structure',
                'icon' => 'structure.svg',
                'trades' => [
                    11 => 'Steel',
                    12 => 'Concrete',
                ],
            ],
        ];
        $repository->chainsByTrade = [
            11 => [
                ['id' => 90, 'company' => 'Acme Steel'],
            ],
        ];

        $action = $this->createAction($repository);
        $request = $this->createRequest('GET', '/v1/account/5/supplychain');

        $response = $action->getAll(
            $request,
            new Response(),
            ['id' => '5']
        );

        self::assertSame(200, $response->getStatusCode());
        $payload = json_decode((string) $response->getBody(), true, 512, JSON_THROW_ON_ERROR);
        self::assertSame('Acme Steel', $payload['data'][2][11]['chain'][0]['company']);
        self::assertArrayHasKey(12, $payload['data'][2]);
        self::assertSame(
            [
                [
                    'account_id' => 5,
                    'trade_filter' => [],
                    'region_repository' => RegionRepositoryDouble::class,
                ],
            ],
            $repository->mapRegionsInvocations
        );
    }

    public function testGetAllFiltersEmptyTradesAndCategoriesWhenRequested(): void
    {
        $repository = new SupplyChainRepositoryStub();
        $repository->accountEntities[9] = ['id' => 9];
        CategoryRepositoryDouble::$categories = [
            1 => [
                'label' => 'Structure',
                'icon' => 'structure',
                'trades' => [
                    11 => 'Steel',
                    12 => 'Concrete',
                ],
            ],
            3 => [
                'label' => 'Finishes',
                'icon' => 'finishes',
                'trades' => [
                    20 => 'Painting',
                ],
            ],
        ];
        $repository->chainsByTrade = [
            11 => [
                ['id' => 77, 'company' => 'Steel LLC'],
            ],
        ];

        $action = $this->createAction($repository);
        $request = $this->createRequest('GET', '/v1/account/9/supplychain')
            ->withQueryParams(['filter_empty' => '1']);

        $response = $action->getAll(
            $request,
            new Response(),
            ['id' => '9']
        );

        self::assertSame(200, $response->getStatusCode());
        $payload = json_decode((string) $response->getBody(), true, 512, JSON_THROW_ON_ERROR);
        self::assertArrayHasKey(11, $payload['data'][1]);
        self::assertArrayNotHasKey(12, $payload['data'][1]);
        self::assertArrayNotHasKey(3, $payload['data']);
    }

    public function testGetSupplyChainByAccountIdReturnsData(): void
    {
        $repository = new SupplyChainRepositoryStub();
        $repository->accountEntities[3] = ['id' => 3];
        $repository->supplyChainByAccount = [
            ['id' => 4, 'trade' => 'Steel'],
        ];

        $action = $this->createAction($repository);
        $response = $action->getSupplyChainByAccountId(
            $this->createRequest('GET', '/v1/account/3/supplychain'),
            new Response(),
            ['id' => '3']
        );

        self::assertSame(200, $response->getStatusCode());
        $payload = json_decode((string) $response->getBody(), true, 512, JSON_THROW_ON_ERROR);
        self::assertSame($repository->supplyChainByAccount, $payload['data']);
    }

    public function testGetSupplyChainByAccountIdReturnsNotFoundWhenAccountMissing(): void
    {
        $repository = new SupplyChainRepositoryStub();
        $repository->entityExists = false;

        $action = $this->createAction($repository);
        $response = $action->getSupplyChainByAccountId(
            $this->createRequest('GET', '/v1/account/3/supplychain'),
            new Response(),
            ['id' => '3']
        );

        self::assertSame(404, $response->getStatusCode());
    }

    public function testGetAllSupplyChainReturnsEmptyWhenDriverDoesNotExposeGetAll(): void
    {
        $repository = new SupplyChainRepositoryStub();
        $repository->dbSupportsGetAll = false;
        $repository->supplyChainDbResults = [
            ['id' => 10],
        ];

        $action = $this->createAction($repository);
        $response = $action->getAllSupplyChain(
            $this->createRequest('GET', '/v1/account/supplychain'),
            new Response(),
            []
        );

        self::assertSame(200, $response->getStatusCode());
        $payload = json_decode((string) $response->getBody(), true, 512, JSON_THROW_ON_ERROR);
        self::assertSame([], $payload['data']);
    }

    public function testMapTradesRequiresTradesPayload(): void
    {
        $repository = new SupplyChainRepositoryStub();
        $repository->accountEntities[4] = ['id' => 4];
        $repository->accountEntities[8] = ['id' => 8];

        $action = $this->createAction($repository);
        $this->setActionData($action, []);

        $response = $action->mapTrades(
            $this->createRequest('PATCH', '/v1/account/4/supplychain/8/trades'),
            new Response(),
            ['id' => '4', 'child' => '8']
        );

        self::assertSame(400, $response->getStatusCode());
    }

    public function testMapTradesReturnsErrorWhenInvalidTradeIds(): void
    {
        $repository = new SupplyChainRepositoryStub();
        $repository->mapTradesFailures = [12, 13];
        $repository->accountEntities[4] = ['id' => 4];
        $repository->accountEntities[8] = ['id' => 8];

        $action = $this->createAction($repository);
        $this->setActionData($action, ['trades' => [12, 13]]);

        $response = $action->mapTrades(
            $this->createRequest('PATCH', '/v1/account/4/supplychain/8/trades'),
            new Response(),
            ['id' => '4', 'child' => '8']
        );

        self::assertSame(500, $response->getStatusCode());
        $payload = json_decode((string) $response->getBody(), true, 512, JSON_THROW_ON_ERROR);
        self::assertSame('Invalid Trade Ids (12,13)', $payload['data']['error']['message']);
        self::assertSame([
            [4, 8, [12, 13]],
        ], $repository->mapTradesCalls);
    }

    public function testMapTradesCleansExistingMappingsWhenNotAddOnly(): void
    {
        $repository = new SupplyChainRepositoryStub();
        $repository->accountEntities[4] = ['id' => 4];
        $repository->accountEntities[8] = ['id' => 8];

        $action = $this->createAction($repository);
        $this->setActionData($action, ['trades' => [5, 6]]);

        $response = $action->mapTrades(
            $this->createRequest('PATCH', '/v1/account/4/supplychain/8/trades'),
            new Response(),
            ['id' => '4', 'child' => '8']
        );

        self::assertSame(203, $response->getStatusCode());
        self::assertSame([[4, 8]], $repository->cleanCalls);
        self::assertSame([[4, 8, [5, 6]]], $repository->mapTradesCalls);
    }

    public function testAddSubReturnsBadRequestWhenPayloadMissing(): void
    {
        $repository = new SupplyChainRepositoryStub();
        $repository->accountEntities[1] = ['id' => 1];

        $action = $this->createAction($repository);
        $this->setActionData($action, null);

        $response = $action->addSub(
            $this->createRequest('POST', '/v1/account/1/supplychain'),
            new Response(),
            ['id' => '1']
        );

        self::assertSame(404, $response->getStatusCode());
        self::assertSame(1, $action->badRequestCount);
        self::assertSame(400, $action->lastBadRequestResponse?->getStatusCode());
    }

    public function testAddSubReturnsNotFoundWhenChildOrTradeMissing(): void
    {
        $repository = new SupplyChainRepositoryStub();
        $repository->accountEntities[1] = ['id' => 1];

        $action = $this->createAction($repository);
        $this->setActionData($action, ['child' => 2, 'trade' => 5]);

        $response = $action->addSub(
            $this->createRequest('POST', '/v1/account/1/supplychain'),
            new Response(),
            ['id' => '1']
        );

        self::assertSame(404, $response->getStatusCode());
        self::assertSame([], $repository->supplyChainSaveCalls);
    }

    public function testAddSubPersistsMappingWhenEntitiesLoaded(): void
    {
        $repository = new SupplyChainRepositoryStub();
        $repository->accountEntities[1] = ['id' => 1];
        $repository->accountEntities[2] = ['id' => 2];
        TradeRepositoryDouble::$trades[5] = ['id' => 5];

        $action = $this->createAction($repository);
        $this->setActionData($action, ['child' => 2, 'trade' => 5]);

        $response = $action->addSub(
            $this->createRequest('POST', '/v1/account/1/supplychain'),
            new Response(),
            ['id' => '1']
        );

        self::assertSame(203, $response->getStatusCode());
        self::assertSame(
            [
                [
                    'parent_id' => 1,
                    'child_id' => 2,
                    'trade_id' => 5,
                ],
            ],
            $repository->supplyChainSaveCalls
        );
    }

    public function testDeleteSubRemovesSupplyChainRelation(): void
    {
        $repository = new SupplyChainRepositoryStub();
        $repository->accountEntities[4] = ['id' => 4];

        $action = $this->createAction($repository);
        $response = $action->deleteSub(
            $this->createRequest('DELETE', '/v1/account/4/supplychain/9'),
            new Response(),
            ['id' => '4', 'child' => '9']
        );

        self::assertSame(203, $response->getStatusCode());
        self::assertSame([
            [
                'parent_id' => 4,
                'child_id' => 9,
            ],
        ], $repository->supplyChainDeleteWhereCalls);
    }

    public function testDeleteSubReturnsNotFoundWhenAccountMissing(): void
    {
        $repository = new SupplyChainRepositoryStub();
        $repository->entityExists = false;

        $action = $this->createAction($repository);
        $response = $action->deleteSub(
            $this->createRequest('DELETE', '/v1/account/4/supplychain/9'),
            new Response(),
            ['id' => '4', 'child' => '9']
        );

        self::assertSame(404, $response->getStatusCode());
        self::assertSame([], $repository->supplyChainDeleteWhereCalls);
    }

    public function testAddExternalReturnsInvalidJsonWhenPayloadMissing(): void
    {
        $repository = new SupplyChainRepositoryStub();
        $repository->accountEntities[3] = ['id' => 3];

        $action = $this->createAction($repository);
        $this->setActionData($action, null);

        $response = $action->addExternal(
            $this->createRequest('POST', '/v1/account/3/supplychain/external'),
            new Response(),
            ['id' => '3']
        );

        self::assertSame(400, $response->getStatusCode());
    }

    public function testAddExternalReturnsInvalidJsonWhenNameMissing(): void
    {
        $repository = new SupplyChainRepositoryStub();
        $repository->accountEntities[3] = ['id' => 3];

        $action = $this->createAction($repository);
        $this->setActionData($action, ['name' => '']);

        $response = $action->addExternal(
            $this->createRequest('POST', '/v1/account/3/supplychain/external'),
            new Response(),
            ['id' => '3']
        );

        self::assertSame(400, $response->getStatusCode());
    }

    public function testAddExternalCreatesAccountAndUser(): void
    {
        $repository = new SupplyChainRepositoryStub();
        $repository->accountEntities[3] = ['id' => 3];
        $repository->nextAccountId = 700;
        $repository->nextUserId = 900;

        $action = $this->createAction($repository);
        $this->setActionData($action, [
            'name' => 'New Sub',
            'user' => ['email' => 'new@example.com'],
        ]);

        $response = $action->addExternal(
            $this->createRequest('POST', '/v1/account/3/supplychain/external'),
            new Response(),
            ['id' => '3']
        );

        self::assertSame(200, $response->getStatusCode());
        $payload = json_decode((string) $response->getBody(), true, 512, JSON_THROW_ON_ERROR);
        self::assertSame(['id' => 700, 'user_id' => 900], $payload['data']);
        self::assertSame('New Sub', $repository->accountsByName['New Sub']->getData('name'));
        $metaSave = $repository->accountSaveCalls[1]['meta'] ?? '{}';
        $decoded = json_decode($metaSave, true, 512, JSON_THROW_ON_ERROR);
        self::assertSame('New Sub', $decoded[3]['name']);
        self::assertSame(
            [
                [
                    'account_id' => 700,
                    'payload' => ['email' => 'new@example.com'],
                    'id' => 900,
                ],
            ],
            $repository->createdUsers
        );
    }

    public function testAddExternalReusesExistingAccount(): void
    {
        $repository = new SupplyChainRepositoryStub();
        $repository->accountEntities[10] = ['id' => 10];
        $existing = new AccountEntityStub(true, 55, ['id' => 55, 'type' => 'external_subcontractor', 'meta' => json_encode([])], $repository);
        $repository->accountsByName['Existing'] = $existing;
        $repository->accountHolderIds[55] = 2222;

        $action = $this->createAction($repository);
        $this->setActionData($action, ['name' => 'Existing']);

        $response = $action->addExternal(
            $this->createRequest('POST', '/v1/account/10/supplychain/external'),
            new Response(),
            ['id' => '10']
        );

        self::assertSame(200, $response->getStatusCode());
        $payload = json_decode((string) $response->getBody(), true, 512, JSON_THROW_ON_ERROR);
        self::assertSame(['id' => 55, 'user_id' => 2222], $payload['data']);
        $metaSave = end($repository->accountSaveCalls)['meta'] ?? '{}';
        $decoded = json_decode($metaSave, true, 512, JSON_THROW_ON_ERROR);
        self::assertArrayHasKey(10, $decoded);
    }

    public function testUpdateExternalReturnsInvalidJsonWhenPayloadMissing(): void
    {
        $repository = new SupplyChainRepositoryStub();
        $repository->accountEntities[5] = ['id' => 5, 'type' => 'external_subcontractor'];
        $repository->supplyChainMappingPairs['2:5'] = true;

        $action = $this->createAction($repository);
        $this->setActionData($action, null);

        $response = $action->updateExternal(
            $this->createRequest('PATCH', '/v1/account/2/supplychain/5/external'),
            new Response(),
            ['id' => '2', 'child' => '5']
        );

        self::assertSame(400, $response->getStatusCode());
    }

    public function testUpdateExternalReturnsNotFoundWhenMappingMissing(): void
    {
        $repository = new SupplyChainRepositoryStub();
        $repository->accountEntities[5] = ['id' => 5, 'type' => 'external_subcontractor'];

        $action = $this->createAction($repository);
        $this->setActionData($action, ['notes' => 'noop']);

        $response = $action->updateExternal(
            $this->createRequest('PATCH', '/v1/account/2/supplychain/5/external'),
            new Response(),
            ['id' => '2', 'child' => '5']
        );

        self::assertSame(404, $response->getStatusCode());
    }

    public function testUpdateExternalPersistsMetaWhenMappingExists(): void
    {
        $repository = new SupplyChainRepositoryStub();
        $repository->accountEntities[5] = [
            'id' => 5,
            'type' => 'external_subcontractor',
            'meta' => json_encode([]),
        ];
        $repository->supplyChainMappingPairs['2:5'] = true;

        $action = $this->createAction($repository);
        $this->setActionData($action, ['notes' => 'updated']);

        $response = $action->updateExternal(
            $this->createRequest('PATCH', '/v1/account/2/supplychain/5/external'),
            new Response(),
            ['id' => '2', 'child' => '5']
        );

        self::assertSame(203, $response->getStatusCode());
        $metaSave = end($repository->accountSaveCalls)['meta'] ?? '{}';
        $decoded = json_decode($metaSave, true, 512, JSON_THROW_ON_ERROR);
        self::assertSame('updated', $decoded[2]['notes']);
    }

    public function testMapRegionRequiresRegionsArray(): void
    {
        $repository = new SupplyChainRepositoryStub();
        $repository->accountEntities[3] = ['id' => 3];
        $repository->accountEntities[7] = ['id' => 7];

        $action = $this->createAction($repository);
        $this->setActionData($action, null);

        $response = $action->mapRegion(
            $this->createRequest('PATCH', '/v1/account/3/supplychain/7/regions'),
            new Response(),
            ['id' => '3', 'child' => '7']
        );

        self::assertSame(400, $response->getStatusCode());
    }

    public function testMapRegionMapsRegionsWithAddOnlyFlag(): void
    {
        $repository = new SupplyChainRepositoryStub();
        $repository->accountEntities[3] = ['id' => 3];
        $repository->accountEntities[7] = ['id' => 7];

        $action = $this->createAction($repository);
        $this->setActionData($action, ['regions' => [1, 2]]);

        $request = $this->createRequest('PATCH', '/v1/account/3/supplychain/7/regions')
            ->withQueryParams(['add_only' => '1']);

        $response = $action->mapRegion(
            $request,
            new Response(),
            ['id' => '3', 'child' => '7']
        );

        self::assertSame(203, $response->getStatusCode());
        self::assertSame(
            [
                [
                    'child_id' => 7,
                    'regions' => [1, 2],
                    'type' => 'supply_chain',
                    'parent_id' => 3,
                    'add_only' => true,
                ],
            ],
            RegionRepositoryDouble::$mapCalls
        );
    }

    public function testMapTradesSkipsCleanWhenAddOnlySet(): void
    {
        $repository = new SupplyChainRepositoryStub();
        $repository->accountEntities[4] = ['id' => 4];
        $repository->accountEntities[8] = ['id' => 8];

        $action = $this->createAction($repository);
        $this->setActionData($action, ['trades' => [9]]);

        $request = $this->createRequest('PATCH', '/v1/account/4/supplychain/8/trades')
            ->withQueryParams(['add_only' => '1']);

        $response = $action->mapTrades(
            $request,
            new Response(),
            ['id' => '4', 'child' => '8']
        );

        self::assertSame(203, $response->getStatusCode());
        self::assertSame([], $repository->cleanCalls);
        self::assertSame([[4, 8, [9]]], $repository->mapTradesCalls);
    }

    public function testGetAddedToContractorsReturnsGroupedContractors(): void
    {
        $repository = new SupplyChainRepositoryStub();
        $repository->supplyChainFindAllResult = [
            ['parent_id' => 5, 'added_to_date' => '2023-01-01'],
            ['parent_id' => 7, 'added_to_date' => '2023-01-02'],
        ];

        $action = $this->createAction($repository);
        $response = $action->getAddedToContractors(
            $this->createRequest('GET', '/v1/account/contractors/3'),
            new Response(),
            ['id' => '3']
        );

        $payload = json_decode((string) $response->getBody(), true, 512, JSON_THROW_ON_ERROR);
        self::assertSame(200, $response->getStatusCode());
        self::assertSame([
            'contractors' => [
                '5' => ['contractor' => 5, 'created_at' => '2023-01-01'],
                '7' => ['contractor' => 7, 'created_at' => '2023-01-02'],
            ],
        ], $payload['data']);
    }

    private function createAction(SupplyChainRepositoryStub $repository): SupplyChainActionUnderTest
    {
        $logger = $this->createMock(LoggerInterface::class);
        return new SupplyChainActionUnderTest($logger, $repository);
    }

    private function setActionData(SupplyChainAction $action, ?array $data): void
    {
        $ref = new \ReflectionClass(Action::class);
        $prop = $ref->getProperty('data');
        $prop->setAccessible(true);
        $prop->setValue($action, $data);
    }
}

final class SupplyChainActionUnderTest extends SupplyChainAction
{
    public int $badRequestCount = 0;
    public ?\Psr\Http\Message\ResponseInterface $lastBadRequestResponse = null;

    public function __construct(LoggerInterface $logger, SupplyChainRepositoryStub $repository)
    {
        parent::__construct($logger);
        $this->repository = $repository;
    }

    public function badRequest(\Psr\Http\Message\ResponseInterface $response, $error = []): \Psr\Http\Message\ResponseInterface
    {
        $this->badRequestCount++;
        $this->lastBadRequestResponse = parent::badRequest($response, $error);

        return $this->lastBadRequestResponse;
    }
}
