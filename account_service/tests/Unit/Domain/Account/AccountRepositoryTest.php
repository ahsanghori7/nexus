<?php
declare(strict_types=1);

namespace Tests\Domain\Account;

use App\Domain\Account\AccountRepository;
use App\Infrastructure\Action\SqlPaginator;
use PHPUnit\Framework\TestCase;
use Slim\Psr7\Factory\StreamFactory;
use Slim\Psr7\Headers;
use Slim\Psr7\Request as SlimRequest;
use Slim\Psr7\Uri;
use Tests\Support\Fakes\FakeAccountActionModel;
use Tests\Support\Fakes\FakeAccountModel;
use Tests\Support\Fakes\FakeAccountRoleModel;
use Tests\Support\Fakes\FakeDB;
use Tests\Support\Fakes\FakeMembershipModel;
use Tests\Support\Fakes\FakeTokenModel;
use Tests\Support\Fakes\FakeTokenTypeModel;
use Tests\Support\Fakes\FakeUserRecordModel;

final class AccountRepositoryTest extends TestCase
{
    private FakeAccountRepository $repository;

    protected function setUp(): void
    {
        parent::setUp();
        FakeDB::reset();
        FakeTokenModel::reset();
        FakeTokenTypeModel::reset();

        $this->repository = new FakeAccountRepository();
    }

    public function testGetAccountsByParamQueryBuildsSQL(): void
    {
        $sql = $this->repository->getAccountsByParamQuery(
            'account_id',
            'region_mapping',
            'region_id',
            'id',
            'region',
            'label',
            'North',
            ' AND type_id = 3'
        );

        $this->assertSame(
            "select DISTINCT account_id from region_mapping where region_id IN (select id from region where label like '%North%') AND type_id = 3",
            $sql
        );
    }

    public function testGetListWhereBuildsFilters(): void
    {
        $where = $this->repository->getListWhere(
            3,
            'acme',
            [
                'region' => 'North',
                'trade' => 'Plumbing',
                'subscriptions' => 'Pro,Basic',
            ],
            false,
            1
        );

        $this->assertStringContainsString('a.type_id = 3', $where);
        $this->assertStringContainsString("(a.name LIKE('%acme%') OR u.display_name LIKE('%acme%'))", $where);
        $this->assertStringContainsString('u.status = 1', $where);
        $this->assertStringContainsString("rm.region_id IN (select id from region where label like '%North%')", $where);
        $this->assertStringContainsString("tm.trade_id IN (select id from trade where label like '%Plumbing%')", $where);
        $this->assertStringContainsString("label like '%Pro%'", $where);
        $this->assertStringContainsString("label like '%Basic%'", $where);
    }

    public function testGetSortingQueryMultiField(): void
    {
        $query = $this->repository->getSortingQuery('company,subscription,created_at', '1,0,1');

        $this->assertSame(' ORDER BY  a.name DESC, s.label ASC, a.created_at DESC', $query);
    }

    public function testAggregateResultsGroupsUsers(): void
    {
        $rows = [
            [
                'account_id' => 10,
                'account_type_id' => 3,
                'subscription_id' => 7,
                'subscription' => 'Pro',
                'subscription_type' => 'monthly',
                'first_pqq_sent' => 1,
                'name' => 'Acme',
                'user_id' => 4,
                'user_type_id' => 2,
                'firstname' => 'Ann',
                'lastname' => 'Lee',
                'email' => 'ann@example.com',
            ],
            [
                'account_id' => 10,
                'name' => 'Acme',
                'user_id' => 8,
                'user_type_id' => 5,
                'firstname' => 'Bob',
                'lastname' => 'Ray',
                'email' => 'bob@example.com',
            ],
        ];

        $result = $this->repository->aggregateResults($rows);

        $this->assertArrayHasKey(10, $result);
        $this->assertSame('Acme', $result[10]['name']);
        $this->assertArrayHasKey(4, $result[10]['users']);
        $this->assertSame(2, $result[10]['users'][4]['type']);
        $this->assertSame('Bob', $result[10]['users'][8]['firstname']);
    }

    public function testMapCopiesKnownColumnsOnly(): void
    {
        $data = $this->repository->map(
            ['name' => 'Acme', 'meta' => '{}', 'unknown' => 'noop'],
            'account'
        );

        $this->assertSame('Acme', $data['name']);
        $this->assertArrayNotHasKey('unknown', $data);
    }

