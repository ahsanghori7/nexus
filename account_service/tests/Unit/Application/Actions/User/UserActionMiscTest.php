<?php
declare(strict_types=1);

namespace Tests\Application\Actions\User;

use Slim\Psr7\Response;

final class UserActionMiscTest extends UserActionTestCase
{
    public function testRenewReturnsTokenPayloadWhenRenewSucceeds(): void
    {
        $repository = new UserMiscRepositoryStub();
        $repository->verifyResult = true;
        $repository->renewShouldSucceed = true;

        $action = $this->createActionWithRepository($repository);
        $response = $action->renew(
            $this->createRequest('POST', '/user/token/renew'),
            new Response(),
            ['token' => 'hash']
        );

        self::assertSame(200, $response->getStatusCode());
        $payload = $this->decodeResponse($response);
        self::assertSame(['renewed' => true], $payload['data']);
        self::assertSame(['hash'], $repository->verifyCalls);
        self::assertSame([['hash', 'token']], $repository->tokenLoads);
    }

    public function testRenewReturnsUnauthorizedWhenVerificationFails(): void
    {
        $repository = new UserMiscRepositoryStub();
        $repository->verifyResult = false;

        $action = $this->createActionWithRepository($repository);
        $response = $action->renew(
            $this->createRequest('POST', '/user/token/renew'),
            new Response(),
            ['token' => 'hash']
        );

        self::assertSame(401, $response->getStatusCode());
    }

    public function testRenewReturnsUnauthorizedWhenRenewFails(): void
    {
        $repository = new UserMiscRepositoryStub();
        $repository->verifyResult = true;
        $repository->renewShouldSucceed = false;

        $action = $this->createActionWithRepository($repository);
        $response = $action->renew(
            $this->createRequest('POST', '/user/token/renew'),
            new Response(),
            ['token' => 'hash']
        );

        self::assertSame(401, $response->getStatusCode());
    }

    public function testCheckPasswordReturnsValidationOutcome(): void
    {
        $repository = new UserMiscRepositoryStub();
        $repository->validatePasswordResult = false;

        $action = $this->createActionWithRepository($repository);
        $request = $this->createRequest('GET', '/user/password/check')
            ->withQueryParams(['uid' => '7', 'password' => 'secret']);

        $response = $action->checkPassword($request, new Response(), []);

        self::assertSame(200, $response->getStatusCode());
        $payload = $this->decodeResponse($response);
        self::assertSame(['success' => false], $payload['data']);
        self::assertSame([[7, 'id']], $repository->userLoadCalls);
        self::assertSame(['secret'], $repository->userValidateCalls);
    }

    public function testListTypesReturnsRoleCollection(): void
    {
        $repository = new UserMiscRepositoryStub();
        $repository->roleTypes = [
            ['id' => 1, 'label' => 'Admin'],
        ];

        $action = $this->createActionWithRepository($repository);
        $response = $action->listTypes(
            $this->createRequest('GET', '/user/types'),
            new Response(),
            []
        );

        self::assertSame(200, $response->getStatusCode());
        $payload = $this->decodeResponse($response);
        self::assertSame($repository->roleTypes, $payload['data']);
    }

    public function testCreateAutoLoaderTokenPersistsWhenModelsLoad(): void
    {
        $repository = new UserMiscRepositoryStub();
        $repository->tokenTypeShouldLoad = true;
        $repository->userShouldLoad = true;
        $repository->tokenSaveReturn = ['id' => 99];

        $action = $this->createActionWithRepository($repository);
        $response = $action->createAutoLoaderToken(
            $this->createRequest('POST', '/user/5/autoloader'),
            new Response(),
            ['id' => 5]
        );

        self::assertSame(200, $response->getStatusCode());
        $payload = $this->decodeResponse($response);
        self::assertSame(['id' => 99], $payload['data']);
        self::assertSame([['auto_loader', 'label']], $repository->tokenTypeLoads);
        self::assertSame([[5, 'id']], $repository->userLoadCalls);
        $saved = $repository->tokenSavePayloads[0];
        self::assertSame(5, $saved['user_id']);
        self::assertSame($repository->tokenTypeId, $saved['token_type_id']);
        self::assertArrayHasKey('created_at', $saved);
    }

    public function testCreateAutoLoaderTokenReturnsNotFoundWhenUserMissing(): void
    {
        $repository = new UserMiscRepositoryStub();
        $repository->tokenTypeShouldLoad = true;
        $repository->userShouldLoad = false;

        $action = $this->createActionWithRepository($repository);
        $response = $action->createAutoLoaderToken(
            $this->createRequest('POST', '/user/5/autoloader'),
            new Response(),
            ['id' => 5]
        );

        self::assertSame(404, $response->getStatusCode());
    }

    public function testCreateAutoLoaderTokenReturnsNotFoundWhenTokenTypeMissing(): void
    {
        $repository = new UserMiscRepositoryStub();
        $repository->tokenTypeShouldLoad = false;
        $repository->userShouldLoad = true;

        $action = $this->createActionWithRepository($repository);
        $response = $action->createAutoLoaderToken(
            $this->createRequest('POST', '/user/5/autoloader'),
            new Response(),
            ['id' => 5]
        );

        self::assertSame(404, $response->getStatusCode());
    }

