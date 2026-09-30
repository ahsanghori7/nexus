<?php
declare(strict_types=1);

namespace Tests\Domain\Permission;

use App\Domain\Permission\PermissionRepository;
use PHPUnit\Framework\TestCase;

final class PermissionRepositoryTest extends TestCase
{
    protected function setUp(): void
    {
        PermissionModelSpy::reset();
        PermissionRepositoryDbDouble::reset();
    }

    public function testFindAllForwardsFiltersToModel(): void
    {
        $repository = new class extends PermissionRepository {
            protected $models = [
                'user_permission' => PermissionModelSpy::class,
            ];
        };
        $filters = ['role' => 'admin'];

        $result = $repository->findAll($filters, 10, 2);

        $this->assertSame(PermissionModelSpy::$result, $result);
        $this->assertSame([[
            'filters' => $filters,
            'limit' => 10,
            'offset' => 2,
        ]], PermissionModelSpy::$calls);
    }

    public function testGetPermissionsQueriesUserPermissionsTable(): void
    {
        PermissionRepositoryDbDouble::queueGetAllResponse([
            ['id' => 1, 'key' => 'view', 'permission_type_id' => null, 'permission_type_label' => null],
        ]);
        $repository = $this->createRepositoryWithQueryModels();

        $result = $repository->getPermissions();

        $this->assertSame([['id' => 1, 'key' => 'view', 'permission_type_id' => null, 'permission_type_label' => null]], $result);
        $this->assertCount(1, PermissionRepositoryDbDouble::$getAllCalls);
        $this->assertStringContainsString('SELECT', PermissionRepositoryDbDouble::$getAllCalls[0]);
        $this->assertStringContainsString('user_permission', PermissionRepositoryDbDouble::$getAllCalls[0]);
        $this->assertStringContainsString('permission_type', PermissionRepositoryDbDouble::$getAllCalls[0]);
        $this->assertStringContainsString('ORDER BY p.id ASC', PermissionRepositoryDbDouble::$getAllCalls[0]);
    }

    public function testGetPermissionMappingsByKeyWithUserId(): void
    {
        PermissionRepositoryDbDouble::queueGetAllResponse([
            [
                'permission_id' => 5,
                'permission_key' => 'tender_inquiry_approval',
                'mapping_id' => 39,
                'user_id' => 1,
            ]
        ]);
        $repository = $this->createRepositoryWithQueryModels();

        $result = $repository->getPermissionMappingsByKey('tender_inquiry_approval', 1);

        $this->assertSame([
            [
                'permission_id' => 5,
                'permission_key' => 'tender_inquiry_approval',
                'mapping_id' => 39,
                'user_id' => 1,
            ]
        ], $result);
        $this->assertCount(1, PermissionRepositoryDbDouble::$getAllCalls);
    }

    public function testGetPermissionMappingsByKeyWithoutUserId(): void
    {
        PermissionRepositoryDbDouble::queueGetAllResponse([
            [
                'permission_id' => 5,
                'permission_key' => 'tender_inquiry_approval',
            ]
        ]);
        $repository = $this->createRepositoryWithQueryModels();

        $result = $repository->getPermissionMappingsByKey('tender_inquiry_approval', null);

        $this->assertSame([
            [
                'permission_id' => 5,
                'permission_key' => 'tender_inquiry_approval',
            ]
        ], $result);
        $this->assertCount(1, PermissionRepositoryDbDouble::$getAllCalls);
    }

public function testGetPermissionMappingsByKeyUserWithoutPermission(): void
    {
        PermissionRepositoryDbDouble::queueGetAllResponse([
            [
                'permission_id' => 5,
                'permission_key' => 'tender_inquiry_approval',
                'mapping_id' => null,
                'user_id' => null,
            ]
        ]);
        $repository = $this->createRepositoryWithQueryModels();

        $result = $repository->getPermissionMappingsByKey('tender_inquiry_approval', 999);

        $this->assertSame([
            [
                'permission_id' => 5,
                'permission_key' => 'tender_inquiry_approval',
                'mapping_id' => null,
                'user_id' => null,
            ]
        ], $result);
        $this->assertCount(1, PermissionRepositoryDbDouble::$getAllCalls);
    }