    public function testGetAccountsWithUsersBuildsStructure(): void
    {
        FakeDB::queueGetAllResult([
            [
                'account_id' => 1,
                'name' => 'Acme',
                'account_email' => 'info@acme.test',
                'address' => '1 Street',
                'landline' => '123',
                'mobile' => '456',
                'reg_number' => 'REG',
                'vat_number' => 'VAT',
                'utr_number' => 'UTR',
                'logo' => 'logo.png',
                'slogan' => 'Hello',
                'website' => 'acme.test',
                'description' => 'Desc',
                'account_status' => 1,
                'account_type_id' => 3,
                'created_at' => '2024-01-01',
                'account_meta' => '{"key":"val"}',
                'user_id' => 9,
                'firstname' => 'Ann',
                'lastname' => 'Lee',
                'user_email' => 'ann@acme.test',
                'user_type_id' => 2,
                'display_name' => 'Ann Lee',
                'job_title' => 'PM',
                'contact_number' => '555',
                'migrated' => 0,
                'subscription_id' => 11,
                'starts_at' => '2024-01-01',
                'expires_at' => '2024-12-31',
            ],
        ]);

        $result = $this->repository->getAccountsWithUsers([1]);

        $this->assertSame('Acme', $result[1]['name']);
        $this->assertSame('Ann', $result[1]['users'][0]['firstname']);
        $this->assertSame('2024-01-01', $result[1]['membership']['starts_at']);
        $this->assertStringContainsString('WHERE a.id IN (1)', FakeDB::$lastGetAllQuery ?? '');
    }

    public function testFilterAccountsMergesDistinctIds(): void
    {
        FakeDB::reset();
        FakeDB::$getAllResults = [
            [
                ['account_id' => 1],
                ['account_id' => 2],
            ],
            [
                ['account_id' => 3],
            ],
            [
                ['account_id' => 2],
                ['account_id' => 4],
            ],
        ];

        $result = $this->repository->filterAccounts([
            'region' => 'North',
            'trade' => 'Fitout',
            'subscriptions' => 'Pro',
        ]);

        $this->assertSame([1, 2, 3, 2, 4], $result);
    }

    public function testGetAccountsByRegionWithStrictAndLists(): void
    {
        FakeDB::reset();
        FakeDB::queueGetAllResult([]);

        $this->repository->getAccountsByRegion(5, [
            'name' => 'Acme',
            'strict' => true,
            'reg_number' => '123',
            'type_id' => '3',
        ]);

        $this->assertStringContainsString("region_group_id = 5", FakeDB::$lastGetAllQuery ?? '');
        $this->assertStringContainsString("name  = 'Acme'", FakeDB::$lastGetAllQuery ?? '');
        $this->assertStringContainsString("reg_number  = '123'", FakeDB::$lastGetAllQuery ?? '');
        $this->assertStringContainsString("type_id = 3", FakeDB::$lastGetAllQuery ?? '');

        FakeDB::queueGetAllResult([]);

        $this->repository->getAccountsByRegion(0, [
            'name' => 'Beta',
            'reg_number' => 'REG-9',
            'type_id' => '1,2',
        ]);

        $this->assertStringContainsString("name LIKE '%Beta%'", FakeDB::$lastGetAllQuery ?? '');
        $this->assertStringContainsString("reg_number LIKE '%REG-9%'", FakeDB::$lastGetAllQuery ?? '');
        $this->assertStringContainsString("type_id IN (1,2)", FakeDB::$lastGetAllQuery ?? '');
    }

    public function testVerifyValidTokenReturnsTokenElseThrows(): void
    {
        FakeTokenModel::reset();
        FakeTokenModel::$isValidQueue = [true];
        $token = $this->repository->verify('good', 1);
        $this->assertInstanceOf(FakeTokenModel::class, $token);

        $this->expectException(\Exception::class);
        $this->expectExceptionMessage('Invalid Token');
        FakeTokenModel::$isValidQueue = [false];
        $this->repository->verify('bad', 1);
    }

    public function testCreateSessionReusesValidOrCreatesNew(): void
    {
        FakeTokenModel::reset();
        FakeTokenTypeModel::reset();

        FakeTokenModel::$defaultIsValid = true;
        $this->repository->createSession(5);
        $this->assertCount(1, FakeTokenModel::$loadLatestCalls);
        $this->assertSame([], FakeTokenModel::$savePayloads);

        FakeTokenModel::reset();
        FakeTokenTypeModel::reset();
        FakeTokenModel::$defaultIsValid = false;
        FakeTokenTypeModel::$nextId = 77;

        $this->repository->createSession(9, ['ip' => '1.1.1.1']);

        $this->assertSame(77, FakeTokenModel::$savePayloads[0]['token_type_id']);
        $this->assertSame('{"ip":"1.1.1.1"}', FakeTokenModel::$savePayloads[0]['meta']);
    }

