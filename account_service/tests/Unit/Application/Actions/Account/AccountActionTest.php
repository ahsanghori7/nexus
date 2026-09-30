<?php
declare(strict_types=1);

namespace Tests\Application\Actions\Account;

use App\Application\Actions\Account\AccountAction;
use App\Application\Actions\Action;
use App\Domain\AbstractModel;
use App\Infrastructure\Action\Paginator;
use Psr\Http\Message\ServerRequestInterface as RequestInterface;
use Psr\Log\LoggerInterface;
use Slim\Psr7\Response;
use Tests\TestCase;

final class AccountActionTest extends TestCase
{
    public function testDefaultContentTypeIsJson(): void
    {
        $action = $this->createAction(new AccountRepositoryStub());

        $ref = new \ReflectionClass(AccountAction::class);
        $prop = $ref->getProperty('defaultContentType');
        $prop->setAccessible(true);

        self::assertSame('application/json', $prop->getValue($action));
    }

    public function testListAccountsReturnsUsersFromRepository(): void
    {
        $repository = new AccountRepositoryStub();
        $repository->accountsWithUsers = [
            ['id' => 1, 'users' => [['id' => 9]]],
        ];

        $action = $this->createAction($repository);
        $response = $action->listAccounts(
            $this->createRequest('GET', '/v1/account/[1]'),
            new Response(),
            ['ids' => '[1]']
        );

        self::assertSame(200, $response->getStatusCode());
        $payload = $this->decode($response);
        self::assertSame($repository->accountsWithUsers, $payload['data']);
        self::assertSame([['1']], $repository->accountsWithUsersCalls);
    }

    public function testSearchRequiresQueryParameter(): void
    {
        $action = $this->createAction(new AccountRepositoryStub());
        $response = $action->search(
            $this->createRequest('GET', '/v1/account/search'),
            new Response(),
            []
        );

        self::assertSame(400, $response->getStatusCode());
    }

    public function testSearchReturnsRepositoryResults(): void
    {
        $repository = new AccountRepositoryStub();
        $repository->searchResults = [['id' => 7]];

        $action = $this->createAction($repository);
        $request = $this->createRequest('GET', '/v1/account/search')
            ->withQueryParams(['query' => 'acme']);
        $response = $action->search($request, new Response(), []);

        self::assertSame(200, $response->getStatusCode());
        $payload = $this->decode($response);
        self::assertSame($repository->searchResults, $payload['data']);
        self::assertSame(['acme'], $repository->searchCalls);
    }

    public function testUpdateMembershipPersistsPayload(): void
    {
        $repository = new AccountRepositoryStub();
        $repository->membershipLoaded = true;

        $action = $this->createAction($repository);
        $this->setActionData($action, ['role' => 'admin']);
        $response = $action->updateMembership(
            $this->createRequest('PATCH', '/v1/account/4/membership'),
            new Response(),
            ['id' => '4']
        );

        self::assertSame(203, $response->getStatusCode());
        self::assertSame([[4, 'account_id']], $repository->membershipLoads);
        self::assertSame([['role' => 'admin']], $repository->membershipSaves);
    }

    public function testListAllAccountsAppliesFilters(): void
    {
        $repository = new AccountRepositoryStub();
        $repository->listAccountsResult = [['id' => 3]];
        $repository->paginatorCount = 4;

        $action = $this->createAction($repository);
        $request = $this->createRequest('GET', '/v1/account/list')
            ->withQueryParams([
                'limit' => '5',
                'offset' => '2',
                'type' => '1',
                'query' => 'north',
                'order' => 'name',
                'desc' => '1',
                'accounts' => '1',
                'region' => '7',
                'trade' => '9',
                'subscriptions' => '2,3',
                'status' => '1',
            ]);
        $response = $action->listAllAccounts($request, new Response(), []);

        self::assertSame(200, $response->getStatusCode());
        $payload = $this->decode($response);
        self::assertSame($repository->listAccountsResult, $payload['data']);
        self::assertSame(4, $payload['links']['total']);
        self::assertSame(
            [
                [
                    'limit' => 5,
                    'offset' => 2,
                    'type' => 1,
                    'search' => 'north',
                    'order' => 'name',
                    'desc' => '1',
                    'filters' => ['region' => '7', 'trade' => '9', 'subscriptions' => '2,3'],
                    'justAccount' => true,
                    'status' => 1,
                ],
            ],
            $repository->listAccountsCalls
        );
    }

    public function testGetOrganisationNormalisesRecords(): void
    {
        $repository = new AccountRepositoryStub();
        $repository->organisationRows = [
            [
                'id' => 9,
                'user_id' => 12,
                'firstname' => 'Fallback',
                'lastname' => 'Name',
                'user_firstname' => 'Jane',
                'user_lastname' => 'Doe',
                'contact_number' => '111',
                'user_phone' => '888',
                'email' => 'jane@example.com',
                'user_email' => 'jane.work@example.com',
                'organisation_role_id' => 7,
                'label' => 'Default',
                'custom_type_label' => 'Custom',
                'type_id' => 7,
            ],
        ];

        $action = $this->createAction($repository);
        $response = $action->getOrganisation(
            $this->createRequest('GET', '/v1/account/5/organisation'),
            new Response(),
            ['id' => '5']
        );

        self::assertSame(200, $response->getStatusCode());
        $payload = $this->decode($response);
        self::assertSame(
            [
                [
                    'id' => 9,
                    'user_id' => 12,
                    'firstname' => 'Jane',
                    'lastname' => 'Doe',
                    'phone' => '111',
                    'email' => 'jane.work@example.com',
                    'title' => 'Custom',
                    'type_id' => 7,
                ],
            ],
            $payload['data']
        );
        self::assertSame([['ur.account_id' => '5']], $repository->organisationFilters);
    }

    public function testUpdateMembershipReturnsNotFoundWhenMembershipMissing(): void
    {
        $repository = new AccountRepositoryStub();
        $repository->membershipLoaded = false;

        $action = $this->createAction($repository);
        $this->setActionData($action, ['role' => 'viewer']);
        $response = $action->updateMembership(
            $this->createRequest('PATCH', '/v1/account/9/membership'),
            new Response(),
            ['id' => '9']
        );

        self::assertSame(404, $response->getStatusCode());
        self::assertSame([[9, 'account_id']], $repository->membershipLoads);
        self::assertSame([], $repository->membershipSaves);
    }

    public function testDeleteOrganisationMemberRemovesRecordForMatchingAccount(): void
    {
        $repository = new AccountRepositoryStub();
        $repository->organisationMembersById[12] = [
            'id' => 12,
            'account_id' => 7,
        ];

        $action = $this->createAction($repository);
        $response = $action->deleteOrganisationMember(
            $this->createRequest('DELETE', '/v1/account/7/organisation/12'),
            new Response(),
            ['aid' => '7', 'id' => '12']
        );

        self::assertSame(203, $response->getStatusCode());
        self::assertSame([12], $repository->organisationDeleteCalls);
        self::assertArrayNotHasKey(12, $repository->organisationMembersById);
    }

    public function testDeleteOrganisationMemberReturnsNotFoundWhenAccountDoesNotMatch(): void
    {
        $repository = new AccountRepositoryStub();
        $repository->organisationMembersById[12] = [
            'id' => 12,
            'account_id' => 9,
        ];

        $action = $this->createAction($repository);
        $response = $action->deleteOrganisationMember(
            $this->createRequest('DELETE', '/v1/account/7/organisation/12'),
            new Response(),
            ['aid' => '7', 'id' => '12']
        );

        self::assertSame(404, $response->getStatusCode());
        self::assertSame([], $repository->organisationDeleteCalls);
        self::assertArrayHasKey(12, $repository->organisationMembersById);
    }

