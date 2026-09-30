<?php

declare(strict_types=1);

namespace Tests\Unit\Domain\Account;

use App\Domain\Account\AccountRole;
use PHPUnit\Framework\TestCase;

final class AccountRoleTest extends TestCase
{
    public function testGetWhereInReturnsEmptyArrayWithoutQueryingWhenValuesEmpty(): void
    {
        $role = $this->getMockBuilder(AccountRole::class)
            ->onlyMethods(['getDb'])
            ->getMock();

        $role->expects($this->never())->method('getDb');

        $result = $role->getWhereIn('id', []);

        $this->assertSame([], $result);
    }

    public function testGetWhereInSelectsDescriptionAndUserTypeIdColumns(): void
    {
        $role = $this->getMockBuilder(AccountRole::class)
            ->onlyMethods(['getDb', 'getName'])
            ->getMock();

        $dbStub = new class {
            public static $lastQuery;
            public static $lastParams;
            public static $results = [];

            public static function getAll($_query, $_params = [])
            {
                static::$lastQuery = $_query;
                static::$lastParams = $_params;

                return static::$results;
            }
        };

        $dbStub::$results = [
            ['id' => 1, 'label' => 'Admin', 'description' => 'Administrator role', 'user_type_id' => 2],
            ['id' => 2, 'label' => 'Viewer', 'description' => 'Read only role', 'user_type_id' => 3],
        ];

        $role->method('getDb')->willReturn($dbStub);
        $role->method('getName')->willReturn('account_role');

        $result = $role->getWhereIn('id', [1, 2]);

        $this->assertSame($dbStub::$results, $result);
        $this->assertStringContainsString(
            'SELECT id, label, description, role_id as user_type_id FROM account_role WHERE id in (?,?)',
            $dbStub::$lastQuery
        );
        $this->assertSame([1, 2], $dbStub::$lastParams);
    }

    public function testGetUserAccountRoleBuildsQueryWithUserId(): void
    {
        $role = $this->getMockBuilder(AccountRole::class)
            ->onlyMethods(['getDb'])
            ->getMock();

        $dbStub = new class {
            public static $lastQuery;
            public static $results = [];

            public static function getAll($_query, $_params = [])
            {
                static::$lastQuery = $_query;

                return static::$results;
            }
        };

        $dbStub::$results = [['id' => 5, 'account_id' => 10]];

        $role->method('getDb')->willReturn($dbStub);

        $result = $role->getUserAccountRole(42);

        $this->assertSame($dbStub::$results, $result);
        $this->assertStringContainsString('arum.user_id = 42', $dbStub::$lastQuery);
    }

    public function testGetUsersWithAccountRoleBuildsInClause(): void
    {
        $role = $this->getMockBuilder(AccountRole::class)
            ->onlyMethods(['getDb'])
            ->getMock();

        $dbStub = new class {
            public static $lastQuery;
            public static $results = [];

            public static function getAll($_query, $_params = [])
            {
                static::$lastQuery = $_query;

                return static::$results;
            }
        };

        $dbStub::$results = [['account_role_id' => 1, 'account_role_label' => 'Admin']];

        $role->method('getDb')->willReturn($dbStub);

        $result = $role->getUsersWithAccountRole([1, 2, 3]);

        $this->assertSame($dbStub::$results, $result);
        $this->assertStringContainsString('arum.user_id IN (1,2,3)', $dbStub::$lastQuery);
    }

    public function testGetUserAccountRoleWithPermissionsReturnsNullWhenGetAllUnavailable(): void
    {
        $role = $this->getMockBuilder(AccountRole::class)
            ->onlyMethods(['getDb'])
            ->getMock();

        $role->method('getDb')->willReturn(new class {
        });

        $this->assertNull($role->getUserAccountRoleWithPermissions(1));
    }

    public function testGetUserAccountRoleWithPermissionsReturnsNullWhenNoRows(): void
    {
        $role = $this->getMockBuilder(AccountRole::class)
            ->onlyMethods(['getDb'])
            ->getMock();

        $role->method('getDb')->willReturn(new class {
            public static function getAll($query, $params = [])
            {
                return [];
            }
        });

        $this->assertNull($role->getUserAccountRoleWithPermissions(1));
    }

    public function testGetUserAccountRoleWithPermissionsAggregatesPermissionsAndUserType(): void
    {
        $role = $this->getMockBuilder(AccountRole::class)
            ->onlyMethods(['getDb'])
            ->getMock();

        $dbStub = new class {
            public static $lastQuery;
            public static $lastParams;
            public static $results = [];

            public static function getAll($_query, $_params = [])
            {
                static::$lastQuery = $_query;
                static::$lastParams = $_params;

                return static::$results;
            }
        };

        $dbStub::$results = [
            [
                'id' => 7,
                'account_id' => 3,
                'role_id' => 2,
                'label' => 'Admin',
                'description' => 'Administrator role',
                'user_type_id' => 2,
                'user_type_label' => 'admin',
                'permission_id' => 11,
                'permission_key' => 'manage_roles',
                'permission_label' => 'Manage Roles',
                'permission_type_id' => 4,
            ],
            [
                'id' => 7,
                'account_id' => 3,
                'role_id' => 2,
                'label' => 'Admin',
                'description' => 'Administrator role',
                'user_type_id' => 2,
                'user_type_label' => 'admin',
                'permission_id' => 12,
                'permission_key' => 'manage_users',
                'permission_label' => 'Manage Users',
                'permission_type_id' => null,
            ],
            [
                'id' => 7,
                'account_id' => 3,
                'role_id' => 2,
                'label' => 'Admin',
                'description' => 'Administrator role',
                'user_type_id' => 2,
                'user_type_label' => 'admin',
                'permission_id' => null,
                'permission_key' => null,
                'permission_label' => null,
                'permission_type_id' => null,
            ],
        ];

        $role->method('getDb')->willReturn($dbStub);

        $result = $role->getUserAccountRoleWithPermissions(9);

        $this->assertStringContainsString('arum.user_id = ?', $dbStub::$lastQuery);
        $this->assertSame([9], $dbStub::$lastParams);

        $this->assertSame(7, $result['id']);
        $this->assertSame(3, $result['account_id']);
        $this->assertSame(2, $result['user_type_id']);
        $this->assertSame('admin', $result['user_type_label']);
        $this->assertSame(2, $result['role_id']);
        $this->assertSame('Admin', $result['label']);
        $this->assertSame('Administrator role', $result['description']);

        $this->assertCount(2, $result['permissions']);
        $this->assertSame(11, $result['permissions'][0]['id']);
        $this->assertSame('manage_roles', $result['permissions'][0]['key']);
        $this->assertSame(4, $result['permissions'][0]['permission_type_id']);
        $this->assertSame(12, $result['permissions'][1]['id']);
        $this->assertNull($result['permissions'][1]['permission_type_id']);
    }
}
