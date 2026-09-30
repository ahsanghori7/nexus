<?php
declare(strict_types=1);

namespace Tests\Application\Actions\Account;

use App\Application\Actions\Account\SupplyChainV2Action;
use App\Application\Actions\Action;
use Psr\Log\LoggerInterface;
use Slim\Psr7\Response;
use Tests\TestCase;

require_once __DIR__ . '/SupplyChainSharedStubs.php';

/**
 * @runTestsInSeparateProcesses
 * @preserveGlobalState disabled
 */
final class SupplyChainV2ActionTest extends TestCase
{
    private static bool $collectionAliased = false;

    protected function setUp(): void
    {
        parent::setUp();
        if (!self::$collectionAliased) {
            if (!class_exists(\App\Domain\Supplychain\Collection::class, false)) {
                class_alias(SupplyChainCollectionStub::class, \App\Domain\Supplychain\Collection::class);
            }
            self::$collectionAliased = true;
        }
        SupplyChainCollectionStub::reset();
        SupplyChainDbStub::$repository = null;
    }

    public function testGetSupplyChainReturnsPaginatedData(): void
    {
        $repository = new SupplyChainRepositoryStub();
        SupplyChainCollectionStub::$nextDataQueue = [
            [['id' => 6, 'name' => 'Sub Co']],
        ];
        SupplyChainCollectionStub::$nextCountQueue = [3];

        $action = $this->createAction($repository);
        $request = $this->createRequest('GET', '/v1/account/5/supplychain')
            ->withQueryParams([
                'limit' => '10',
                'offset' => '5',
                'desc' => '1',
                'order' => 'name',
                'term' => 'steel',
                'trades' => '1,2',
                'regions' => '3',
                'attributes' => '8,9',
            ]);
        $response = $action->getSupplyChain($request, new Response(), ['account_id' => '5']);

        self::assertSame(200, $response->getStatusCode());
        $payload = json_decode((string) $response->getBody(), true, 512, JSON_THROW_ON_ERROR);
        self::assertSame([['id' => 6, 'name' => 'Sub Co']], $payload['data']);
        self::assertSame(3, $payload['links']['total']);
    }

    public function testGetSupplyChainReturnsNotFoundWhenAccountMissing(): void
    {
        $repository = new SupplyChainRepositoryStub();
        $repository->entityExists = false;

        $action = $this->createAction($repository);
        $response = $action->getSupplyChain(
            $this->createRequest('GET', '/v1/account/9/supplychain'),
            new Response(),
            ['account_id' => '9']
        );

        self::assertSame(404, $response->getStatusCode());
    }

    public function testGetSupplyChainAccountReturnsMappedEntry(): void
    {
        $repository = new SupplyChainRepositoryStub();
        SupplyChainCollectionStub::$nextAssocQueue = [
            [7 => ['id' => 7, 'users' => [['id' => 3]]]],
        ];

        $action = $this->createAction($repository);
        $response = $action->getSupplyChainAccount(
            $this->createRequest('GET', '/v1/account/5/supplychain/7'),
            new Response(),
            ['account_id' => '5', 'group_id' => '7']
        );

        self::assertSame(200, $response->getStatusCode());
        $payload = json_decode((string) $response->getBody(), true, 512, JSON_THROW_ON_ERROR);
        self::assertSame(['id' => 7, 'users' => [['id' => 3]]], $payload['data']);
    }

    public function testGetSupplyChainAccountUserMappingReturnsMatchingUser(): void
    {
        $repository = new SupplyChainRepositoryStub();
        SupplyChainCollectionStub::$nextAssocQueue = [
            [7 => ['users' => [['id' => 8, 'firstname' => 'Bob']]]],
        ];

        $action = $this->createAction($repository);
        $response = $action->getSupplyChainAccountUserMapping(
            $this->createRequest('GET', '/v1/account/5/supplychain/7/user/8'),
            new Response(),
            ['account_id' => '5', 'group_id' => '7', 'user_id' => '8']
        );

        self::assertSame(200, $response->getStatusCode());
        $payload = json_decode((string) $response->getBody(), true, 512, JSON_THROW_ON_ERROR);
        self::assertSame(['id' => 8, 'firstname' => 'Bob'], $payload['data']);
    }