    public function testDeleteOrganisationMemberByUserIdRemovesRecord(): void
    {
        $repository = new AccountRepositoryStub();
        $repository->organisationMembersById[14] = [
            'id' => 14,
            'account_id' => 5,
            'user_id' => 99,
        ];

        $action = $this->createAction($repository);
        $response = $action->deleteOrganisationMemberByUserId(
            $this->createRequest('DELETE', '/v1/account/5/organisation/user/99'),
            new Response(),
            ['aid' => '5', 'id' => '99']
        );

        self::assertSame(203, $response->getStatusCode());
        self::assertSame([14], $repository->organisationDeleteCalls);
        self::assertArrayNotHasKey(14, $repository->organisationMembersById);
    }

    public function testDeleteOrganisationMemberByUserIdReturnsNotFoundWhenAccountMismatch(): void
    {
        $repository = new AccountRepositoryStub();
        $repository->organisationMembersById[15] = [
            'id' => 15,
            'account_id' => 8,
            'user_id' => 44,
        ];

        $action = $this->createAction($repository);
        $response = $action->deleteOrganisationMemberByUserId(
            $this->createRequest('DELETE', '/v1/account/5/organisation/user/44'),
            new Response(),
            ['aid' => '5', 'id' => '44']
        );

        self::assertSame(404, $response->getStatusCode());
        self::assertSame([], $repository->organisationDeleteCalls);
        self::assertArrayHasKey(15, $repository->organisationMembersById);
    }

    public function testGetAccountsByRegionRequiresRegionId(): void
    {
        $action = $this->createAction(new AccountRepositoryStub());
        $response = $action->getAccountsByRegion(
            $this->createRequest('GET', '/v1/account/region'),
            new Response(),
            ['rid' => '0']
        );

        self::assertSame(400, $response->getStatusCode());
    }

    public function testGetAccountsByRegionReturnsUsersForRegion(): void
    {
        $repository = new AccountRepositoryStub();
        $repository->accountsByRegion = [
            ['id' => 3, 'name' => 'West'],
            ['id' => 7, 'name' => 'North'],
        ];
        $repository->accountsWithUsers = [
            ['id' => 3, 'users' => [['id' => 31]]],
            ['id' => 7, 'users' => [['id' => 71]]],
        ];

        $action = $this->createAction($repository);
        $response = $action->getAccountsByRegion(
            $this->createRequest('GET', '/v1/account/region/5')->withQueryParams(['active' => '1']),
            new Response(),
            ['rid' => '5']
        );

        self::assertSame(200, $response->getStatusCode());
        $payload = $this->decode($response);
        self::assertSame($repository->accountsWithUsers, $payload['data']);
        self::assertSame([[5, ['active' => '1']]], $repository->accountsByRegionCalls);
        self::assertSame([[3, 7]], $repository->accountsWithUsersCalls);
    }

    public function testUpdateAccountsCustomerHealthScorePersistsIds(): void
    {
        $repository = new AccountRepositoryStub();
        $repository->updateAccountsCustomerHealthScoreResult = ['updated' => true];

        $action = $this->createAction($repository);
        $this->setActionData($action, [10, 11, 12]);
        $response = $action->updateAccountsCustomerHealthScore(
            $this->createRequest('POST', '/v1/account/customer-health'),
            new Response(),
            []
        );

        self::assertSame(200, $response->getStatusCode());
        $payload = $this->decode($response);
        self::assertSame(['updated' => true], $payload['data']);
        self::assertSame([[10, 11, 12]], $repository->updateAccountsCustomerHealthScoreCalls);
    }

    public function testDeleteAccountsCustomerHealthScoreDeletesAid(): void
    {
        $repository = new AccountRepositoryStub();
        $repository->deleteAccountsCustomerHealthScoreResult = ['deleted' => 9];

        $action = $this->createAction($repository);
        $response = $action->deleteAccountsCustomerHealthScore(
            $this->createRequest('DELETE', '/v1/account/customer-health/9'),
            new Response(),
            ['aid' => '9']
        );

        self::assertSame(200, $response->getStatusCode());
        $payload = $this->decode($response);
        self::assertSame(['deleted' => 9], $payload['data']);
        self::assertSame([[9]], $repository->deleteAccountsCustomerHealthScoreCalls);
    }

    public function testActivateAccountRequiresToken(): void
    {
        $action = $this->createAction(new AccountRepositoryStub());
        $response = $action->activate_account(
            $this->createRequest('GET', '/v1/account/activate'),
            new Response(),
            []
        );

        self::assertSame(400, $response->getStatusCode());
    }

    public function testActivateAccountReturnsNotFoundWhenVerificationFails(): void
    {
        $repository = new AccountRepositoryStub();
        $repository->verifyThrows = true;

        $action = $this->createAction($repository);
        $response = $action->activate_account(
            $this->createRequest('GET', '/v1/account/activate/abc'),
            new Response(),
            ['token' => 'abc']
        );

        self::assertSame(404, $response->getStatusCode());
        self::assertSame([['abc', 7]], $repository->verifyCalls);
    }

    public function testActivateAccountReturnsSessionAndActivatesUser(): void
    {
        $repository = new AccountRepositoryStub();
        $repository->tokenMeta = json_encode(['region_id' => 4]);
        $repository->tokenUserId = 55;

        $action = $this->createAction($repository);
        $response = $action->activate_account(
            $this->createRequest('GET', '/v1/account/activate/valid'),
            new Response(),
            ['token' => 'valid']
        );

        self::assertSame(200, $response->getStatusCode());
        $payload = $this->decode($response);
        self::assertSame(55, $payload['data']['user_id']);
        self::assertSame(4, $payload['data']['region_id']);
        self::assertSame(55, $payload['data']['user']['id']);
        self::assertSame([['valid', 7]], $repository->verifyCalls);
        self::assertTrue($repository->accountActivated);
        self::assertSame([[55, ['region_id' => 4]]], $repository->createSessionCalls);
        self::assertSame([55], $repository->sessionSetUserCalls);
        self::assertTrue($repository->tokenInactivated);
    }

    public function testUpdateMetaUpdatesExistingKey(): void
    {
        $repository = new AccountRepositoryStub();
        $repository->accountMetaKeys = ['status' => 9];
        $repository->accountMetaExisting['5:9'] = ['id' => 44];

        $action = $this->createAction($repository);
        $this->setActionData($action, ['status' => 'premium']);

        $response = $action->updateMeta(
            $this->createRequest('PATCH', '/v1/account/5/meta'),
            new Response(),
            ['id' => '5']
        );

        self::assertSame(203, $response->getStatusCode());
        self::assertSame([
            [
                'account_id' => 5,
                'meta_key_id' => 9,
                'value' => 'premium',
            ],
        ], $repository->accountMetaEntitySaveCalls);
        self::assertSame([], $repository->accountMetaSaveCalls);
    }

    public function testUpdateMetaInsertsNewKeyWhenMissing(): void
    {
        $repository = new AccountRepositoryStub();
        $repository->accountMetaKeys = ['status' => 3];
        $repository->accountMetaFindExceptions['7:3'] = true;

        $action = $this->createAction($repository);
        $this->setActionData($action, ['status' => 'trial']);

        $response = $action->updateMeta(
            $this->createRequest('PATCH', '/v1/account/7/meta'),
            new Response(),
            ['id' => '7']
        );

        self::assertSame(203, $response->getStatusCode());
        self::assertSame([
            [
                'account_id' => 7,
                'meta_key_id' => 3,
                'value' => 'trial',
            ],
        ], $repository->accountMetaSaveCalls);
    }