    public function testGetUsersEngagementUsesInQuery(): void
    {
        FakeDB::reset();
        FakeDB::queueGetAllResult([]);

        $this->repository->getUsersEngagement([1, 2, 3]);

        $this->assertSame('SELECT * FROM token WHERE user_id IN (1,2,3)', FakeDB::$lastGetAllQuery);
    }

    public function testAccountActionsListingAndPaginator(): void
    {
        FakeDB::reset();
        FakeDB::queueGetAllResult([['id' => 1]]);

        $result = $this->repository->listAccountActions(5, 10, 'call', '2024-01-02');
        $this->assertSame([['id' => 1]], $result);
        $this->assertStringContainsString("LIMIT 5 OFFSET 10", FakeDB::$lastGetAllQuery ?? '');
        $this->assertStringContainsString("aat.label = 'call'", FakeDB::$lastGetAllQuery ?? '');
        $this->assertStringContainsString("DATE(aa.action_date) = '2024-01-02'", FakeDB::$lastGetAllQuery ?? '');

        FakeDB::queueGetRowResult(['c' => 3]);
        $paginator = $this->repository->getAccountActionsPaginator(
            $this->createRequest(),
            'call',
            '2024-01-02'
        );

        $this->assertInstanceOf(SqlPaginator::class, $paginator);
        $this->assertSame(3, $paginator->getCount());
        $this->assertStringContainsString('COUNT(*) as c', FakeDB::$lastGetRow[0] ?? '');
        $this->assertStringContainsString("aat.label = 'call'", FakeDB::$lastGetRow[0] ?? '');
        $this->assertStringContainsString("DATE(aa.action_date) = '2024-01-02'", FakeDB::$lastGetRow[0] ?? '');
    }

    public function testListAccountRolesWithPermissionsGroupsPermissionsByRole(): void
    {
        FakeDB::reset();
        FakeDB::queueGetAllResult([
            [
                'account_role_id' => 1,
                'label' => 'Admin',
                'description' => 'Administrator role',
                'user_type_id' => 2,
                'is_external' => 0,
                'level' => 10,
                'user_type_key' => 'admin',
                'user_type' => 'Administrator',
                'is_contractor_user_type' => 0,
                'permission_id' => 5,
                'permission_key' => 'manage_roles',
                'permission_type_id' => 3,
                'permission_type_label' => 'Accounts',
            ],
            [
                'account_role_id' => 1,
                'label' => 'Admin',
                'description' => 'Administrator role',
                'user_type_id' => 2,
                'is_external' => 0,
                'level' => 10,
                'user_type_key' => 'admin',
                'user_type' => 'Administrator',
                'is_contractor_user_type' => 0,
                'permission_id' => 6,
                'permission_key' => 'manage_users',
                'permission_type_id' => 3,
                'permission_type_label' => 'Accounts',
            ],
        ]);

        $result = $this->repository->listAccountRolesWithPermissions(1);

        $this->assertCount(1, $result);
        $this->assertSame(1, $result[0]['id']);
        $this->assertSame('Admin', $result[0]['label']);
        $this->assertSame(2, $result[0]['user_type_id']);
        $this->assertFalse($result[0]['is_external']);
        $this->assertSame('admin', $result[0]['user_type_key']);
        $this->assertSame('Administrator', $result[0]['user_type']);
        $this->assertFalse($result[0]['is_contractor_user_type']);
        $this->assertCount(2, $result[0]['permissions']);
        $this->assertSame(5, $result[0]['permissions'][0]['id']);
        $this->assertSame('manage_roles', $result[0]['permissions'][0]['key']);
        $this->assertSame(3, $result[0]['permissions'][0]['permission_type_id']);
        $this->assertStringContainsString('WHERE ar.account_id = 1', FakeDB::$lastGetAllQuery ?? '');
    }

