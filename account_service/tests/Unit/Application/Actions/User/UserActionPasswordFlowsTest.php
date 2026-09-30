<?php
declare(strict_types=1);

namespace Tests\Application\Actions\User;

use Slim\Psr7\Response;

final class UserActionPasswordFlowsTest extends UserActionTestCase
{
    public function testRenewPasswordUpdatesUserAndDisablesTokenWhenVerified(): void
    {
        $repository = new UserPasswordRepositoryStub();
        $repository->tokenFindResult = UserPasswordRepositoryStub::RETURN_RECORD;
        $repository->tokenRecordData = ['user_id' => 42];
        $repository->userSaveReturn = ['id' => 42];

        $action = $this->createActionWithRepository($repository);
        $this->setActionData($action, ['token' => 'renew-token', 'password' => 'new-secret']);

        $response = $action->renew_password(
            $this->createRequest('POST', '/user/password/renew'),
            new Response(),
            []
        );

        self::assertSame(200, $response->getStatusCode());
        $payload = $this->decodeResponse($response);
        self::assertSame(['status' => true, 'user' => ['id' => 42]], $payload['data']);
        self::assertSame([['renew-token', $repository->tokenTypeId]], $repository->verifyCalls);
        self::assertSame([['password' => 'new-secret', 'migrated' => 1]], $repository->userSavePayloads);
        self::assertSame(0, $repository->tokenSavePayloads[0]['active']);
        self::assertArrayHasKey('expired_at', $repository->tokenSavePayloads[0]);
    }

    public function testRenewPasswordReturnsBadRequestWhenPayloadIncomplete(): void
    {
        $repository = new UserPasswordRepositoryStub();
        $action = $this->createActionWithRepository($repository);
        $this->setActionData($action, ['token' => 'only-token']);

        $response = $action->renew_password(
            $this->createRequest('POST', '/user/password/renew'),
            new Response(),
            []
        );

        self::assertSame(400, $response->getStatusCode());
    }

    public function testRenewPasswordReturnsNotFoundWhenVerificationFails(): void
    {
        $repository = new UserPasswordRepositoryStub();
        $repository->verifyResult = false;

        $action = $this->createActionWithRepository($repository);
        $this->setActionData($action, ['token' => 'bad-token', 'password' => 'irrelevant']);

        $response = $action->renew_password(
            $this->createRequest('POST', '/user/password/renew'),
            new Response(),
            []
        );

        self::assertSame(404, $response->getStatusCode());
        self::assertSame([['bad-token', $repository->tokenTypeId]], $repository->verifyCalls);
    }

    public function testRenewPasswordReturnsNotFoundWhenTokenRecordMissing(): void
    {
        $repository = new UserPasswordRepositoryStub();
        $repository->tokenFindResult = null;

        $action = $this->createActionWithRepository($repository);
        $this->setActionData($action, ['token' => 'missing-token', 'password' => 'new-secret']);

        $response = $action->renew_password(
            $this->createRequest('POST', '/user/password/renew'),
            new Response(),
            []
        );

        self::assertSame(404, $response->getStatusCode());
    }

    public function testResetPasswordReturnsExistingTokenWhenActive(): void
    {
        $repository = new UserPasswordRepositoryStub();
        $repository->tokenFindResult = ['token' => 'existing'];

        $action = $this->createActionWithRepository($repository);
        $response = $action->reset_password(
            $this->createRequest('POST', '/user/password/reset'),
            new Response(),
            ['email' => 'john@example.com']
        );

        self::assertSame(200, $response->getStatusCode());
        $payload = $this->decodeResponse($response);
        self::assertSame(['token' => 'existing'], $payload['data']);
        self::assertCount(1, $repository->tokenFindCriteria);
        $criteria = $repository->tokenFindCriteria[0];
        self::assertSame($repository->userId, $criteria['user_id']);
        self::assertSame($repository->tokenTypeId, $criteria['token_type_id']);
        self::assertSame(1, $criteria['active']);
        self::assertSame('>', $criteria['expires'][0]);
        self::assertNotEmpty($criteria['expires'][1]);
        self::assertSame([['password_reset', 'label']], $repository->tokenTypeLoads);
        self::assertSame([['john@example.com', 'email']], $repository->userLoads);
    }

    public function testResetPasswordCreatesNewTokenWhenNoneActive(): void
    {
        $repository = new UserPasswordRepositoryStub();
        $repository->tokenFindThrows = true;

        $action = $this->createActionWithRepository($repository);
        $response = $action->reset_password(
            $this->createRequest('POST', '/user/password/reset'),
            new Response(),
            ['email' => 'john@example.com']
        );

        self::assertSame(200, $response->getStatusCode());
        $payload = $this->decodeResponse($response);
        self::assertSame($repository->resetPasswordReturn, $payload['data']);
        self::assertSame(
            [[$repository->userId, $repository->tokenTypeStub]],
            $repository->resetPasswordArgs
        );
    }