    public function testListTypesReturnsRepositoryData(): void
    {
        $repository = new AccountRepositoryStub();
        $repository->typeResults = [['id' => 1, 'label' => 'Main']];

        $action = $this->createAction($repository);
        $response = $action->listTypes(
            $this->createRequest('GET', '/v1/account/types'),
            new Response(),
            []
        );

        $payload = $this->decode($response);
        self::assertSame(200, $response->getStatusCode());
        self::assertSame($repository->typeResults, $payload['data']);
    }

    public function testListUserTypesReturnsRoleCollection(): void
    {
        $repository = new AccountRepositoryStub();
        $repository->roleTypes = [['id' => 1, 'label' => 'administrator', 'level' => 1, 'display_label' => 'Administrator']];

        $action = $this->createAction($repository);
        $response = $action->listUserTypes(
            $this->createRequest('GET', '/v1/account/user-types'),
            new Response(),
            []
        );

        self::assertSame(200, $response->getStatusCode());
        $payload = $this->decode($response);
        self::assertSame($repository->roleTypes, $payload['data']);
    }

    public function testGetSubscriptionsByFilterPassesArguments(): void
    {
        $repository = new AccountRepositoryStub();
        $repository->subscriptionResults = [['id' => 2]];

        $action = $this->createAction($repository);
        $response = $action->getSubscriptionsByFilter(
            $this->createRequest('GET', '/v1/account/subscriptions'),
            new Response(),
            ['status' => 'active']
        );

        $payload = $this->decode($response);
        self::assertSame(200, $response->getStatusCode());
        self::assertSame($repository->subscriptionResults, $payload['data']);
        self::assertSame([
            ['status' => 'active'],
        ], $repository->subscriptionFindAllCalls);
    }

    public function testGetMembershipReturnsRepositoryResult(): void
    {
        $repository = new AccountRepositoryStub();
        $repository->membershipResult = ['id' => 9];

        $action = $this->createAction($repository);
        $response = $action->getMembership(
            $this->createRequest('GET', '/v1/account/9/membership'),
            new Response(),
            ['id' => '9']
        );

        $payload = $this->decode($response);
        self::assertSame(200, $response->getStatusCode());
        self::assertSame($repository->membershipResult, $payload['data']);
        self::assertSame([9], $repository->membershipGetCalls);
    }

    public function testGetAccountsCustomerHealthScoreReturnsRepositoryData(): void
    {
        $repository = new AccountRepositoryStub();
        $repository->accountsCustomerHealthScore = ['score' => 5];

        $action = $this->createAction($repository);
        $response = $action->getAccountsCustomerHealthScore(
            $this->createRequest('GET', '/v1/account/customer-health'),
            new Response(),
            []
        );

        $payload = $this->decode($response);
        self::assertSame(200, $response->getStatusCode());
        self::assertSame($repository->accountsCustomerHealthScore, $payload['data']);
    }

    public function testListAccountsByMembershipReturnsRepositoryData(): void
    {
        $repository = new AccountRepositoryStub();
        $repository->membershipListResults = [['id' => 4]];

        $action = $this->createAction($repository);
        $response = $action->listAccountsByMembership(
            $this->createRequest('GET', '/v1/account/membership')
                ->withQueryParams(['subscription_id' => '12']),
            new Response(),
            []
        );

        $payload = $this->decode($response);
        self::assertSame(200, $response->getStatusCode());
        self::assertSame($repository->membershipListResults, $payload['data']);
        self::assertSame([
            ['subscription_id' => '12'],
        ], $repository->membershipFindAllCalls);
    }

    public function testGetByIdReturnsLoadedAccountData(): void
    {
        $repository = new AccountRepositoryStub();
        $repository->accountEntities[7] = ['id' => 7, 'name' => 'Acme'];

        $action = $this->createAction($repository);
        $response = $action->getById(
            $this->createRequest('GET', '/v1/account/7'),
            new Response(),
            ['id' => '7']
        );

        $payload = $this->decode($response);
        self::assertSame(200, $response->getStatusCode());
        self::assertSame($repository->accountEntities[7], $payload['data']);
    }

    public function testGetEngagementAggregatesUserIds(): void
    {
        $repository = new AccountRepositoryStub();
        $repository->userFindAllResult = [
            ['id' => 21],
            ['id' => 22],
        ];
        $repository->usersEngagementResult = [
            ['user_id' => 21, 'score' => 3],
            ['user_id' => 22, 'score' => 2],
        ];

        $action = $this->createAction($repository);
        $response = $action->getEngagement(
            $this->createRequest('GET', '/v1/account/5/engagement'),
            new Response(),
            ['id' => '5']
        );

        $payload = $this->decode($response);
        self::assertSame(200, $response->getStatusCode());
        self::assertSame($repository->usersEngagementResult, $payload['data']);
        self::assertSame([
            ['account_id' => '5'],
        ], $repository->userFindAllCalls);
        self::assertSame([[21, 22]], $repository->usersEngagementCalls);
    }

    public function testGetEngagementsAnnotatesAccountIds(): void
    {
        $repository = new AccountRepositoryStub();
        $repository->accountsWithUsers = [
            ['users' => [['id' => 30]]],
            ['users' => [['id' => 31]]],
        ];
        $repository->usersEngagementResult = [
            ['user_id' => 31, 'score' => 7],
        ];

        $action = $this->createAction($repository);
        $response = $action->getEngagements(
            $this->createRequest('GET', '/v1/account/engagements/[9,10]'),
            new Response(),
            ['ids' => '[9,10]']
        );

        $payload = $this->decode($response);
        self::assertSame(200, $response->getStatusCode());
        self::assertSame([
            ['user_id' => 31, 'score' => 7, 'account_id' => 1],
        ], $payload['data']);
        self::assertSame([['9', '10']], $repository->accountsWithUsersCalls);
        self::assertSame([[30, 31]], $repository->usersEngagementCalls);
    }

    public function testGetOrganisationRoleTypeReturnsData(): void
    {
        $repository = new AccountRepositoryStub();
        $repository->userOrganisationTypeResults = [['id' => 1]];

        $action = $this->createAction($repository);
        $response = $action->getOrganisationRoleType(
            $this->createRequest('GET', '/v1/account/organisation/role'),
            new Response(),
            []
        );

        $payload = $this->decode($response);
        self::assertSame(200, $response->getStatusCode());
        self::assertSame($repository->userOrganisationTypeResults, $payload['data']);
    }

    public function testGetAllOfferingsAggregatesMappings(): void
    {
        $repository = new AccountRepositoryStub();
        $repository->offeringTradeMappings = [
            ['account_id' => 5, 'trade_id' => 11],
        ];
        $repository->offeringRegionMappings = [
            ['account_id' => 5, 'region_id' => 7],
        ];
        $repository->offeringTypeMappings = [
            ['account_id' => 5, 'type_id' => 3],
        ];

        $action = $this->createAction($repository);
        $response = $action->getAllOfferings(
            $this->createRequest('GET', '/v1/account/offerings'),
            new Response(),
            []
        );

        $payload = $this->decode($response);
        self::assertSame(200, $response->getStatusCode());
        self::assertSame([
            '5' => [
                'account_id' => 5,
                'offerings' => [
                    'trade' => [11 => 11],
                    'region' => [7 => 7],
                    'type' => [3 => 3],
                ],
            ],
        ], $payload['data']);
    }

    public function testCreateActionSavesActionWhenTypeFound(): void
    {
        $repository = new AccountRepositoryStub();
        $repository->accountActionTypeMap = ['created' => 12];

        $action = $this->createAction($repository);
        $this->setActionData($action, [
            'account_id' => 3,
            'related_account_id' => 4,
            'account_user_id' => 5,
            'related_account_user_id' => 6,
            'action_type' => 'created',
            'description' => 'Created account',
        ]);

        $response = $action->createAction(
            $this->createRequest('POST', '/v1/account/action'),
            new Response(),
            []
        );

        self::assertSame(200, $response->getStatusCode());
        self::assertSame([
            [
                'account_id' => 3,
                'related_account_id' => 4,
                'account_user_id' => 5,
                'related_account_user_id' => 6,
                'action_type' => 12,
                'description' => 'Created account',
            ],
        ], $repository->accountActionSaveCalls);
    }