    public function testListAccountRolesWithPermissionsHandlesRoleWithoutPermissions(): void
    {
        FakeDB::reset();
        FakeDB::queueGetAllResult([
            [
                'account_role_id' => 2,
                'label' => 'Witness',
                'description' => 'Read only role',
                'user_type_id' => 3,
                'is_external' => 1,
                'level' => 5,
                'user_type_key' => 'witness',
                'user_type' => 'Witness',
                'is_contractor_user_type' => 1,
                'permission_id' => null,
                'permission_key' => null,
                'permission_type_id' => null,
                'permission_type_label' => null,
            ],
        ]);

        $result = $this->repository->listAccountRolesWithPermissions(1);

        $this->assertCount(1, $result);
        $this->assertSame(2, $result[0]['id']);
        $this->assertTrue($result[0]['is_external']);
        $this->assertTrue($result[0]['is_contractor_user_type']);
        $this->assertSame([], $result[0]['permissions']);
    }

    public function testListAccountRolesWithPermissionsReturnsMultipleRolesInOrder(): void
    {
        FakeDB::reset();
        FakeDB::queueGetAllResult([
            [
                'account_role_id' => 1,
                'label' => 'Admin',
                'description' => 'Administrator role',
                'user_type_id' => 2,
                'level' => 10,
                'user_type_key' => 'admin',
                'user_type' => 'Administrator',
                'permission_id' => 5,
                'permission_key' => 'manage_roles',
                'permission_type_id' => 3,
                'permission_type_label' => 'Accounts',
            ],
            [
                'account_role_id' => 2,
                'label' => 'Viewer',
                'description' => 'Read only role',
                'user_type_id' => 3,
                'level' => 5,
                'user_type_key' => 'viewer',
                'user_type' => 'Viewer',
                'permission_id' => null,
                'permission_key' => null,
                'permission_type_id' => null,
                'permission_type_label' => null,
            ],
        ]);

        $result = $this->repository->listAccountRolesWithPermissions(1);

        $this->assertCount(2, $result);
        $this->assertSame([1, 2], array_column($result, 'id'));
    }

    public function testListAccountRolesWithPermissionsAppliesUserTypeAndUserTypeIdFilters(): void
    {
        FakeDB::reset();
        FakeDB::queueGetAllResult([]);

        $result = $this->repository->listAccountRolesWithPermissions(1, 'Admin', 5);

        $this->assertSame([], $result);
        $this->assertStringContainsString('ar.account_id = 1', FakeDB::$lastGetAllQuery ?? '');
        $this->assertStringContainsString("r.label = 'Admin'", FakeDB::$lastGetAllQuery ?? '');
        $this->assertStringContainsString('ar.role_id = 5', FakeDB::$lastGetAllQuery ?? '');
    }

    public function testListAccountRolesWithPermissionsAppliesUserTypeFilterOnly(): void
    {
        FakeDB::reset();
        FakeDB::queueGetAllResult([]);

        $this->repository->listAccountRolesWithPermissions(1, 'Admin');

        $this->assertStringContainsString("r.label = 'Admin'", FakeDB::$lastGetAllQuery ?? '');
        $this->assertStringNotContainsString('ar.role_id = ', FakeDB::$lastGetAllQuery ?? '');
    }

    public function testListAccountRolesWithPermissionsAppliesUserTypeIdFilterOnly(): void
    {
        FakeDB::reset();
        FakeDB::queueGetAllResult([]);

        $this->repository->listAccountRolesWithPermissions(1, '', 7);

        $this->assertStringContainsString('ar.role_id = 7', FakeDB::$lastGetAllQuery ?? '');
        $this->assertStringNotContainsString("r.label = '", FakeDB::$lastGetAllQuery ?? '');
    }

    public function testListAccountRolesWithPermissionsNoFiltersOmitsOptionalConditions(): void
    {
        FakeDB::reset();
        FakeDB::queueGetAllResult([]);

        $this->repository->listAccountRolesWithPermissions(1);

        $query = FakeDB::$lastGetAllQuery ?? '';
        $this->assertStringContainsString('WHERE ar.account_id = 1', $query);
        $this->assertStringNotContainsString("r.label = '", $query);
        $this->assertStringNotContainsString('ar.role_id = ', $query);
    }

    public function testGetAccountRoleWithPermissionsReturnsNullWhenNoRows(): void
    {
        FakeDB::reset();
        FakeDB::queueGetAllResult([]);

        $result = $this->repository->getAccountRoleWithPermissions(99);

        $this->assertNull($result);
    }

