<?php
declare(strict_types=1);

namespace Tests\Application\Actions\User;

use App\Application\Actions\User\UserAction;
use Psr\Log\LoggerInterface;
use Slim\Psr7\Response;
use Tests\TestCase;

final class UserActionExtendedTest extends TestCase
{
    public function testListUsersByFieldValidatesMissingParameters(): void
    {
        $action = $this->createActionWithRepository(new UserRepositoryStub());
        $response = $action->listUsersByField(
            $this->createRequest('GET', '/user/search'),
            new Response(),
            []
        );

        self::assertSame(400, $response->getStatusCode());
        $payload = json_decode((string) $response->getBody(), true);
        self::assertSame(['missing_field' => ['field', 'value']], $payload['message']);
    }

    #[\PHPUnit\Framework\Attributes\DataProvider('missingParameterProvider')]
    public function testListUsersByFieldReturnsBadRequestWhenSpecificParameterMissing(array $query, array $expected): void
    {
        $action = $this->createActionWithRepository(new UserRepositoryStub());
        $request = $this->createRequest('GET', '/user/search')->withQueryParams($query);

        $response = $action->listUsersByField($request, new Response(), []);

        self::assertSame(400, $response->getStatusCode());
        $payload = json_decode((string) $response->getBody(), true);
        self::assertSame(['missing_field' => $expected], $payload['message']);
    }

    public static function missingParameterProvider(): iterable
    {
        yield 'missing field' => [['value' => 'foo'], ['field']];
        yield 'missing value' => [['field' => 'email'], ['value']];
    }

    public function testListUsersByFieldReturnsExpandedUserData(): void
    {
        $repository = new UserRepositoryStub();
        $repository->userShouldLoad = true;

        $action = $this->createActionWithRepository($repository);
        $request = $this->createRequest('GET', '/user/search')
            ->withQueryParams(['field' => 'email', 'value' => 'foo@example.com']);
        $response = $action->listUsersByField($request, new Response(), []);

        self::assertSame(200, $response->getStatusCode());
        $payload = json_decode((string) $response->getBody(), true);
        self::assertSame('Foo', $payload['data']['firstname']);
        self::assertSame('Acme Ltd', $payload['data']['account']['name']);
        self::assertArrayNotHasKey('password', $payload['data']);
    }

    public function testUpdateByUserIdSavesWhenModelIsLoaded(): void
    {
        $repository = new UserRepositoryStub();
        $repository->userShouldLoad = true;

        $action = $this->createActionWithRepository($repository);
        $this->setActionData($action, ['firstname' => 'Updated']);

        $response = $action->updateByUserId(
            $this->createRequest('PUT', '/user/9'),
            new Response(),
            ['uid' => 9]
        );

        self::assertSame(203, $response->getStatusCode());
        self::assertSame([['firstname' => 'Updated']], $repository->savedPayloads);
    }

    public function testUpdateByUserIdReturnsNotFoundWhenModelMissing(): void
    {
        $repository = new UserRepositoryStub();
        $repository->userShouldLoad = false;

        $action = $this->createActionWithRepository($repository);
        $response = $action->updateByUserId(
            $this->createRequest('PUT', '/user/9'),
            new Response(),
            ['uid' => 9]
        );

        self::assertSame(404, $response->getStatusCode());
    }

    private function createActionWithRepository(UserRepositoryStub $repository): UserAction
    {
        $logger = $this->createMock(LoggerInterface::class);
        $action = new UserAction($logger);
        $this->injectRepository($action, $repository);
        return $action;
    }

    private function injectRepository(object $action, object $repository): void
    {
        $ref = new \ReflectionClass($action);
        $prop = $ref->getParentClass()->getProperty('repository');
        $prop->setAccessible(true);
        $prop->setValue($action, $repository);
    }

    private function setActionData(UserAction $action, array $data): void
    {
        $ref = new \ReflectionClass($action);
        $prop = $ref->getParentClass()->getProperty('data');
        $prop->setAccessible(true);
        $prop->setValue($action, $data);
    }
}

final class UserRepositoryStub
{
    public bool $userShouldLoad = false;
    public array $savedPayloads = [];

    public function getModel()
    {
        return new UserModelStub($this);
    }

    public function getUsersByArray(array $ids, string $field = 'id'): array
    {
        return [];
    }
}

final class UserModelStub
{
    public function __construct(private UserRepositoryStub $repo)
    {
    }

    public function getWhereLike(string $field, string $value): array
    {
        return [['id' => 1]];
    }

    public function load($id, $field = 'id'): self
    {
        return $this;
    }

    public function isLoaded(): bool
    {
        return $this->repo->userShouldLoad;
    }

    public function getData(string $key = null)
    {
        $data = [
            'id' => 1,
            'firstname' => 'Foo',
            'lastname' => 'Bar',
            'email' => 'foo@example.com',
            'password' => 'should-not-leak',
        ];

        return $key ? $data[$key] ?? null : $data;
    }

    public function getAccount(): AccountModelStub
    {
        return new AccountModelStub();
    }

    public function save(array $payload): self
    {
        $this->repo->savedPayloads[] = $payload;
        return $this;
    }
}

final class AccountModelStub
{
    public function getData(): array
    {
        return [
            'id' => 50,
            'name' => 'Acme Ltd',
        ];
    }
}