    public function testFetchActionReturnsErrorWhenRepositoryThrows(): void
    {
        $repository = new AccountRepositoryStub();
        $repository->listAccountActionsThrows = true;

        $action = $this->createAction($repository);
        $response = $action->fetchAction(
            $this->createRequest('GET', '/v1/account/action'),
            new Response(),
            []
        );

        $payload = $this->decode($response);
        self::assertSame(400, $response->getStatusCode());
        self::assertSame('list failed', $payload['data']['error']);
    }

    public function testFetchActionReturnsResultsWithPaginator(): void
    {
        $repository = new AccountRepositoryStub();
        $repository->listAccountActionsResult = [['id' => 1]];
        $repository->accountActionsPaginatorCount = 6;

        $action = $this->createAction($repository);
        $response = $action->fetchAction(
            $this->createRequest('GET', '/v1/account/action')
                ->withQueryParams(['limit' => '5', 'offset' => '10']),
            new Response(),
            []
        );

        $payload = $this->decode($response);
        self::assertSame(200, $response->getStatusCode());
        self::assertSame($repository->listAccountActionsResult, $payload['data']);
        self::assertSame(6, $payload['links']['total']);
    }

    public function testActivationLinkReturnsNotFoundWhenUserMissing(): void
    {
        $repository = new AccountRepositoryStub();
        $repository->userLoadMap['email']['missing@example.com'] = ['loaded' => false, 'id' => 0];

        $action = $this->createAction($repository);
        $response = $action->activation_link(
            $this->createRequest('GET', '/v1/account/activation/missing@example.com'),
            new Response(),
            ['email' => 'missing@example.com']
        );

        self::assertSame(404, $response->getStatusCode());
    }

    public function testActivationLinkReturnsExistingTokenWhenActiveTokenFound(): void
    {
        $repository = new AccountRepositoryStub();
        $repository->tokenTypeId = 13;
        $repository->userLoadMap['email']['bob@example.com'] = [
            'loaded' => true,
            'id' => 52,
            'data' => ['id' => 52],
        ];
        $repository->tokenFindResult = ['token' => 'existing-token'];

        $action = $this->createAction($repository);
        $response = $action->activation_link(
            $this->createRequest('GET', '/v1/account/activation/bob@example.com'),
            new Response(),
            ['email' => 'bob@example.com']
        );

        $payload = $this->decode($response);
        self::assertSame(200, $response->getStatusCode());
        self::assertSame('existing-token', $payload['data']['token']);
        self::assertSame(52, $repository->tokenFindCalls[0]['user_id']);
        self::assertSame(13, $repository->tokenFindCalls[0]['token_type_id']);
        self::assertSame([], $repository->tokenCreateActivationLinkCalls);
    }

    public function testActivationLinkCreatesTokenWhenMissing(): void
    {
        $repository = new AccountRepositoryStub();
        $repository->tokenTypeId = 15;
        $repository->userLoadMap['email']['alice@example.com'] = [
            'loaded' => true,
            'id' => 77,
            'data' => ['id' => 77],
        ];
        $repository->tokenFindReturnsNull = true;
        $repository->tokenCreateActivationLinkResult = ['token' => 'new-token'];

        $action = $this->createAction($repository);
        $response = $action->activation_link(
            $this->createRequest('GET', '/v1/account/activation/alice@example.com'),
            new Response(),
            ['email' => 'alice@example.com']
        );

        $payload = $this->decode($response);
        self::assertSame(200, $response->getStatusCode());
        self::assertSame('new-token', $payload['data']['token']);
        self::assertSame([[77, 15]], $repository->tokenCreateActivationLinkCalls);
    }

    public function testPaymentRequestReturnsNotFoundWhenUserMissing(): void
    {
        $repository = new AccountRepositoryStub();
        $repository->userLoadMap['account_id'][5] = ['loaded' => false, 'id' => 0];

        $action = $this->createAction($repository);
        $response = $action->paymentRequest(
            $this->createRequest('GET', '/v1/account/5/payment-request'),
            new Response(),
            ['id' => '5']
        );

        self::assertSame(404, $response->getStatusCode());
    }

    public function testPaymentRequestReturnsExistingTokenWhenFound(): void
    {
        $repository = new AccountRepositoryStub();
        $repository->tokenTypeId = 21;
        $repository->userLoadMap['account_id'][5] = [
            'loaded' => true,
            'id' => 84,
            'data' => ['id' => 84],
        ];
        $repository->tokenFindResult = ['token' => 'payment-existing'];

        $action = $this->createAction($repository);
        $response = $action->paymentRequest(
            $this->createRequest('GET', '/v1/account/5/payment-request'),
            new Response(),
            ['id' => '5']
        );

        $payload = $this->decode($response);
        self::assertSame(200, $response->getStatusCode());
        self::assertSame('payment-existing', $payload['data']['token']);
        self::assertSame(84, $repository->tokenFindCalls[0]['user_id']);
        self::assertSame(21, $repository->tokenFindCalls[0]['token_type_id']);
        self::assertSame([], $repository->tokenCreatePaymentRequestCalls);
    }

    public function testPaymentRequestCreatesTokenWhenNoneActive(): void
    {
        $repository = new AccountRepositoryStub();
        $repository->tokenTypeId = 22;
        $repository->userLoadMap['account_id'][9] = [
            'loaded' => true,
            'id' => 102,
            'data' => ['id' => 102],
        ];
        $repository->tokenFindReturnsNull = true;
        $repository->tokenCreateActivationLinkResult = ['token' => 'fresh-payment'];

        $action = $this->createAction($repository);
        $response = $action->paymentRequest(
            $this->createRequest('GET', '/v1/account/9/payment-request'),
            new Response(),
            ['id' => '9']
        );

        $payload = $this->decode($response);
        self::assertSame(200, $response->getStatusCode());
        self::assertSame('fresh-payment', $payload['data']['token']);
        self::assertSame([[102, 22]], $repository->tokenCreatePaymentRequestCalls);
    }

    public function testAutoLoaderReturnsSessionToken(): void
    {
        $repository = new AccountRepositoryStub();
        $repository->tokenMeta = json_encode(['region_id' => 8]);
        $repository->tokenUserId = 61;
        $repository->tokenCreateActivationLinkResult = ['token' => 'session-token'];

        $action = $this->createAction($repository);
        $response = $action->autoLoader(
            $this->createRequest('GET', '/v1/account/loader/abc'),
            new Response(),
            ['token' => 'abc']
        );

        $payload = $this->decode($response);
        self::assertSame(200, $response->getStatusCode());
        self::assertSame('session-token', $payload['data']['token']);
        self::assertSame($repository->tokenCreateActivationLinkCalls[0][0], $repository->tokenUserId);
        self::assertTrue($repository->tokenInactivated);
    }

    public function testAutoLoaderReturnsNotFoundWhenVerificationFails(): void
    {
        $repository = new AccountRepositoryStub();
        $repository->verifyThrows = true;

        $action = $this->createAction($repository);
        $response = $action->autoLoader(
            $this->createRequest('GET', '/v1/account/loader/fail'),
            new Response(),
            ['token' => 'fail']
        );

        self::assertSame(404, $response->getStatusCode());
        self::assertFalse($repository->tokenInactivated);
    }

    public function testAutoLoaderRequiresToken(): void
    {
        $action = $this->createAction(new AccountRepositoryStub());
        $response = $action->autoLoader(
            $this->createRequest('GET', '/v1/account/loader'),
            new Response(),
            []
        );

        self::assertSame(400, $response->getStatusCode());
    }

