<?php
declare(strict_types=1);

namespace Tests\Application\Actions\Permission;

use App\Application\Actions\Action;
use App\Application\Actions\Permission\PermissionAction;
use Psr\Log\LoggerInterface;
use Slim\Psr7\Response;
use Tests\TestCase;

final class PermissionActionTest extends TestCase
{
    public function testFetchPermissionsReturnsGroupedByUserTypePayload(): void
    {
        $repository = new PermissionRepositoryStub();
        $repository->permissionsGroupedByUserType = [
            [
                'user_type_id' => 1,
                'user_type_label' => 'super_admin',
                'user_type_display_label' => 'Super Admin',
                'permission_groups' => [
                    [
                        'permission_type_id' => 2,
                        'permission_type_label' => 'Projects',
                        'permissions' => [
                            ['id' => 1, 'key' => 'create_projects', 'label' => 'Create Projects', 'is_checked' => true],
                        ],
                    ],
                ],
            ],
        ];

        $action = $this->createAction($repository);
        $response = $action->fetchPermissions(
            $this->createRequest('GET', '/v1/permissions'),
            new Response(),
            []
        );

        self::assertSame(200, $response->getStatusCode());
        $payload = json_decode((string) $response->getBody(), true, 512, JSON_THROW_ON_ERROR);
        self::assertSame($repository->permissionsGroupedByUserType, $payload['data']);
    }

    public function testGetAllPermissionMappingsReturnsAllRecords(): void
    {
        $repository = new PermissionRepositoryStub();
        $repository->userPermissionRecords = [
            ['id' => 1, 'user_id' => 1, 'permission_id' => 5],
            ['id' => 2, 'user_id' => 2, 'permission_id' => 10],
            ['id' => 3, 'user_id' => 3, 'permission_id' => 15],
        ];

        $action = $this->createAction($repository);
        $response = $action->getAllPermissionMappings(
            $this->createRequest('GET', '/v1/permission/mappings'),
            new Response(),
            []
        );

        self::assertSame(200, $response->getStatusCode());
        $payload = json_decode((string) $response->getBody(), true, 512, JSON_THROW_ON_ERROR);
        self::assertSame($repository->userPermissionRecords, $payload['data']);
        self::assertSame([[]], $repository->userPermissionAllCalls);
    }

    public function testGetAllPermissionMappingsFiltersbyPermissionId(): void
    {
        $repository = new PermissionRepositoryStub();
        $repository->userPermissionExistingRecords = [
            ['id' => 1, 'user_id' => 1, 'permission_id' => 5],
        ];

        $action = $this->createAction($repository);
        $request = $this->createRequest('GET', '/v1/permission/mappings')
            ->withQueryParams(['permission_id' => '5']);
        $response = $action->getAllPermissionMappings(
            $request,
            new Response(),
            []
        );

        self::assertSame(200, $response->getStatusCode());
        $payload = json_decode((string) $response->getBody(), true, 512, JSON_THROW_ON_ERROR);
        self::assertSame($repository->userPermissionExistingRecords, $payload['data']);
        self::assertSame([['permission_id' => 5]], $repository->userPermissionFindAllCalls);
    }

    public function testGetAllPermissionMappingsHandlesEmptyResult(): void
    {
        $repository = new PermissionRepositoryStub();
        $repository->userPermissionRecords = [];

        $action = $this->createAction($repository);
        $response = $action->getAllPermissionMappings(
            $this->createRequest('GET', '/v1/permission/mappings'),
            new Response(),
            []
        );

        self::assertSame(200, $response->getStatusCode());
        $payload = json_decode((string) $response->getBody(), true, 512, JSON_THROW_ON_ERROR);
        self::assertSame([], $payload['data']);
    }