    public function testResetPasswordReturnsNotFoundWhenUserMissing(): void
    {
        $repository = new UserPasswordRepositoryStub();
        $repository->userShouldLoad = false;

        $action = $this->createActionWithRepository($repository);
        $response = $action->reset_password(
            $this->createRequest('POST', '/user/password/reset'),
            new Response(),
            ['email' => 'john@example.com']
        );

        self::assertSame(404, $response->getStatusCode());
    }
}

final class UserPasswordRepositoryStub
{
    public const RETURN_RECORD = 'record';

    public int $roleId = 2;
    public string $roleLabel = 'team_admin';
    public bool $verifyResult = true;
    public array $verifyCalls = [];
    public int $tokenTypeId = 99;
    public array $tokenTypeLoads = [];
    public array $tokenFindCriteria = [];
    public bool $tokenFindThrows = false;
    public mixed $tokenFindResult = self::RETURN_RECORD;
    public array $tokenLoads = [];
    public array $tokenSavePayloads = [];
    public array $userSavePayloads = [];
    public array $userLoads = [];
    public bool $userShouldLoad = true;
    public int $userId = 42;
    public array $tokenRecordData = ['user_id' => 42];
    public array $resetPasswordArgs = [];
    public array $resetPasswordReturn = ['token' => 'generated'];
    public array $userSaveReturn = ['id' => 42];
    public string $currentTimestamp;
    public PasswordTokenTypeModelStub $tokenTypeStub;

    public function __construct()
    {
        $this->currentTimestamp = date('Y-m-d H:i:s');
        $this->tokenTypeStub = new PasswordTokenTypeModelStub($this);
    }

    public function verify(string $token, ?int $typeId = null)
    {
        $this->verifyCalls[] = [$token, $typeId];
        return $this->verifyResult ? true : false;
    }

    public function getModel(string $name = 'user')
    {
        return match ($name) {
            'tokenType' => $this->tokenTypeStub,
            'token' => new PasswordTokenModelStub($this),
            'user' => new PasswordUserModelStub($this),
            'role' => new PasswordRoleModelStub($this),
            default => new PasswordUserModelStub($this),
        };
    }
}

final class PasswordTokenTypeModelStub
{
    public function __construct(private UserPasswordRepositoryStub $repository)
    {
    }

    public function load($value, $field = 'id'): self
    {
        $this->repository->tokenTypeLoads[] = [$value, $field];
        return $this;
    }

    public function getId(): int
    {
        return $this->repository->tokenTypeId;
    }
}

final class PasswordTokenModelStub
{
    public function __construct(private UserPasswordRepositoryStub $repository)
    {
    }

    public function findOne(array $criteria)
    {
        $this->repository->tokenFindCriteria[] = $criteria;
        if ($this->repository->tokenFindThrows) {
            throw new \Exception('no token found');
        }

        if ($this->repository->tokenFindResult === UserPasswordRepositoryStub::RETURN_RECORD) {
            return new PasswordTokenRecordStub($this->repository);
        }

        return $this->repository->tokenFindResult;
    }

    public function load($value, $field = 'id'): PasswordTokenRecordStub
    {
        $this->repository->tokenLoads[] = [$value, $field];
        return new PasswordTokenRecordStub($this->repository);
    }

    public function resetPassword(int $userId, PasswordTokenTypeModelStub $tokenType)
    {
        $this->repository->resetPasswordArgs[] = [$userId, $tokenType];
        return $this->repository->resetPasswordReturn;
    }
}

final class PasswordTokenRecordStub
{
    public function __construct(private UserPasswordRepositoryStub $repository)
    {
    }

    public function getData(string $key)
    {
        return $this->repository->tokenRecordData[$key] ?? null;
    }

    public function save(array $payload): self
    {
        $this->repository->tokenSavePayloads[] = $payload;
        return $this;
    }
}

final class PasswordUserModelStub
{
    public function __construct(private UserPasswordRepositoryStub $repository)
    {
    }

    public function load($value, $field = 'id'): self
    {
        $this->repository->userLoads[] = [$value, $field];
        return $this;
    }

    public function isLoaded(): bool
    {
        return $this->repository->userShouldLoad;
    }

    public function getId(): int
    {
        return $this->repository->userId;
    }

    public function save(array $payload)
    {
        $this->repository->userSavePayloads[] = $payload;
        return $this->repository->userSaveReturn;
    }

    public function getData(string $key, $default = null)
    {
        if ($key === 'type_id') {
            return $this->repository->roleId;
        }
        return $default;
    }
}

final class PasswordRoleModelStub
{
    public function __construct(private UserPasswordRepositoryStub $repository)
    {
    }

    public function load($value, $field = 'id'): self
    {
        return $this;
    }

    public function getData(string $key)
    {
        if ($key === 'label') {
            return $this->repository->roleLabel;
        }
        return null;
    }
}