    public function testOptInReturnsUser(): void
    {
        $repository = new AccountRepositoryStub();
        $repository->tokenUserId = 99;

        $action = $this->createAction($repository);
        $response = $action->optIn(
            $this->createRequest('GET', '/v1/account/opt-in/xyz'),
            new Response(),
            ['token' => 'xyz']
        );

        $payload = $this->decode($response);
        self::assertSame(200, $response->getStatusCode());
        self::assertSame(99, $payload['data']['user']['id']);
    }

    public function testOptInReturnsBadRequestWithoutToken(): void
    {
        $action = $this->createAction(new AccountRepositoryStub());
        $response = $action->optIn(
            $this->createRequest('GET', '/v1/account/opt-in'),
            new Response(),
            []
        );

        self::assertSame(400, $response->getStatusCode());
    }

    public function testListSubscriptionsReturnsData(): void
    {
        $repository = new AccountRepositoryStub();
        $repository->subscriptionResults = [['id' => 3, 'label' => 'Pro']];

        $action = $this->createAction($repository);
        $response = $action->listSubscriptions(
            $this->createRequest('GET', '/v1/account/subscriptions'),
            new Response(),
            []
        );

        $payload = $this->decode($response);
        self::assertSame(200, $response->getStatusCode());
        self::assertSame($repository->subscriptionResults, $payload['data']);
    }

    public function testListAllWebsitesReturnsData(): void
    {
        $repository = new AccountRepositoryStub();
        $repository->websiteResults = [['id' => 1, 'url' => 'https://example.com']];

        $action = $this->createAction($repository);
        $response = $action->listAllWebsites(
            $this->createRequest('GET', '/v1/account/websites'),
            new Response(),
            []
        );

        $payload = $this->decode($response);
        self::assertSame(200, $response->getStatusCode());
        self::assertSame($repository->websiteResults, $payload['data']);
    }

    public function testCreateOrganisationSuccess(): void
    {
        $repository = new AccountRepositoryStub();

        $action = $this->createAction($repository);
        $this->setActionData($action, ['name' => 'New Org', 'account_id' => 3]);
        $response = $action->createOrganisation(
            $this->createRequest('POST', '/v1/account/3/organisation'),
            new Response(),
            []
        );

        $payload = $this->decode($response);
        self::assertSame(200, $response->getStatusCode());
        self::assertArrayHasKey('id', $payload['data']);
        self::assertSame([['name' => 'New Org', 'account_id' => 3]], $repository->organisationSaveCalls);
    }

    public function testCreateOrganisationReturnsBadRequestWithoutData(): void
    {
        $action = $this->createAction(new AccountRepositoryStub());
        $this->setActionData($action, []);
        $response = $action->createOrganisation(
            $this->createRequest('POST', '/v1/account/3/organisation'),
            new Response(),
            []
        );

        self::assertSame(400, $response->getStatusCode());
    }

    public function testUpdateOrganisationMemberSuccessWithUserUpdate(): void
    {
        $repository = new AccountRepositoryStub();
        $repository->organisationMembersById[20] = ['id' => 20, 'account_id' => 5, 'user_id' => 80];
        $repository->userLoadMap['id'][80] = ['loaded' => true, 'id' => 80, 'data' => ['id' => 80]];

        $action = $this->createAction($repository);
        $this->setActionData($action, [
            'user_id' => 80,
            'firstname' => 'Jane',
            'lastname' => 'Doe',
            'display_name' => 'Jane D',
            'contact_number' => '0123456789',
            'user_email' => 'jane@example.com',
        ]);
        $response = $action->updateOrganisationMember(
            $this->createRequest('PUT', '/v1/account/5/organisation/20'),
            new Response(),
            ['aid' => '5', 'id' => '20']
        );

        $payload = $this->decode($response);
        self::assertSame(200, $response->getStatusCode());
        self::assertSame(20, $payload['data']['id']);
        self::assertCount(1, $repository->userSaveCalls);
        self::assertSame('Jane', $repository->userSaveCalls[0]['firstname']);
    }

    public function testUpdateOrganisationMemberSuccessWithoutUser(): void
    {
        $repository = new AccountRepositoryStub();
        $repository->organisationMembersById[21] = ['id' => 21, 'account_id' => 6, 'user_id' => 0];

        $action = $this->createAction($repository);
        $this->setActionData($action, [
            'user_id' => 0,
            'firstname' => 'Bob',
            'lastname' => 'Smith',
            'contact_number' => '0987654321',
        ]);
        $response = $action->updateOrganisationMember(
            $this->createRequest('PUT', '/v1/account/6/organisation/21'),
            new Response(),
            ['aid' => '6', 'id' => '21']
        );

        $payload = $this->decode($response);
        self::assertSame(200, $response->getStatusCode());
        self::assertSame(21, $payload['data']['id']);
        self::assertSame([], $repository->userSaveCalls);
    }

    public function testUpdateOrganisationMemberReturnsBadRequestWhenAccountMismatch(): void
    {
        $repository = new AccountRepositoryStub();
        $repository->organisationMembersById[22] = ['id' => 22, 'account_id' => 9, 'user_id' => 50];

        $action = $this->createAction($repository);
        $this->setActionData($action, ['user_id' => 50, 'firstname' => 'Test']);
        $response = $action->updateOrganisationMember(
            $this->createRequest('PUT', '/v1/account/5/organisation/22'),
            new Response(),
            ['aid' => '5', 'id' => '22']
        );

        self::assertSame(400, $response->getStatusCode());
    }

    public function testUpdateOrganisationMemberReturnsBadRequestWhenNotLoaded(): void
    {
        $action = $this->createAction(new AccountRepositoryStub());
        $this->setActionData($action, ['user_id' => 0, 'firstname' => 'Ghost']);
        $response = $action->updateOrganisationMember(
            $this->createRequest('PUT', '/v1/account/5/organisation/999'),
            new Response(),
            ['aid' => '5', 'id' => '999']
        );

        self::assertSame(400, $response->getStatusCode());
    }

    public function testFetchAccountUsersReturnsUsers(): void
    {
        $repository = new AccountRepositoryStub();
        $repository->searchUsersByAccountIdResult = [['id' => 11, 'name' => 'Alice']];

        $action = $this->createAction($repository);
        $request = $this->createRequest('GET', '/v1/account/3/users')
            ->withQueryParams(['term' => 'ali', 'role' => '2', 'group' => '5']);
        $response = $action->fetchAccountUsers($request, new Response(), ['account_id' => '3']);

        $payload = $this->decode($response);
        self::assertSame(200, $response->getStatusCode());
        self::assertSame($repository->searchUsersByAccountIdResult, $payload['data']);
        self::assertSame(
            [['accountId' => 3, 'term' => 'ali', 'roleId' => 2, 'groupId' => 5, 'limit' => 25, 'offset' => 0, 'external' => null]],
            $repository->searchUsersByAccountIdCalls
        );
    }

    public function testFetchAccountUsersPassesExternalAndPaginationParams(): void
    {
        $repository = new AccountRepositoryStub();

        $action = $this->createAction($repository);
        $request = $this->createRequest('GET', '/v1/account/3/users')
            ->withQueryParams(['limit' => '10', 'offset' => '20', 'external' => '1']);
        $response = $action->fetchAccountUsers($request, new Response(), ['account_id' => '3']);

        self::assertSame(200, $response->getStatusCode());
        self::assertSame(
            [['accountId' => 3, 'term' => null, 'roleId' => null, 'groupId' => null, 'limit' => 10, 'offset' => 20, 'external' => 1]],
            $repository->searchUsersByAccountIdCalls
        );
    }