    public function testGetUserPermissionMappingsReturnsBadRequestWhenUserIdMissing(): void
    {
        $action = $this->createAction(new PermissionRepositoryStub());

        $response = $action->getUserPermissionMappings(
            $this->createRequest('GET', '/v1/permission/mappings'),
            new Response(),
            []
        );

        self::assertSame(400, $response->getStatusCode());
    }

    public function testGetUserPermissionMappingsReturnsServerErrorWhenAllMethodMissing(): void
    {
        $repository = new PermissionRepositoryStub();
        $repository->modelMissingAllMethod = true;

        $action = $this->createAction($repository);
        $response = $action->getUserPermissionMappings(
            $this->createRequest('GET', '/v1/permission/mappings'),
            new Response(),
            ['user_id' => '3']
        );

        self::assertSame(500, $response->getStatusCode());
        $payload = json_decode((string) $response->getBody(), true, 512, JSON_THROW_ON_ERROR);
        self::assertSame('SERVER_ERROR', $payload['error']['type']);
        self::assertSame('Model method "all" not found.', $payload['error']['description']);
    }

    public function testGetUserPermissionMappingsFiltersRecords(): void
    {
        $repository = new PermissionRepositoryStub();
        $repository->userPermissionRecords = [
            ['user_id' => 3, 'permission_id' => 2],
            ['user_id' => 5, 'permission_id' => 4],
            ['user_id' => 3, 'permission_id' => 6],
        ];

        $action = $this->createAction($repository);
        $response = $action->getUserPermissionMappings(
            $this->createRequest('GET', '/v1/permission/mappings'),
            new Response(),
            ['user_id' => '3']
        );

        self::assertSame(200, $response->getStatusCode());
        $payload = json_decode((string) $response->getBody(), true, 512, JSON_THROW_ON_ERROR);
        self::assertSame([
            ['user_id' => 3, 'permission_id' => 2],
            ['user_id' => 3, 'permission_id' => 6],
        ], $payload['data']);
        self::assertSame([[]], $repository->userPermissionAllCalls);
    }

    public function testCreateUserPermissionMappingReturnsBadRequestWhenFieldsMissing(): void
    {
        $repository = new PermissionRepositoryStub();
        $action = $this->createAction($repository);
        $this->setActionData($action, ['user_id' => 7]);

        $response = $action->createUserPermissionMapping(
            $this->createRequest('POST', '/v1/permission/mappings'),
            new Response(),
            []
        );

        self::assertSame(400, $response->getStatusCode());
    }

    public function testCreateUserPermissionMappingSkipsDuplicate(): void
    {
        $repository = new PermissionRepositoryStub();
        $repository->userPermissionExistingRecords = [
            ['user_id' => 4, 'permission_id' => 8],
        ];
        $action = $this->createAction($repository);
        $payloadData = ['user_id' => 4, 'permission_id' => 8];
        $this->setActionData($action, $payloadData);

        $response = $action->createUserPermissionMapping(
            $this->createRequest('POST', '/v1/permission/mappings'),
            new Response(),
            []
        );

        self::assertSame(200, $response->getStatusCode());
        $payload = json_decode((string) $response->getBody(), true, 512, JSON_THROW_ON_ERROR);
        self::assertSame(['success' => true], $payload['data']);
        self::assertSame([
            ['user_id' => 4, 'permission_id' => 8],
        ], $repository->userPermissionFindAllCalls);
        self::assertSame([], $repository->userPermissionSaveCalls);
    }

    public function testCreateUserPermissionMappingSavesWhenMissing(): void
    {
        $repository = new PermissionRepositoryStub();
        $action = $this->createAction($repository);
        $payloadData = ['user_id' => 2, 'permission_id' => 5];
        $this->setActionData($action, $payloadData);

        $response = $action->createUserPermissionMapping(
            $this->createRequest('POST', '/v1/permission/mappings'),
            new Response(),
            []
        );

        self::assertSame(200, $response->getStatusCode());
        $payload = json_decode((string) $response->getBody(), true, 512, JSON_THROW_ON_ERROR);
        self::assertSame(['success' => true], $payload['data']);
        self::assertSame([
            ['user_id' => 2, 'permission_id' => 5],
        ], $repository->userPermissionSaveCalls);
    }