    public function testCreateSupplyChainAccountPersistsMapping(): void
    {
        $repository = new SupplyChainRepositoryStub();
        $action = $this->createAction($repository);
        $this->setActionData($action, ['id' => 22]);

        $response = $action->createSupplyChainAccount(
            $this->createRequest('POST', '/v1/account/5/supplychain'),
            new Response(),
            ['account_id' => '5']
        );

        self::assertSame(200, $response->getStatusCode());
        self::assertSame([['parent_id' => 5, 'child_id' => 22]], $repository->supplyChainSaveCalls);
    }

    public function testCreateSupplyChainAccountUserMappingCreatesNewEntry(): void
    {
        $repository = new SupplyChainRepositoryStub();
        $repository->mappingExists = false;
        $repository->nextMappingId = 77;

        $action = $this->createAction($repository);
        $this->setActionData($action, [
            'firstname' => 'Eve',
            'lastname' => 'Stone',
            'contact_number' => '12345',
        ]);

        $response = $action->createSupplyChainAccountUserMapping(
            $this->createRequest('POST', '/v1/account/5/supplychain/4/user/9'),
            new Response(),
            ['account_id' => '5', 'user_id' => '9']
        );

        self::assertSame(200, $response->getStatusCode());
        $payload = json_decode((string) $response->getBody(), true, 512, JSON_THROW_ON_ERROR);
        self::assertSame(77, $payload['data'][0]['id']);
        self::assertSame(1, count($repository->accountUserMappingSaveCalls));
    }

    public function testCreateSupplyChainAccountUserMappingReturnsExistingIdWhenMappingFound(): void
    {
        $repository = new SupplyChainRepositoryStub();
        $repository->mappingExists = true;
        $repository->existingMappingId = 88;

        $action = $this->createAction($repository);
        $this->setActionData($action, [
            'firstname' => 'Ada',
            'lastname' => 'Lovelace',
            'contact_number' => '4444',
        ]);

        $response = $action->createSupplyChainAccountUserMapping(
            $this->createRequest('POST', '/v1/account/5/supplychain/4/user/9'),
            new Response(),
            ['account_id' => '5', 'user_id' => '9']
        );

        self::assertSame(200, $response->getStatusCode());
        $payload = json_decode((string) $response->getBody(), true, 512, JSON_THROW_ON_ERROR);
        self::assertSame(88, $payload['data'][0]['id']);
        self::assertSame([], $repository->accountUserMappingSaveCalls);
    }

    public function testDeleteSupplyChainAccountUserMappingRemovesMapping(): void
    {
        $repository = new SupplyChainRepositoryStub();
        $action = $this->createAction($repository);

        $response = $action->deleteSupplyChainAccountUserMapping(
            $this->createRequest('DELETE', '/v1/account/5/supplychain/4/user/9'),
            new Response(),
            ['account_id' => '5', 'group_id' => '4', 'user_id' => '9']
        );

        self::assertSame(203, $response->getStatusCode());
        self::assertSame(
            [
                [
                    'account_id' => 5,
                    'user_id' => 9,
                    'mapping_type_id' => $repository->mappingTypeId,
                ],
            ],
            $repository->accountUserMappingDeleteCalls
        );
    }

    public function testDeletePromotesMainContactWhenNoAccountHolderRemains(): void
    {
        $repository = new SupplyChainRepositoryStub();
        $repository->accountUserMappings = [
            4 => [
                ['id' => 9, 'type_id' => 4, 'is_main_contact' => 0],
                ['id' => 10, 'type_id' => 4, 'is_main_contact' => 1],
            ],
        ];

        $action = $this->createAction($repository);
        $action->deleteSupplyChainAccountUserMapping(
            $this->createRequest('DELETE', '/v1/account/5/supplychain/4/user/9'),
            new Response(),
            ['account_id' => '5', 'group_id' => '4', 'user_id' => '9']
        );

        self::assertSame(
            ['UPDATE user SET type_id = 5 WHERE id = 10'],
            $repository->userDbExecCalls
        );
    }

    public function testDeleteFallsBackToFirstContactWhenNoMainContact(): void
    {
        $repository = new SupplyChainRepositoryStub();
        $repository->accountUserMappings = [
            4 => [
                ['id' => 11, 'type_id' => 4, 'is_main_contact' => 0],
                ['id' => 12, 'type_id' => 4, 'is_main_contact' => 0],
            ],
        ];

        $action = $this->createAction($repository);
        $action->deleteSupplyChainAccountUserMapping(
            $this->createRequest('DELETE', '/v1/account/5/supplychain/4/user/9'),
            new Response(),
            ['account_id' => '5', 'group_id' => '4', 'user_id' => '9']
        );

        self::assertSame(
            ['UPDATE user SET type_id = 5 WHERE id = 11'],
            $repository->userDbExecCalls
        );
    }