    public function testFetchAccountUsersReturnsErrorOnException(): void
    {
        $repository = new AccountRepositoryStub();
        $repository->searchUsersByAccountIdThrows = true;

        $action = $this->createAction($repository);
        $response = $action->fetchAccountUsers(
            $this->createRequest('GET', '/v1/account/3/users'),
            new Response(),
            ['account_id' => '3']
        );

        $payload = $this->decode($response);
        self::assertSame(400, $response->getStatusCode());
        self::assertSame('search failed', $payload['data']['error']);
    }

    private function createAction(AccountRepositoryStub $repository): AccountActionUnderTest
    {
        $logger = $this->createMock(LoggerInterface::class);
        return new AccountActionUnderTest($logger, $repository);
    }

    private function setActionData(AccountAction $action, array $data): void
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
        $contents = (string) $response->getBody();
        self::assertNotSame('', $contents);
        /** @var array<string,mixed> $decoded */
        $decoded = json_decode($contents, true, 512, JSON_THROW_ON_ERROR);
        return $decoded;
    }
}

final class AccountActionUnderTest extends AccountAction
{
    public function __construct(LoggerInterface $logger, AccountRepositoryStub $repository)
    {
        parent::__construct($logger);
        $this->repository = $repository;
    }
}

final class AccountRepositoryStub
{
    public array $accountsWithUsers = [];
    public array $accountsWithUsersCalls = [];
    public array $listAccountsResult = [];
    public array $listAccountsCalls = [];
    public array $searchResults = [];
    public array $searchCalls = [];
    public bool $membershipLoaded = true;
    public array $membershipLoads = [];
    public array $membershipSaves = [];
    public array $membershipListResults = [];
    public array $membershipFindAllCalls = [];
    public array $membershipResult = [];
    public array $membershipGetCalls = [];
    public array $organisationFilters = [];
    public array $organisationRows = [];
    public array $organisationSaveCalls = [];
    /** @var array<int,array<string,mixed>> */
    public array $organisationMembersById = [];
    public array $organisationDeleteCalls = [];
    public int $nextOrganisationId = 10;
    public int $paginatorCount = 0;
    public array $accountsByRegion = [];
    public array $accountsByRegionCalls = [];
    public array $updateAccountsCustomerHealthScoreCalls = [];
    public array $deleteAccountsCustomerHealthScoreCalls = [];
    public array $updateAccountsCustomerHealthScoreResult = [];
    public array $deleteAccountsCustomerHealthScoreResult = [];
    public array $createSessionCalls = [];
    public array $sessionSetUserCalls = [];
    public array $tokenTypeLoads = [];
    public array $verifyCalls = [];
    public bool $verifyThrows = false;
    public string $tokenMeta = '';
    public int $tokenUserId = 42;
    public bool $tokenInactivated = false;
    public bool $accountActivated = false;
    public int $tokenTypeId = 7;
    public bool $tokenUserExists = true;
    public array $typeResults = [];
    public array $roleTypes = [];
    public array $subscriptionResults = [];
    public array $subscriptionFindAllCalls = [];
    public array $websiteResults = [];
    public array $accountsCustomerHealthScore = [];
    /** @var array<int,array<string,mixed>> */
    public array $accountEntities = [];
    public array $accountLoadCalls = [];
    public array $userFindAllResult = [];
    public array $userFindAllCalls = [];
    /** @var array<string,array<int|string,array<string,mixed>>>> */
    public array $userLoadMap = [];
    public array $userLoadCalls = [];
    public array $userSaveCalls = [];
    public array $usersEngagementResult = [];
    public array $usersEngagementCalls = [];
    public array $accountActionTypeCalls = [];
    public array $accountActionTypeMap = [];
    public int $accountActionTypeId = 0;
    public array $accountActionSaveCalls = [];
    public array $listAccountActionsResult = [];
    public array $listAccountActionsCalls = [];
    public bool $listAccountActionsThrows = false;
    public int $accountActionsPaginatorCount = 0;
    public array $offeringTradeMappings = [];
    public array $offeringRegionMappings = [];
    public array $offeringTypeMappings = [];
    public array $offeringFilterCalls = [];
    public array $searchUsersByAccountIdResult = [];
    public array $searchUsersByAccountIdCalls = [];
    public bool $searchUsersByAccountIdThrows = false;
    public array $accountMetaKeys = [];
    /** @var array<string,array<string,mixed>> */
    public array $accountMetaExisting = [];
    public array $accountMetaFindCalls = [];
    public array $accountMetaSaveCalls = [];
    public array $accountMetaEntitySaveCalls = [];
    /** @var array<string,bool> */
    public array $accountMetaFindExceptions = [];
    public array $tokenFindCalls = [];
    public bool $tokenFindThrows = false;
    public bool $tokenFindReturnsNull = false;
    public array $tokenFindResult = [];
    public array $tokenCreateActivationLinkCalls = [];
    public array $tokenCreatePaymentRequestCalls = [];
    public array $tokenCreateActivationLinkResult = [];
    public array $userOrganisationTypeResults = [];
    public array $userOrganisationTypeCalls = [];

    public function getAccountsWithUsers(array $ids): array
    {
        $this->accountsWithUsersCalls[] = $ids;
        return $this->accountsWithUsers;
    }

    public function searchAccountsAndUsers(string $query): array
    {
        $this->searchCalls[] = $query;
        return $this->searchResults;
    }

    public function listAccountsAndUsers(
        int $limit,
        int $offset,
        int $type,
        string $search,
        string $order,
        string $desc,
        array $filters,
        bool $justAccount,
        int $status
    ): array {
        $this->listAccountsCalls[] = [
            'limit' => $limit,
            'offset' => $offset,
            'type' => $type,
            'search' => $search,
            'order' => $order,
            'desc' => $desc,
            'filters' => $filters,
            'justAccount' => $justAccount,
            'status' => $status,
        ];
        return $this->listAccountsResult;
    }

    public function getAccountUsersPaginator(
        RequestInterface $request,
        int $type,
        string $search,
        array $filters,
        bool $justAccount,
        int $status
    ): Paginator {
        return new AccountActionPaginatorStub($request, $this->paginatorCount);
    }

    public function getAccountUsersPaginatorByAccount(
        RequestInterface $request,
        int $accountId,
        ?string $term = null,
        ?int $roleId = null,
        ?int $groupId = null
    ): Paginator {
        return new AccountActionPaginatorStub($request, $this->paginatorCount);
    }

    public function getModel(string $name = '')
    {
        return match ($name) {
            '', 'account' => new AccountModelStub($this),
            'membership' => new MembershipModelStub($this),
            'userOrganisation' => new UserOrganisationModelStub($this),
            'userOrganisationType' => new UserOrganisationTypeModelStub($this),
            'tokenType' => new TokenTypeModelStub($this),
            'user' => new ActivationUserModelStub($this),
            'account_meta' => new AccountMetaModelStub($this),
            'subscription' => new SubscriptionModelStub($this),
            'website' => new WebsiteModelStub($this),
            'type' => new TypeModelStub($this),
            'account_action_type' => new AccountActionTypeModelStub($this),
            'account_action' => new AccountActionModelStub($this),
            'token' => new TokenModelStub($this),
            'offering_trade_mapping' => new OfferingMappingModelStub($this, 'trade'),
            'offering_region_mapping' => new OfferingMappingModelStub($this, 'region'),
            'offering_type_mapping' => new OfferingMappingModelStub($this, 'type'),
            'role' => new RoleModelStub($this),
            default => new GenericModelStub(),
        };
    }

    public function getAccountsByRegion(int $regionId, array $params): array
    {
        $this->accountsByRegionCalls[] = [$regionId, $params];
        return $this->accountsByRegion;
    }

    public function updateAccountsCustomerHealthScore(array $aids): array
    {
        $this->updateAccountsCustomerHealthScoreCalls[] = $aids;
        return $this->updateAccountsCustomerHealthScoreResult;
    }