    public function testGetEngagementReturnsTokenActivity(): void
    {
        $repository = new UserMiscRepositoryStub();
        $repository->engagementRecords = [
            ['id' => 10, 'token_usage' => 3],
        ];

        $action = $this->createActionWithRepository($repository);
        $response = $action->getEngagement(
            $this->createRequest('GET', '/user/5/engagement'),
            new Response(),
            ['id' => 5]
        );

        self::assertSame(200, $response->getStatusCode());
        $payload = $this->decodeResponse($response);
        self::assertSame($repository->engagementRecords, $payload['data']);
        self::assertSame([[['user_id' => 5]]], $repository->tokenAllCriteria);
    }

    public function testGetUserActionTypesReturnsConfiguredTypes(): void
    {
        $repository = new UserMiscRepositoryStub();
        $repository->userActionTypes = ['typeA', 'typeB'];

        $action = $this->createActionWithRepository($repository);
        $response = $action->getUserActionTypes(
            $this->createRequest('GET', '/user/action-types'),
            new Response(),
            []
        );

        self::assertSame(200, $response->getStatusCode());
        $payload = $this->decodeResponse($response);
        self::assertSame($repository->userActionTypes, $payload['data']);
    }
}

final class UserMiscRepositoryStub
{
    public mixed $verifyResult = true;
    public array $verifyCalls = [];
    public bool $renewShouldSucceed = true;
    public array $tokenLoads = [];
    public array $tokenRenewCalls = [];
    public bool $tokenTypeShouldLoad = true;
    public bool $userShouldLoad = true;
    public array $tokenTypeLoads = [];
    public array $userLoadCalls = [];
    public array $userValidateCalls = [];
    public bool $validatePasswordResult = true;
    public array $roleTypes = [];
    public array $tokenSavePayloads = [];
    public array $engagementRecords = [];
    public array $tokenAllCriteria = [];
    public array $userActionTypes = [];
    public array $tokenSaveReturn = ['id' => 1];
    public int $tokenTypeId = 77;

    public function verify(string $token)
    {
        $this->verifyCalls[] = $token;
        return $this->verifyResult;
    }

    public function getModel(string $name = 'user')
    {
        return match ($name) {
            'token' => new MiscTokenModelStub($this),
            'tokenType' => new MiscTokenTypeModelStub($this),
            'user' => new MiscUserModelStub($this),
            'role' => new MiscRoleModelStub($this),
            'userActionTypes' => new MiscUserActionTypesModelStub($this),
            default => new MiscUserModelStub($this),
        };
    }
}

final class MiscTokenModelStub
{
    public function __construct(private UserMiscRepositoryStub $repository)
    {
    }

    public function load($value, $field = 'id'): MiscRenewableTokenStub
    {
        $this->repository->tokenLoads[] = [$value, $field];
        return new MiscRenewableTokenStub($this->repository);
    }

    public function save(array $payload)
    {
        $this->repository->tokenSavePayloads[] = $payload;
        return $this->repository->tokenSaveReturn;
    }

    public function all(array $criteria): array
    {
        $this->repository->tokenAllCriteria[] = [$criteria];
        return $this->repository->engagementRecords;
    }
}

final class MiscRenewableTokenStub implements \JsonSerializable
{
    public function __construct(private UserMiscRepositoryStub $repository)
    {
    }

    public function renew(): bool
    {
        $this->repository->tokenRenewCalls[] = true;
        return $this->repository->renewShouldSucceed;
    }

    public function jsonSerialize(): mixed
    {
        return ['renewed' => true];
    }
}

final class MiscTokenTypeModelStub
{
    public function __construct(private UserMiscRepositoryStub $repository)
    {
    }

    public function load($value, $field = 'id'): self
    {
        $this->repository->tokenTypeLoads[] = [$value, $field];
        return $this;
    }

    public function isLoaded(): bool
    {
        return $this->repository->tokenTypeShouldLoad;
    }

    public function getId(): int
    {
        return $this->repository->tokenTypeId;
    }
}

final class MiscUserModelStub
{
    public function __construct(private UserMiscRepositoryStub $repository)
    {
    }

    public function load($value, $field = 'id'): self
    {
        $id = (int) $value;
        $this->repository->userLoadCalls[] = [$id, $field];
        return $this;
    }

    public function isLoaded(): bool
    {
        return $this->repository->userShouldLoad;
    }

    public function validatePassword(string $password): bool
    {
        $this->repository->userValidateCalls[] = $password;
        return $this->repository->validatePasswordResult;
    }
}

final class MiscRoleModelStub
{
    public function __construct(private UserMiscRepositoryStub $repository)
    {
    }

    public function findAll(): array
    {
        return $this->repository->roleTypes;
    }
}

final class MiscUserActionTypesModelStub
{
    public function __construct(private UserMiscRepositoryStub $repository)
    {
    }

    public function all(): array
    {
        return $this->repository->userActionTypes;
    }
}
