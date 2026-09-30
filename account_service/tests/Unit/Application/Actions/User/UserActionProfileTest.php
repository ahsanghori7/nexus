<?php
declare(strict_types=1);

namespace Tests\Application\Actions\User;

use Slim\Psr7\Response;

final class UserActionProfileTest extends UserActionTestCase
{
    public function testGetByIdMergesAccountRoleIntoUserData(): void
    {
        $userData = [
            'id' => 42,
            'email' => 'jane.doe@example.com',
            'firstname' => 'Jane',
            'lastname' => 'Doe',
        ];
        $accountRole = [
            'id' => 1,
            'label' => 'Admin',
            'permissions' => [
                ['id' => 1, 'key' => 'create_projects', 'label' => 'Create Projects'],
            ],
        ];

        $userModel = new UserProfileModelStub($userData);
        $accountRoleModel = new UserProfileAccountRoleModelStub($accountRole);
        $repository = new UserProfileRepositoryStub($userModel, $accountRoleModel);

        $action = $this->createActionWithRepository($repository);
        $response = $action->getById(
            $this->createRequest('GET', '/user/42/profile'),
            new Response(),
            ['id' => '42']
        );

        self::assertSame(200, $response->getStatusCode());
        $payload = $this->decodeResponse($response);
        self::assertSame($userData + ['account_role' => $accountRole], $payload['data']);
        self::assertSame([['42', 'id']], $userModel->loadCalls);
        self::assertSame([42], $accountRoleModel->calls);
    }

    public function testGetByIdReturnsNullAccountRoleWhenUserHasNoRole(): void
    {
        $userData = ['id' => 7, 'email' => 'no.role@example.com'];

        $userModel = new UserProfileModelStub($userData);
        $accountRoleModel = new UserProfileAccountRoleModelStub(null);
        $repository = new UserProfileRepositoryStub($userModel, $accountRoleModel);

        $action = $this->createActionWithRepository($repository);
        $response = $action->getById(
            $this->createRequest('GET', '/user/7/profile'),
            new Response(),
            ['id' => '7']
        );

        self::assertSame(200, $response->getStatusCode());
        $payload = $this->decodeResponse($response);
        self::assertNull($payload['data']['account_role']);
        self::assertSame([7], $accountRoleModel->calls);
    }
}

final class UserProfileModelStub
{
    public array $loadCalls = [];

    public function __construct(private array $data)
    {
    }

    public function load($id, $field = 'id'): self
    {
        $this->loadCalls[] = [$id, $field];
        return $this;
    }

    public function getData(?string $key = null)
    {
        return $key !== null ? ($this->data[$key] ?? null) : $this->data;
    }
}

final class UserProfileAccountRoleModelStub
{
    public array $calls = [];

    public function __construct(private ?array $accountRole)
    {
    }

    public function getUserAccountRoleWithPermissions(int $userId): ?array
    {
        $this->calls[] = $userId;
        return $this->accountRole;
    }
}

final class UserProfileRepositoryStub
{
    public function __construct(
        private UserProfileModelStub $userModel,
        private UserProfileAccountRoleModelStub $accountRoleModel
    ) {
    }

    public function getModel(string $name = 'user')
    {
        return $name === 'accountRole' ? $this->accountRoleModel : $this->userModel;
    }
}
