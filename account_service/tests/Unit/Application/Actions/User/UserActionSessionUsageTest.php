<?php
declare(strict_types=1);

namespace Tests\Application\Actions\User;

use Slim\Psr7\Response;

final class UserActionSessionUsageTest extends UserActionTestCase
{
    public function testGetSessionUsageReturnsAggregatedCount(): void
    {
        $repository = new UserSessionRepositoryStub();
        $repository->verifyResult = new SessionTokenStub(['user_id' => 3, 'token_type_id' => 7]);
        $repository->sessionRecords = [
            ['token_usage' => 2],
            ['token_usage' => 5],
        ];

        $action = $this->createActionWithRepository($repository);
        $response = $action->getSessionUsage(
            $this->createRequest('GET', '/user/session/token-hash'),
            new Response(),
            ['token' => 'token-hash']
        );

        self::assertSame(200, $response->getStatusCode());
        $payload = $this->decodeResponse($response);
        self::assertSame(['total' => 7], $payload['data']);
        self::assertSame(['token-hash'], $repository->verifyCalls);
        self::assertSame(
            [
                ['user_id' => 3, 'token_type_id' => 7],
            ],
            $repository->tokenFindAllCriteria
        );
    }

    public function testGetSessionUsageReturnsUnauthorizedWhenVerificationFails(): void
    {
        $repository = new UserSessionRepositoryStub();
        $repository->verifyResult = false;

        $action = $this->createActionWithRepository($repository);
        $response = $action->getSessionUsage(
            $this->createRequest('GET', '/user/session/token-hash'),
            new Response(),
            ['token' => 'token-hash']
        );

        self::assertSame(401, $response->getStatusCode());
    }

    public function testIncrementSessionUsageReturnsOkWhenVerified(): void
    {
        $repository = new UserSessionRepositoryStub();
        $repository->verifyResult = true;

        $action = $this->createActionWithRepository($repository);
        $response = $action->incrementSessionUsage(
            $this->createRequest('POST', '/user/session/token-hash'),
            new Response(),
            ['token' => 'token-hash']
        );

        self::assertSame(200, $response->getStatusCode());
        self::assertSame(['token-hash'], $repository->verifyCalls);
        self::assertSame(['token-hash'], $repository->incrementCalls);
    }

    public function testIncrementSessionUsageReturnsNotFoundWhenVerificationFails(): void
    {
        $repository = new UserSessionRepositoryStub();
        $repository->verifyResult = false;

        $action = $this->createActionWithRepository($repository);
        $response = $action->incrementSessionUsage(
            $this->createRequest('POST', '/user/session/token-hash'),
            new Response(),
            ['token' => 'token-hash']
        );

        self::assertSame(404, $response->getStatusCode());
    }
}

final class UserSessionRepositoryStub
{
    public mixed $verifyResult = false;
    public array $verifyCalls = [];
    public array $incrementCalls = [];
    public array $sessionRecords = [];
    public array $tokenFindAllCriteria = [];

    public function verify(string $token)
    {
        $this->verifyCalls[] = $token;
        return $this->verifyResult;
    }

    public function incrementTokenUsage(string $token): void
    {
        $this->incrementCalls[] = $token;
    }

    public function getModel(string $name = 'user')
    {
        if ($name === 'token') {
            return new SessionTokenModelStub($this);
        }

        return new class {
        };
    }
}

final class SessionTokenModelStub
{
    public function __construct(private UserSessionRepositoryStub $repository)
    {
    }

    public function findAll(array $criteria): array
    {
        $this->repository->tokenFindAllCriteria[] = $criteria;
        return $this->repository->sessionRecords;
    }
}

final class SessionTokenStub
{
    public function __construct(private array $data)
    {
    }

    public function getData(string $key)
    {
        return $this->data[$key] ?? null;
    }
}