    public function testGetAccountRoleWithPermissionsAggregatesPermissionsAndFlags(): void
    {
        FakeDB::reset();
        FakeDB::queueGetAllResult([
            [
                'account_role_id' => 7,
                'label' => 'Witness',
                'description' => 'System witness role',
                'user_type_id' => 4,
                'is_external' => 1,
                'level' => 7,
                'value' => 'witness',
                'is_contractor_user_type' => 1,
                'permission_id' => null,
                'permission_key' => null,
                'permission_type_id' => null,
                'permission_type_label' => null,
            ],
        ]);

        $result = $this->repository->getAccountRoleWithPermissions(7);

        $this->assertSame(7, $result['id']);
        $this->assertSame('Witness', $result['label']);
        $this->assertTrue($result['is_external']);
        $this->assertTrue($result['is_contractor_user_type']);
        $this->assertSame([], $result['permissions']);
        $this->assertStringContainsString('WHERE ar.id = 7', FakeDB::$lastGetAllQuery ?? '');
    }

    public function testGetAccountRoleWithPermissionsDefaultsFlagsToFalseWhenAbsent(): void
    {
        FakeDB::reset();
        FakeDB::queueGetAllResult([
            [
                'account_role_id' => 8,
                'label' => 'Site Manager',
                'description' => 'Custom project team member role',
                'user_type_id' => 5,
                'level' => 8,
                'value' => 'project_team_member',
                'permission_id' => 12,
                'permission_key' => 'view_project',
                'permission_type_id' => 1,
                'permission_type_label' => 'Projects',
            ],
        ]);

        $result = $this->repository->getAccountRoleWithPermissions(8);

        $this->assertFalse($result['is_external']);
        $this->assertFalse($result['is_contractor_user_type']);
        $this->assertCount(1, $result['permissions']);
        $this->assertSame(12, $result['permissions'][0]['id']);
    }

    public function testSearchUsersByAccountIdBuildsBaseQuery(): void
    {
        FakeDB::reset();
        FakeDB::queueGetAllResult([]);

        $result = $this->repository->searchUsersByAccountId(3);

        $this->assertSame([], $result);
        $query = FakeDB::$lastGetAllQuery ?? '';
        $this->assertStringContainsString('WHERE u.account_id = ?', $query);
        $this->assertStringContainsString('LIMIT 25 OFFSET 0', $query);
        $this->assertStringNotContainsString('account_role_id = ?', $query);
        $this->assertStringNotContainsString('account_group_id = ?', $query);
        $this->assertStringNotContainsString('LIKE ?', $query);
        $this->assertStringNotContainsString('is_external', $query);
        $this->assertSame([3], FakeDB::$lastGetAllParams);
    }

    public function testSearchUsersByAccountIdAppliesRoleFilter(): void
    {
        FakeDB::reset();
        FakeDB::queueGetAllResult([]);

        $this->repository->searchUsersByAccountId(3, null, 9);

        $query = FakeDB::$lastGetAllQuery ?? '';
        $this->assertStringContainsString(
            'EXISTS (SELECT 1 FROM account_role_user_mapping WHERE user_id = u.id AND account_role_id = ?)',
            $query
        );
        $this->assertSame([3, 9], FakeDB::$lastGetAllParams);
    }

    public function testSearchUsersByAccountIdAppliesGroupFilter(): void
    {
        FakeDB::reset();
        FakeDB::queueGetAllResult([]);

        $this->repository->searchUsersByAccountId(3, null, null, 12);

        $query = FakeDB::$lastGetAllQuery ?? '';
        $this->assertStringContainsString(
            'EXISTS (SELECT 1 FROM account_group_user_mapping WHERE user_id = u.id AND account_group_id = ?)',
            $query
        );
        $this->assertSame([3, 12], FakeDB::$lastGetAllParams);
    }

    public function testSearchUsersByAccountIdAppliesTermFilter(): void
    {
        FakeDB::reset();
        FakeDB::queueGetAllResult([]);

        $this->repository->searchUsersByAccountId(3, 'ann');

        $query = FakeDB::$lastGetAllQuery ?? '';
        $this->assertStringContainsString('(u.firstname LIKE ? OR u.lastname LIKE ? OR u.email LIKE ? OR CONCAT(u.firstname, \' \', u.lastname) LIKE ?)', $query);
        $this->assertSame([3, '%ann%', '%ann%', '%ann%', '%ann%'], FakeDB::$lastGetAllParams);
    }

    public function testSearchUsersByAccountIdAppliesExternalFilterForExternalUsers(): void
    {
        FakeDB::reset();
        FakeDB::queueGetAllResult([]);

        $this->repository->searchUsersByAccountId(3, null, null, null, 25, 0, 1);

        $query = FakeDB::$lastGetAllQuery ?? '';
        $this->assertStringContainsString('WHERE u.account_id = ? AND r.is_external = ?', $query);
        $this->assertSame([3, 1], FakeDB::$lastGetAllParams);
    }