    public function testDeleteUserPermissionMappingsByUser(): void
    {
        $repository = new PermissionRepositoryStub();
        $action = $this->createAction($repository);

        $response = $action->deleteUserPermissionMappings(
            $this->createRequest('DELETE', '/v1/permission/mappings/3'),
            new Response(),
            ['user_id' => '3']
        );

        self::assertSame(200, $response->getStatusCode());
        $payload = json_decode((string) $response->getBody(), true, 512, JSON_THROW_ON_ERROR);
        self::assertSame(['success' => true], $payload['data']);
        self::assertSame([
            ['user_id' => 3],
        ], $repository->userPermissionDeleteCalls);
    }

    public function testDeleteUserPermissionMappingsByUserAndPermission(): void
    {
        $repository = new PermissionRepositoryStub();
        $action = $this->createAction($repository);

        $response = $action->deleteUserPermissionMappings(
            $this->createRequest('DELETE', '/v1/permission/mappings/3/6'),
            new Response(),
            ['user_id' => '3', 'permission_id' => '6']
        );

        self::assertSame(200, $response->getStatusCode());
        $payload = json_decode((string) $response->getBody(), true, 512, JSON_THROW_ON_ERROR);
        self::assertSame(['success' => true], $payload['data']);
        self::assertSame([
            ['user_id' => 3, 'permission_id' => 6],
        ], $repository->userPermissionDeleteCalls);
    }

    private function createAction(PermissionRepositoryStub $repository): PermissionActionUnderTest
    {
        $logger = $this->createMock(LoggerInterface::class);
        return new PermissionActionUnderTest($logger, $repository);
    }

    private function setActionData(PermissionAction $action, mixed $data): void
    {
        $ref = new \ReflectionClass(Action::class);
        $prop = $ref->getProperty('data');
        $prop->setAccessible(true);
        $prop->setValue($action, $data);
    }
}

final class PermissionActionUnderTest extends PermissionAction
{
    public function __construct(LoggerInterface $logger, private PermissionRepositoryStub $repositoryStub)
    {
        parent::__construct($logger);
        $this->repository = $repositoryStub;
    }
}

final class PermissionRepositoryStub
{
    public array $permissions = [];
    public array $permissionsGroupedByUserType = [];
    public array $userPermissionRecords = [];
    public array $userPermissionExistingRecords = [];
    public array $userPermissionFindAllCalls = [];
    public array $userPermissionSaveCalls = [];
    public array $userPermissionDeleteCalls = [];
    public array $userPermissionAllCalls = [];
    public bool $modelMissingAllMethod = false;

    public function getPermissions(): array
    {
        return $this->permissions;
    }

    public function getPermissionsGroupedByUserType(): array
    {
        return $this->permissionsGroupedByUserType;
    }

    public function getModel(string $name = ''): object
    {
        if ($this->modelMissingAllMethod) {
            return new class {
                public function findAll(array $filters = []): array
                {
                    return [];
                }
            };
        }
        return new UserPermissionMappingModelStub($this);
    }
}

final class UserPermissionMappingModelStub
{
    public function __construct(private PermissionRepositoryStub $repository)
    {
    }

    public function all(array $params = []): array
    {
        $this->repository->userPermissionAllCalls[] = $params;
        return $this->repository->userPermissionRecords;
    }

    public function findAll(array $filters = []): array
    {
        $this->repository->userPermissionFindAllCalls[] = $filters;
        return $this->repository->userPermissionExistingRecords;
    }

    public function save(array $data): void
    {
        $this->repository->userPermissionSaveCalls[] = $data;
    }

    public function deleteWhere(array $filters): void
    {
        $this->repository->userPermissionDeleteCalls[] = $filters;
    }
}