    public function deleteAccountsCustomerHealthScore(int $aid): array
    {
        $this->deleteAccountsCustomerHealthScoreCalls[] = [$aid];
        return $this->deleteAccountsCustomerHealthScoreResult;
    }

    public function createSession(int $userId, array $data): AccountSessionStub
    {
        $this->createSessionCalls[] = [$userId, $data];
        return new AccountSessionStub($userId, $data, $this);
    }

    public function verify(string $hash, int $tokenTypeId): AccountTokenStub
    {
        $this->verifyCalls[] = [$hash, $tokenTypeId];
        if ($this->verifyThrows) {
            throw new \Exception('verification failed');
        }
        return new AccountTokenStub($this);
    }

    public function getMembership(int $id): array
    {
        $this->membershipGetCalls[] = $id;
        return $this->membershipResult;
    }

    public function getAccountsCustomerHealthScore(): array
    {
        return $this->accountsCustomerHealthScore;
    }

    public function listAccountActions(int $limit, int $offset, ?string $actionType, ?string $actionDate): array
    {
        $this->listAccountActionsCalls[] = compact('limit', 'offset', 'actionType', 'actionDate');
        if ($this->listAccountActionsThrows) {
            throw new \Exception('list failed');
        }
        return $this->listAccountActionsResult;
    }

    public function getAccountActionsPaginator(RequestInterface $request, ?string $actionType, ?string $actionDate): Paginator
    {
        return new AccountActionPaginatorStub($request, $this->accountActionsPaginatorCount);
    }

    public function getUsersEngagement(array $userIds): array
    {
        $this->usersEngagementCalls[] = $userIds;
        return $this->usersEngagementResult;
    }

    public function searchUsersByAccountId(
        int $accountId,
        ?string $term = null,
        ?int $roleId = null,
        ?int $groupId = null,
        int $limit = 25,
        int $offset = 0,
        ?int $external = null
    ): array {
        $this->searchUsersByAccountIdCalls[] = compact('accountId', 'term', 'roleId', 'groupId', 'limit', 'offset', 'external');
        if ($this->searchUsersByAccountIdThrows) {
            throw new \Exception('search failed');
        }
        return $this->searchUsersByAccountIdResult;
    }
}

final class MembershipModelStub
{
    public function __construct(private AccountRepositoryStub $repository)
    {
    }

    public function load(int $id, string $field = 'id'): self
    {
        $this->repository->membershipLoads[] = [$id, $field];
        $this->loaded = $this->repository->membershipLoaded;
        return $this;
    }

    public function isLoaded(): bool
    {
        return $this->loaded ?? false;
    }

    public function save(array $data): void
    {
        $this->repository->membershipSaves[] = $data;
    }

    public function findAll(array $filters = []): array
    {
        $this->repository->membershipFindAllCalls[] = $filters;
        return $this->repository->membershipListResults;
    }
}

final class UserOrganisationModelStub
{
    public function __construct(private AccountRepositoryStub $repository)
    {
    }

    public function all(array $filters = []): array
    {
        $this->repository->organisationFilters[] = $filters;
        return $this->repository->organisationRows;
    }

    public function save(array $data): UserOrganisationEntityStub
    {
        $this->repository->organisationSaveCalls[] = $data;
        $id = $data['id'] ?? $this->repository->nextOrganisationId++;
        $record = ['id' => $id] + $data;
        $this->repository->organisationMembersById[$id] = $record;
        return new UserOrganisationEntityStub(true, $record, $this->repository);
    }

    public function load(int $value, string $field = 'id'): UserOrganisationEntityStub
    {
        $record = null;
        if ($field === 'id') {
            $record = $this->repository->organisationMembersById[$value] ?? null;
        } elseif ($field === 'user_id') {
            foreach ($this->repository->organisationMembersById as $item) {
                if ((int)($item['user_id'] ?? 0) === $value) {
                    $record = $item;
                    break;
                }
            }
        }

        return new UserOrganisationEntityStub($record !== null, $record ?? ['id' => $value], $this->repository);
    }
}

final class UserOrganisationEntityStub
{
    public function __construct(private bool $loaded, private array $data, private AccountRepositoryStub $repository)
    {
    }

    public function isLoaded(): bool
    {
        return $this->loaded;
    }

    public function getData(string $key): mixed
    {
        return $this->data[$key] ?? null;
    }

    public function getId(): int
    {
        return (int)($this->data['id'] ?? 0);
    }

    public function save(array $data): void
    {
        $this->repository->organisationSaveCalls[] = $data + ['id' => $this->getId()];
        $this->data = $data + ['id' => $this->getId()];
        $this->repository->organisationMembersById[$this->getId()] = $this->data;
    }

    public function delete(int $id): void
    {
        $this->repository->organisationDeleteCalls[] = $id;
        unset($this->repository->organisationMembersById[$id]);
    }
}

final class UserOrganisationTypeModelStub
{
    public function __construct(private AccountRepositoryStub $repository)
    {
    }

    public function all(array $filters = []): array
    {
        $this->repository->userOrganisationTypeCalls[] = $filters;
        return $this->repository->userOrganisationTypeResults;
    }
}

final class AccountMetaModelStub
{
    public function __construct(private AccountRepositoryStub $repository)
    {
    }

    public function loadMetaKeys(): array
    {
        return $this->repository->accountMetaKeys;
    }

    public function isValidMetaKey(string $key): bool
    {
        return array_key_exists($key, $this->repository->accountMetaKeys);
    }

    public function findOne(array $criteria)
    {
        $key = sprintf('%s:%s', $criteria['account_id'] ?? 0, $criteria['meta_key_id'] ?? 0);
        $this->repository->accountMetaFindCalls[] = $criteria;
        if (($this->repository->accountMetaFindExceptions[$key] ?? false) === true) {
            throw new \Exception('not found');
        }

        if (!isset($this->repository->accountMetaExisting[$key])) {
            throw new \Exception('missing');
        }

        return new AccountMetaEntityStub($this->repository->accountMetaExisting[$key], $this->repository);
    }

    public function load(int $id, string $field = 'id'): AccountMetaEntityStub
    {
        $record = ['id' => $id];
        foreach ($this->repository->accountMetaExisting as $data) {
            if (($data['id'] ?? null) === $id) {
                $record = $data;
                break;
            }
        }
        return new AccountMetaEntityStub($record, $this->repository);
    }

    public function save(array $data): void
    {
        $this->repository->accountMetaSaveCalls[] = $data;
    }
}

final class AccountMetaEntityStub
{
    public function __construct(private array $data, private AccountRepositoryStub $repository)
    {
    }

    public function getId(): int
    {
        return (int)($this->data['id'] ?? 0);
    }

    public function save(array $data): void
    {
        $this->repository->accountMetaEntitySaveCalls[] = $data;
    }
}

final class TypeModelStub
{
    public function __construct(private AccountRepositoryStub $repository)
    {
    }

    public function findAll(array $filters = []): array
    {
        return $this->repository->typeResults;
    }
}

final class SubscriptionModelStub
{
    public function __construct(private AccountRepositoryStub $repository)
    {
    }

    public function findAll(array $filters = []): array
    {
        $this->repository->subscriptionFindAllCalls[] = $filters;
        return $this->repository->subscriptionResults;
    }
}

final class WebsiteModelStub
{
    public function __construct(private AccountRepositoryStub $repository)
    {
    }

    public function findAll(array $filters = []): array
    {
        return $this->repository->websiteResults;
    }
}

require_once __DIR__ . '/AccountModelStub.php';
require_once __DIR__ . '/AccountEntityStub.php';

final class AccountActionTypeModelStub
{
    public function __construct(private AccountRepositoryStub $repository)
    {
    }

