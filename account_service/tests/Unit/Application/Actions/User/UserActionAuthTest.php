<?php
declare(strict_types=1);

namespace Tests\Application\Actions\User;

use Slim\Psr7\Response;

final class UserActionAuthTest extends UserActionTestCase
{
    public function testLoginRequiresUsernameAndPassword(): void
    {
        $repository = new UserAuthRepositoryStub();
        $action = $this->createActionWithRepository($repository);
        $this->setActionData($action, ['username' => 'someone']);

        $response = $action->login(
            $this->createRequest('POST', '/user/session'),
            new Response(),
            []
        );

        self::assertSame(400, $response->getStatusCode());
        self::assertEmpty($repository->loginCalls);
    }

    public function testLoginReturnsTokenPayloadWhenRepositoryAuthenticates(): void
    {
        $repository = new UserAuthRepositoryStub();
        $repository->loginResult = new LoginTokenStub(true, ['token' => 'abc123']);

        $action = $this->createActionWithRepository($repository);
        $this->setActionData($action, [
            'username' => 'john@example.com',
            'password' => 'secret',
            'type_id' => '5',
            'app' => 'portal',
        ]);

        $response = $action->login(
            $this->createRequest('POST', '/user/session'),
            new Response(),
            []
        );

        self::assertSame(200, $response->getStatusCode());
        $payload = $this->decodeResponse($response);
        self::assertSame(['token' => 'abc123'], $payload['data']);
        self::assertSame(
            [['john@example.com', 'secret', 5, 'portal']],
            $repository->loginCalls
        );
        self::assertTrue($repository->loginResult->loadUserCalled);
    }

    public function testLoginReturnsInactiveStatusWhenTokenIndicatesDisabledAccount(): void
    {
        $repository = new UserAuthRepositoryStub();
        $repository->loginResult = new LoginTokenStub(false, ['status' => false]);

        $action = $this->createActionWithRepository($repository);
        $this->setActionData($action, [
            'username' => 'john@example.com',
            'password' => 'secret',
            'type_id' => '2',
        ]);

        $response = $action->login(
            $this->createRequest('POST', '/user/session'),
            new Response(),
            []
        );

        self::assertSame(200, $response->getStatusCode());
        $payload = $this->decodeResponse($response);
        self::assertSame(['status' => false], $payload['data']);
    }

    public function testLoginReturnsUnauthorizedWhenCredentialsInvalid(): void
    {
        $repository = new UserAuthRepositoryStub();
        $repository->loginResult = new LoginTokenStub(false, []);

        $action = $this->createActionWithRepository($repository);
        $this->setActionData($action, [
            'username' => 'john@example.com',
            'password' => 'bad-password',
        ]);

        $response = $action->login(
            $this->createRequest('POST', '/user/session'),
            new Response(),
            []
        );

        self::assertSame(401, $response->getStatusCode());
    }

    public function testLogoutMarksTokenInactiveWhenVerificationSucceeds(): void
    {
        $repository = new UserAuthRepositoryStub();
        $repository->verifyResult = true;

        $action = $this->createActionWithRepository($repository);
        $response = $action->logout(
            $this->createRequest('DELETE', '/user/session/token-hash'),
            new Response(),
            ['token' => 'token-hash']
        );

        self::assertSame(200, $response->getStatusCode());
        self::assertSame(['token-hash'], $repository->verifyCalls);
        self::assertSame(['token-hash'], $repository->setInactiveCalls);
    }

    public function testLogoutReturnsNotFoundWhenVerificationFails(): void
    {
        $repository = new UserAuthRepositoryStub();
        $repository->verifyResult = false;

        $action = $this->createActionWithRepository($repository);
        $response = $action->logout(
            $this->createRequest('DELETE', '/user/session/token-hash'),
            new Response(),
            ['token' => 'token-hash']
        );

        self::assertSame(404, $response->getStatusCode());
        self::assertEmpty($repository->setInactiveCalls);
    }

    public function testVerifyReturnsPayloadWhenTokenValid(): void
    {
        $repository = new UserAuthRepositoryStub();
        $repository->verifyResult = new LoginTokenStub(true, [
            'token'        => 'verified',
            'account_role' => [
                'id'          => 1,
                'account_id'  => 10,
                'role_id'     => 2,
                'label'       => 'Admin',
                'description' => 'Admin role',
                'permissions' => [
                    ['id' => 1, 'key' => 'create_projects', 'label' => 'Create Projects', 'permission_type_id' => 1],
                ],
            ],
        ]);

        $action = $this->createActionWithRepository($repository);
        $response = $action->verify(
            $this->createRequest('GET', '/user/session/token-hash'),
            new Response(),
            ['token' => 'token-hash']
        );

        self::assertSame(200, $response->getStatusCode());
        $payload = $this->decodeResponse($response);
        self::assertArrayHasKey('account_role', $payload['data']);
        self::assertSame('Admin', $payload['data']['account_role']['label']);
        self::assertNotEmpty($payload['data']['account_role']['permissions']);
        self::assertSame(['token-hash'], $repository->verifyCalls);
    }

    public function testVerifyReturnsUnauthorizedWhenTokenInvalid(): void
    {
        $repository = new UserAuthRepositoryStub();
        $repository->verifyResult = false;

        $action = $this->createActionWithRepository($repository);
        $response = $action->verify(
            $this->createRequest('GET', '/user/session/token-hash'),
            new Response(),
            ['token' => 'token-hash']
        );

        self::assertSame(401, $response->getStatusCode());
    }
}

final class UserAuthRepositoryStub
{
    public array $loginCalls = [];
    public array $verifyCalls = [];
    public array $setInactiveCalls = [];
    public mixed $loginResult = null;
    public mixed $verifyResult = null;

    public function login(string $username, string $password, int $typeId, string $app = ''): LoginTokenStub
    {
        $this->loginCalls[] = [$username, $password, $typeId, $app];
        return $this->loginResult ?? new LoginTokenStub(false, []);
    }

    public function verify(string $token)
    {
        $this->verifyCalls[] = $token;
        return $this->verifyResult;
    }

    public function setTokenInactive(string $token): void
    {
        $this->setInactiveCalls[] = $token;
    }

    public function getModel(string $name = 'user')
    {
        return new class {
        };
    }
}

final class LoginTokenStub implements \JsonSerializable
{
    public bool $loadUserCalled = false;

    public function __construct(private bool $loaded, private array $data)
    {
    }

    public function isLoaded(): bool
    {
        return $this->loaded;
    }

    public function loadUser(): void
    {
        $this->loadUserCalled = true;
    }

    public function getData(string $key)
    {
        return $this->data[$key] ?? null;
    }

    public function setAccountRole(?array $accountRole): void
    {
        // no-op for stub; data is injected at construction
    }

    public function jsonSerialize(): array
    {
        return $this->data;
    }
}