    public function testGetPermissionsGroupedByUserTypeQueriesCorrectTables(): void
    {
        PermissionRepositoryDbDouble::queueGetAllResponse([
            [
                'user_type_id' => 1,
                'user_type_label' => 'super_admin',
                'user_type_display_label' => 'Super Admin',
                'user_type_level' => 2,
                'permission_type_id' => 2,
                'permission_type_label' => 'Projects',
                'permission_id' => 1,
                'permission_key' => 'create_projects',
                'permission_label' => 'Create Projects',
                'is_checked' => 1,
            ],
        ]);
        $repository = $this->createRepositoryWithQueryModels();

        $result = $repository->getPermissionsGroupedByUserType();

        $this->assertIsArray($result);
        $this->assertCount(1, PermissionRepositoryDbDouble::$getAllCalls);
        $query = PermissionRepositoryDbDouble::$getAllCalls[0];
        $this->assertStringContainsString('permission_user_type', $query);
        $this->assertStringContainsString('role', $query);
        $this->assertStringContainsString('user_permission', $query);
        $this->assertStringContainsString('permission_type', $query);
        $this->assertStringContainsString('ORDER BY r.level ASC', $query);
    }

    public function testGetPermissionsGroupedByUserTypeGroupsDataCorrectly(): void
    {
        PermissionRepositoryDbDouble::queueGetAllResponse([
            [
                'user_type_id' => 1,
                'user_type_label' => 'super_admin',
                'user_type_display_label' => 'Super Admin',
                'user_type_level' => 2,
                'permission_type_id' => 2,
                'permission_type_label' => 'Projects',
                'permission_id' => 1,
                'permission_key' => 'create_projects',
                'permission_label' => 'Create Projects',
                'is_checked' => 1,
            ],
            [
                'user_type_id' => 1,
                'user_type_label' => 'super_admin',
                'user_type_display_label' => 'Super Admin',
                'user_type_level' => 2,
                'permission_type_id' => 2,
                'permission_type_label' => 'Projects',
                'permission_id' => 2,
                'permission_key' => 'edit_project_details',
                'permission_label' => 'Edit Project Details',
                'is_checked' => 0,
            ],
            [
                'user_type_id' => 2,
                'user_type_label' => 'administrator',
                'user_type_display_label' => 'Administrator',
                'user_type_level' => 1,
                'permission_type_id' => 3,
                'permission_type_label' => 'Team',
                'permission_id' => 3,
                'permission_key' => 'invite_users',
                'permission_label' => 'Invite Users',
                'is_checked' => 0,
            ],
        ]);
        $repository = $this->createRepositoryWithQueryModels();

        $result = $repository->getPermissionsGroupedByUserType();

        $this->assertIsArray($result);
        $this->assertCount(2, $result);

        // First user type (super_admin)
        $this->assertSame(1, $result[0]['user_type_id']);
        $this->assertSame('super_admin', $result[0]['user_type_label']);
        $this->assertSame('Super Admin', $result[0]['user_type_display_label']);
        $this->assertCount(1, $result[0]['permission_groups']);

        // First permission group under super_admin
        $this->assertSame(2, $result[0]['permission_groups'][0]['permission_type_id']);
        $this->assertSame('Projects', $result[0]['permission_groups'][0]['permission_type_label']);
        $this->assertCount(2, $result[0]['permission_groups'][0]['permissions']);

        // Permissions in the group
        $this->assertSame(1, $result[0]['permission_groups'][0]['permissions'][0]['id']);
        $this->assertSame('create_projects', $result[0]['permission_groups'][0]['permissions'][0]['key']);
        $this->assertTrue($result[0]['permission_groups'][0]['permissions'][0]['is_checked']);

        $this->assertSame(2, $result[0]['permission_groups'][0]['permissions'][1]['id']);
        $this->assertSame('edit_project_details', $result[0]['permission_groups'][0]['permissions'][1]['key']);
        $this->assertFalse($result[0]['permission_groups'][0]['permissions'][1]['is_checked']);

        // Second user type (administrator)
        $this->assertSame(2, $result[1]['user_type_id']);
        $this->assertSame('administrator', $result[1]['user_type_label']);
        $this->assertSame('Administrator', $result[1]['user_type_display_label']);
        $this->assertCount(1, $result[1]['permission_groups']);
    }

