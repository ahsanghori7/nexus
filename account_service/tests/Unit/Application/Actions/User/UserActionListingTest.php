<?php
declare(strict_types=1);

namespace Tests\Application\Actions\User;

use Slim\Psr7\Response;

final class UserActionListingTest extends UserActionTestCase
{
    public function testListUsersByAccountIdReturnsRepositoryResult(): void
    {
        $repository = new UserListingRepositoryStub();
        $repository->usersByAccountId = [
            ['id' => 7, 'account_id' => 4],
            ['id' => 8, 'account_id' => 4],
        ];

        $action = $this->createActionWithRepository($repository);
        $response = $action->listUsersByAccountId(
            $this->createRequest('GET', '/user/accounts/[4]'),
            new Response(),
            ['ids' => '[4]']
        );

        self::assertSame(200, $response->getStatusCode());
        $payload = $this->decodeResponse($response);
        self::assertSame($repository->usersByAccountId, $payload['data']);
        self::assertSame([[['4'], 'account_id']], $repository->listCalls);
    }

    public function testListUsersByIdReturnsRepositoryResult(): void
    {
        $repository = new UserListingRepositoryStub();
        $repository->usersById = [
            ['id' => 7],
        ];

        $action = $this->createActionWithRepository($repository);
        $response = $action->listUsersById(
            $this->createRequest('GET', '/user/[7]'),
            new Response(),
            ['ids' => '[7]']
        );

        self::assertSame(200, $response->getStatusCode());
        $payload = $this->decodeResponse($response);
        self::assertSame($repository->usersById, $payload['data']);
        self::assertSame([[['7'], 'id']], $repository->listCalls);
    }

    public function testListUsersByIdReturnsEmptyArrayWhenRepositoryFindsNone(): void
    {
        $repository = new UserListingRepositoryStub();

        $action = $this->createActionWithRepository($repository);
        $response = $action->listUsersById(
            $this->createRequest('GET', '/user/[]'),
            new Response(),
            ['ids' => '[]']
        );

        self::assertSame(200, $response->getStatusCode());
        $payload = $this->decodeResponse($response);
        self::assertSame([], $payload['data']);
        self::assertSame([[[''], 'id']], $repository->listCalls);
    }

    public function testListUsersByIdPreservesDuplicateIdentifiersInOrder(): void
    {
        $repository = new UserListingRepositoryStub();
        $repository->usersById = [
            ['id' => 1],
            ['id' => 1],
            ['id' => 2],
        ];

        $action = $this->createActionWithRepository($repository);
        $response = $action->listUsersById(
            $this->createRequest('GET', '/user/[1,1,2]'),
            new Response(),
            ['ids' => '[1,1,2]']
        );

        self::assertSame(200, $response->getStatusCode());
        $payload = $this->decodeResponse($response);
        self::assertSame($repository->usersById, $payload['data']);
        self::assertSame([[['1', '1', '2'], 'id']], $repository->listCalls);
    }

    public function testListUsersByFieldReturnsEmptyArrayWhenNothingMatches(): void
    {
        $repository = new UserListingRepositoryStub();
        $repository->whereLikeResult = [];

        $action = $this->createActionWithRepository($repository);
        $request = $this->createRequest('GET', '/user/search')
            ->withQueryParams(['field' => 'email', 'value' => 'nothing@example.com']);

        $response = $action->listUsersByField($request, new Response(), []);

        self::assertSame(200, $response->getStatusCode());
        $payload = $this->decodeResponse($response);
        self::assertSame([], $payload['data']);
        self::assertSame([['email', 'nothing@example.com']], $repository->whereLikeCalls);
    }
}

final class UserListingRepositoryStub
{
    public array $usersByAccountId = [];
    public array $usersById = [];
    public array $listCalls = [];
    public array $whereLikeResult = [];
    public array $whereLikeCalls = [];
    public array $modelLoads = [];
    public bool $userShouldLoad = false;
    public array $userData = [
        'id' => 1,
        'firstname' => 'Jane',
        'lastname' => 'Doe',
        'password' => 'secret',
    ];
    public array $accountData = ['id' => 10, 'name' => 'Acme'];

    public function getUsersByArray(array $ids, string $field = 'id'): array
    {
        $this->listCalls[] = [$ids, $field];
        return $field === 'account_id' ? $this->usersByAccountId : $this->usersById;
    }

    public function getModel(string $name = 'user')
    {
        return new ListingUserModelStub($this);
    }
}

final class ListingUserModelStub
{
    public function __construct(private UserListingRepositoryStub $repository)
    {
    }

    public function getWhereLike(string $field, string $value): array
    {
        $this->repository->whereLikeCalls[] = [$field, $value];
        return $this->repository->whereLikeResult;
    }

    public function load($id, $field = 'id'): self
    {
        $this->repository->modelLoads[] = [$id, $field];
        $this->repository->userShouldLoad = true;
        return $this;
    }

    public function getAccount(): ListingAccountModelStub
    {
        return new ListingAccountModelStub($this->repository);
    }

    public function getData(string $key = null)
    {
        $data = $this->repository->userData;
        return $key ? $data[$key] ?? null : $data;
    }
}

final class ListingAccountModelStub
{
    public function __construct(private UserListingRepositoryStub $repository)
    {
    }

    public function getData(): array
    {
        return $this->repository->accountData;
    }
}