    public function getActionTypeId(string $actionType): ?int
    {
        $this->repository->accountActionTypeCalls[] = $actionType;
        return $this->repository->accountActionTypeMap[$actionType] ?? $this->repository->accountActionTypeId;
    }
}

final class AccountActionModelStub
{
    public function __construct(private AccountRepositoryStub $repository)
    {
    }

    public function save(array $data): void
    {
        $this->repository->accountActionSaveCalls[] = $data;
    }
}

final class TokenModelStub
{
    public function __construct(private AccountRepositoryStub $repository)
    {
    }

    public function findOne(array $criteria)
    {
        $this->repository->tokenFindCalls[] = $criteria;
        if ($this->repository->tokenFindThrows) {
            throw new \Exception('token lookup failed');
        }
        if ($this->repository->tokenFindReturnsNull) {
            throw new \Exception('token missing');
        }
        return new TokenEntityStub($this->repository->tokenFindResult ?: ['token' => 'existing']);
    }

    public function createActivationLink(int $userId, TokenTypeStub $tokenType): TokenEntityStub
    {
        $this->repository->tokenCreateActivationLinkCalls[] = [$userId, $tokenType->getId()];
        $data = $this->repository->tokenCreateActivationLinkResult ?: ['token' => 'activation'];
        return new TokenEntityStub($data);
    }

    public function createPaymentRequest(int $userId, TokenTypeStub $tokenType): TokenEntityStub
    {
        $this->repository->tokenCreatePaymentRequestCalls[] = [$userId, $tokenType->getId()];
        $data = $this->repository->tokenCreateActivationLinkResult ?: ['token' => 'payment'];
        return new TokenEntityStub($data);
    }
}

final class OfferingMappingModelStub
{
    public function __construct(private AccountRepositoryStub $repository, private string $type)
    {
    }

    public function all(array $filters = []): array
    {
        $this->repository->offeringFilterCalls[] = [$this->type, $filters];
        return match ($this->type) {
            'trade' => $this->repository->offeringTradeMappings,
            'region' => $this->repository->offeringRegionMappings,
            'type' => $this->repository->offeringTypeMappings,
            default => [],
        };
    }
}

final class TokenEntityStub implements \JsonSerializable
{
    public function __construct(private array $data)
    {
    }

    public function getData(string $key)
    {
        return $this->data[$key] ?? null;
    }

    public function jsonSerialize(): array
    {
        return $this->data;
    }
}

final class TokenTypeModelStub
{
    public function __construct(private AccountRepositoryStub $repository)
    {
    }

    public function load(string $value, string $field = 'id'): TokenTypeStub
    {
        $this->repository->tokenTypeLoads[] = [$value, $field];
        return new TokenTypeStub($this->repository->tokenTypeId);
    }
}

final class TokenTypeStub
{
    public function __construct(private int $id)
    {
    }

    public function getId(): int
    {
        return $this->id;
    }
}

final class AccountTokenStub
{
    public function __construct(private AccountRepositoryStub $repository)
    {
    }

    public function loadUser(): self
    {
        return $this;
    }

    public function getUser(): ?AccountActivationUserStub
    {
        if (!$this->repository->tokenUserExists) {
            return null;
        }
        return new AccountActivationUserStub($this->repository->tokenUserId, $this->repository);
    }

    public function getData(string $key)
    {
        return $key === 'meta' ? $this->repository->tokenMeta : null;
    }

    public function setTokenInactive(): void
    {
        $this->repository->tokenInactivated = true;
    }
}

final class AccountActivationUserStub implements \JsonSerializable
{
    private AccountActivationAccountStub $account;

    public function __construct(private int $id, private AccountRepositoryStub $repository)
    {
        $this->account = new AccountActivationAccountStub($repository);
    }

    public function getId(): int
    {
        return $this->id;
    }

    public function getAccount(): AccountActivationAccountStub
    {
        return $this->account;
    }

    public function export(): array
    {
        return ['id' => $this->id];
    }

    public function jsonSerialize(): array
    {
        return $this->export();
    }
}

final class AccountActivationAccountStub
{
    public function __construct(private AccountRepositoryStub $repository)
    {
    }

    public function setActive(): void
    {
        $this->repository->accountActivated = true;
    }
}

final class ActivationUserModelStub
{
    public function __construct(private AccountRepositoryStub $repository)
    {
    }

    public function findAll(array $filters = []): array
    {
        $this->repository->userFindAllCalls[] = $filters;
        return $this->repository->userFindAllResult;
    }

    public function load(string|int $value, string $field = 'id'): ActivationUserEntityStub
    {
        $this->repository->userLoadCalls[] = [$value, $field];
        $config = $this->repository->userLoadMap[$field][$value] ?? [
            'loaded' => $this->repository->tokenUserExists,
            'id' => $this->repository->tokenUserId,
            'data' => [$field => $value],
        ];

        return new ActivationUserEntityStub(
            (bool)($config['loaded'] ?? false),
            (int)($config['id'] ?? 0),
            (array)($config['data'] ?? []),
            $this->repository
        );
    }
}

final class ActivationUserEntityStub
{
    public function __construct(
        private bool $loaded,
        private int $id,
        private array $data,
        private AccountRepositoryStub $repository
    ) {
    }

    public function isLoaded(): bool
    {
        return $this->loaded;
    }

    public function getId(): int
    {
        return $this->id;
    }

    public function getData(string $key): mixed
    {
        return $this->data[$key] ?? null;
    }

    public function save(array $data): void
    {
        $record = ['id' => $this->id] + $data;
        $this->repository->userSaveCalls[] = $record;
        $this->data = $record;
    }
}

final class GenericModelStub
{
    public function __call(string $name, array $arguments)
    {
        return $this;
    }
}

final class AccountActionPaginatorStub extends Paginator
{
    private int $overrideCount;

    public function __construct(RequestInterface $request, int $count)
    {
        $this->overrideCount = $count;
        parent::__construct($request, new AccountActionCountModelStub());
    }

    public function getModelCount(): int
    {
        return $this->overrideCount;
    }
}

final class AccountActionCountModelStub extends AbstractModel
{
    public function getCount(array $where = []): int
    {
        return 0;
    }

    public function getName(): string
    {
        return 'account';
    }

    public function getDb()
    {
        return new class {
            public static function getRow(string $sql): array
            {
                return ['c' => 0];
            }
        };
    }
}

final class RoleModelStub
{
    public function __construct(private AccountRepositoryStub $repository)
    {
    }

    public function findAll(): array
    {
        return $this->repository->roleTypes;
    }
}

final class PaginatorStub implements \JsonSerializable
{
    private int $count;
    private int $limit;
    private int $offset;

    public function __construct($request, int $count)
    {
        $this->count = $count;
        $params = $request->getQueryParams();
        $this->limit = (int)($params['limit'] ?? 100);
        $this->offset = (int)($params['offset'] ?? 0);
    }

    public function jsonSerialize(): array
    {
        return [
            'next' => '',
            'prev' => '',
            'page' => $this->limit ? (int) floor($this->offset / $this->limit) : 0,
            'pages' => $this->limit ? (int) ceil($this->count / $this->limit) : 0,
            'total' => $this->count,
        ];
    }
}

final class AccountSessionStub implements \JsonSerializable
{
    private ?AccountActivationUserStub $user = null;

    public function __construct(private int $userId, private array $data, private AccountRepositoryStub $repository)
    {
    }

    public function setUser(AccountActivationUserStub $user): void
    {
        $this->user = $user;
        $this->repository->sessionSetUserCalls[] = $user->getId();
    }

    public function jsonSerialize(): array
    {
        return [
            'user_id' => $this->userId,
            'region_id' => $this->data['region_id'] ?? null,
            'user' => $this->user?->export(),
        ];
    }
}