    public function testSearchUsersByAccountIdAppliesExternalFilterForNonExternalUsers(): void
    {
        FakeDB::reset();
        FakeDB::queueGetAllResult([]);

        $this->repository->searchUsersByAccountId(3, null, null, null, 25, 0, 0);

        $query = FakeDB::$lastGetAllQuery ?? '';
        $this->assertStringContainsString(
            'WHERE u.account_id = ? AND (r.is_external = ? OR r.is_external IS NULL)',
            $query
        );
        $this->assertSame([3, 0], FakeDB::$lastGetAllParams);
    }

    public function testSearchUsersByAccountIdRespectsLimitAndOffset(): void
    {
        FakeDB::reset();
        FakeDB::queueGetAllResult([]);

        $this->repository->searchUsersByAccountId(3, null, null, null, 5, 10);

        $this->assertStringContainsString('LIMIT 5 OFFSET 10', FakeDB::$lastGetAllQuery ?? '');
    }

    public function testSearchUsersByAccountIdAggregatesRolesAndGroupsPerUser(): void
    {
        FakeDB::reset();
        $baseUser1 = [
            'id' => 1,
            'account_id' => 3,
            'firstname' => 'Ann',
            'lastname' => 'Lee',
            'email' => 'ann@example.com',
            'type_id' => 2,
            'display_name' => 'Ann Lee',
            'job_title' => 'PM',
            'contact_number' => '555',
            'status' => 2,
        ];
        FakeDB::queueGetAllResult([
            $baseUser1 + ['account_role_id' => 10, 'account_role_label' => 'Admin', 'account_group_id' => 20, 'account_group_label' => 'North'],
            $baseUser1 + ['account_role_id' => 10, 'account_role_label' => 'Admin', 'account_group_id' => 21, 'account_group_label' => 'South'],
            $baseUser1 + ['account_role_id' => 11, 'account_role_label' => 'Viewer', 'account_group_id' => 20, 'account_group_label' => 'North'],
            $baseUser1 + ['account_role_id' => 11, 'account_role_label' => 'Viewer', 'account_group_id' => 21, 'account_group_label' => 'South'],
            [
                'id' => 2,
                'account_id' => 3,
                'firstname' => 'Bob',
                'lastname' => 'Ray',
                'email' => 'bob@example.com',
                'type_id' => 5,
                'display_name' => 'Bob Ray',
                'job_title' => 'Eng',
                'contact_number' => '999',
                'status' => 1,
                'account_role_id' => null,
                'account_role_label' => null,
                'account_group_id' => null,
                'account_group_label' => null,
            ],
        ]);

        $result = $this->repository->searchUsersByAccountId(3);

        $this->assertCount(2, $result);

        $this->assertSame(1, $result[0]['id']);
        $this->assertTrue($result[0]['active']);
        $this->assertSame(
            [['id' => 10, 'label' => 'Admin'], ['id' => 11, 'label' => 'Viewer']],
            $result[0]['role']
        );
        $this->assertSame(
            [['id' => 20, 'label' => 'North'], ['id' => 21, 'label' => 'South']],
            $result[0]['groups']
        );

        $this->assertSame(2, $result[1]['id']);
        $this->assertFalse($result[1]['active']);
        $this->assertSame([], $result[1]['role']);
        $this->assertSame([], $result[1]['groups']);
    }

    private function createRequest(): SlimRequest
    {
        $uri = new Uri('', '', 80, '/actions');
        $stream = (new StreamFactory())->createStream('');
        $headers = new Headers();

        return new SlimRequest('GET', $uri, $headers, [], [], $stream);
    }
}

final class FakeAccountRepository extends AccountRepository
{
    protected array $modelMap = [
        'account' => FakeAccountModel::class,
        'membership' => FakeMembershipModel::class,
        'user' => FakeUserRecordModel::class,
        'token' => FakeTokenModel::class,
        'tokenType' => FakeTokenTypeModel::class,
        'account_action' => FakeAccountActionModel::class,
        'account_role' => FakeAccountRoleModel::class,
    ];

    private array $instances = [];

    public function getModel(string $name = 'account')
    {
        if (!isset($this->modelMap[$name])) {
            return parent::getModel($name);
        }

        if (!isset($this->instances[$name])) {
            $cls = $this->modelMap[$name];
            $this->instances[$name] = new $cls();
        }

        return $this->instances[$name];
    }
}