    public function testDeleteDoesNotPromoteWhenAccountHolderStillMapped(): void
    {
        $repository = new SupplyChainRepositoryStub();
        $repository->accountUserMappings = [
            4 => [
                ['id' => 10, 'type_id' => 5, 'is_main_contact' => 1],
            ],
        ];

        $action = $this->createAction($repository);
        $action->deleteSupplyChainAccountUserMapping(
            $this->createRequest('DELETE', '/v1/account/5/supplychain/4/user/9'),
            new Response(),
            ['account_id' => '5', 'group_id' => '4', 'user_id' => '9']
        );

        self::assertSame([], $repository->userDbExecCalls);
    }

    public function testDeleteSupplyChainAccountRemovesMapping(): void
    {
        $repository = new SupplyChainRepositoryStub();
        $action = $this->createAction($repository);

        $response = $action->deleteSupplyChainAccount(
            $this->createRequest('DELETE', '/v1/account/5/supplychain/4'),
            new Response(),
            ['account_id' => '5', 'group_id' => '4']
        );

        self::assertSame(203, $response->getStatusCode());
        self::assertSame(
            [
                [
                    'parent_id' => 5,
                    'child_id' => 4,
                ],
            ],
            $repository->supplyChainDeleteWhereCalls
        );
    }

    public function testGetSupplyChainAccountReturnsNotFoundWhenAccountMissing(): void
    {
        $repository = new SupplyChainRepositoryStub();
        $repository->entityExists = false;

        $action = $this->createAction($repository);
        $response = $action->getSupplyChainAccount(
            $this->createRequest('GET', '/v1/account/5/supplychain/7'),
            new Response(),
            ['account_id' => '5', 'group_id' => '7']
        );

        self::assertSame(404, $response->getStatusCode());
        $payload = json_decode((string) $response->getBody(), true, 512, JSON_THROW_ON_ERROR);
        self::assertSame('Supply Chain Account (7) not found', $payload['data']['message']);
    }

    public function testGetSupplyChainAccountUserMappingReturnsNotFoundWhenAccountMissing(): void
    {
        $repository = new SupplyChainRepositoryStub();
        $repository->entityExists = false;

        $action = $this->createAction($repository);
        $response = $action->getSupplyChainAccountUserMapping(
            $this->createRequest('GET', '/v1/account/5/supplychain/7/user/3'),
            new Response(),
            ['account_id' => '5', 'group_id' => '7', 'user_id' => '3']
        );

        self::assertSame(404, $response->getStatusCode());
        $payload = json_decode((string) $response->getBody(), true, 512, JSON_THROW_ON_ERROR);
        self::assertSame('Supply Chain Account (7) not found', $payload['data']['message']);
    }

    public function testGetMainContractorsBySubcontractorReturnsParents(): void
    {
        $repository = new SupplyChainRepositoryStub();
        $repository->supplyChainFindAllResult = [
            ['parent_id' => 3],
            ['parent_id' => 6],
        ];

        $action = $this->createAction($repository);
        $response = $action->getMainContractorsBySubcontractor(
            $this->createRequest('GET', '/v1/account/4/supplychain/parents'),
            new Response(),
            ['account_id' => '4']
        );

        self::assertSame(200, $response->getStatusCode());
        $payload = json_decode((string) $response->getBody(), true, 512, JSON_THROW_ON_ERROR);
        self::assertSame([3, 6], $payload['data']);
    }

    private function createAction(SupplyChainRepositoryStub $repository): SupplyChainV2ActionUnderTest
    {
        $logger = $this->createMock(LoggerInterface::class);
        return new SupplyChainV2ActionUnderTest($logger, $repository);
    }

    private function setActionData(SupplyChainV2Action $action, array $data): void
    {
        $ref = new \ReflectionClass(Action::class);
        $prop = $ref->getProperty('data');
        $prop->setAccessible(true);
        $prop->setValue($action, $data);
    }
}

final class SupplyChainV2ActionUnderTest extends SupplyChainV2Action
{
    public function __construct(LoggerInterface $logger, SupplyChainRepositoryStub $repository)
    {
        parent::__construct($logger);
        $this->repository = $repository;
    }
}