    public function testGetPermissionsGroupedByUserTypeHandlesNullPermissionType(): void
    {
        PermissionRepositoryDbDouble::queueGetAllResponse([
            [
                'user_type_id' => 1,
                'user_type_label' => 'super_admin',
                'user_type_display_label' => 'Super Admin',
                'user_type_level' => 2,
                'permission_type_id' => null,
                'permission_type_label' => null,
                'permission_id' => 1,
                'permission_key' => 'orphan_permission',
                'permission_label' => 'Orphan Permission',
                'is_checked' => 1,
            ],
        ]);
        $repository = $this->createRepositoryWithQueryModels();

        $result = $repository->getPermissionsGroupedByUserType();

        $this->assertCount(1, $result);
        $this->assertCount(1, $result[0]['permission_groups']);
        $this->assertNull($result[0]['permission_groups'][0]['permission_type_id']);
        $this->assertSame('uncategorized', $result[0]['permission_groups'][0]['permission_type_label']);
    }

    public function testGetPermissionsGroupedByUserTypeReturnsEmptyArrayWhenNoResults(): void
    {
        PermissionRepositoryDbDouble::queueGetAllResponse([]);
        $repository = $this->createRepositoryWithQueryModels();

        $result = $repository->getPermissionsGroupedByUserType();

        $this->assertSame([], $result);
    }

    private function createRepositoryWithQueryModels(): PermissionRepository
    {
        return new class extends PermissionRepository {
            protected $models = [
                'user_permission' => PermissionTableModelDouble::class,
                'user_permission_mapping' => PermissionMappingTableModelDouble::class,
                'permission_type' => PermissionTypeTableModelDouble::class,
                'permission_user_type' => PermissionUserTypeTableModelDouble::class,
            ];
        };
    }
}

final class PermissionModelSpy
{
    public static array $calls = [];
    public static array $result = [
        ['id' => 1, 'role' => 'admin'],
    ];

    public static function reset(): void
    {
        self::$calls = [];
        self::$result = [
            ['id' => 1, 'role' => 'admin'],
        ];
    }

    public function findAll(array $filters = [], int $limit = 0, int $offset = 0): array
    {
        self::$calls[] = [
            'filters' => $filters,
            'limit' => $limit,
            'offset' => $offset,
        ];
        return self::$result;
    }
}

final class PermissionRepositoryDbDouble
{
    public static array $getAllCalls = [];
    public static array $getAllResponses = [];

    public static function reset(): void
    {
        self::$getAllCalls = [];
        self::$getAllResponses = [];
    }

    public static function queueGetAllResponse(array $rows): void
    {
        self::$getAllResponses[] = $rows;
    }

    public static function getAll(string $query): array
    {
        self::$getAllCalls[] = $query;
        if (!self::$getAllResponses) {
            return [];
        }

        return array_shift(self::$getAllResponses);
    }
}

final class PermissionTableModelDouble
{
    public function getName(): string
    {
        return 'user_permission';
    }

    public function getDb(): string
    {
        return PermissionRepositoryDbDouble::class;
    }
}

final class PermissionMappingTableModelDouble
{
    public function getName(): string
    {
        return 'user_permission_mapping';
    }

    public function getDb(): string
    {
        return PermissionRepositoryDbDouble::class;
    }
}

final class PermissionTypeTableModelDouble
{
    public function getName(): string
    {
        return 'permission_type';
    }

    public function getDb(): string
    {
        return PermissionRepositoryDbDouble::class;
    }
}

final class PermissionUserTypeTableModelDouble
{
    public function getName(): string
    {
        return 'permission_user_type';
    }

    public function getDb(): string
    {
        return PermissionRepositoryDbDouble::class;
    }
}
