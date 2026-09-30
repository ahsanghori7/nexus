<?php
declare(strict_types=1);

namespace Tests\Application\Actions\User;

use Slim\Psr7\Response;

final class UserActionMetaTest extends UserActionTestCase
{
    public function testUpdateMetaMergesExistingMetadataWhenTokenLoaded(): void
    {
        $repository = new UserMetaRepositoryStub();
        $repository->existingMeta = ['existing' => true, 'overridden' => 'old'];

        $action = $this->createActionWithRepository($repository);
        $this->setActionData($action, ['overridden' => 'new', 'added' => 'value']);

        $response = $action->updateMeta(
            $this->createRequest('PATCH', '/user/token/meta'),
            new Response(),
            ['token' => 'abc']
        );

        self::assertSame(203, $response->getStatusCode());
        self::assertSame([['abc', 'token']], $repository->loadCalls);
        self::assertCount(1, $repository->savedPayloads);

        $savedMeta = json_decode($repository->savedPayloads[0]['meta'], true, 512, JSON_THROW_ON_ERROR);
        self::assertSame(
            ['existing' => true, 'overridden' => 'new', 'added' => 'value'],
            $savedMeta
        );
    }

    public function testUpdateMetaInitialisesEmptyArrayWhenMetaMissing(): void
    {
        $repository = new UserMetaRepositoryStub();
        $repository->existingMeta = null;

        $action = $this->createActionWithRepository($repository);
        $this->setActionData($action, ['flag' => 'set']);

        $response = $action->updateMeta(
            $this->createRequest('PATCH', '/user/token/meta'),
            new Response(),
            ['token' => 'abc']
        );

        self::assertSame(203, $response->getStatusCode());
        $savedMeta = json_decode($repository->savedPayloads[0]['meta'], true, 512, JSON_THROW_ON_ERROR);
        self::assertSame(['flag' => 'set'], $savedMeta);
    }

    public function testUpdateMetaReturnsNotFoundWhenTokenMissing(): void
    {
        $repository = new UserMetaRepositoryStub();
        $repository->tokenShouldLoad = false;

        $action = $this->createActionWithRepository($repository);
        $this->setActionData($action, ['flag' => 'set']);

        $response = $action->updateMeta(
            $this->createRequest('PATCH', '/user/token/meta'),
            new Response(),
            ['token' => 'missing']
        );

        self::assertSame(404, $response->getStatusCode());
        self::assertSame([['missing', 'token']], $repository->loadCalls);
        self::assertEmpty($repository->savedPayloads);
    }
}

final class UserMetaRepositoryStub
{
    public bool $tokenShouldLoad = true;
    public array $loadCalls = [];
    public array $savedPayloads = [];
    public ?array $existingMeta = [];

    public function getModel(string $name = 'user')
    {
        if ($name === 'token') {
            return new UserMetaTokenModelStub($this);
        }

        return new class {
        };
    }
}

final class UserMetaTokenModelStub
{
    public function __construct(private UserMetaRepositoryStub $repository)
    {
    }

    public function load($value, $field = 'id'): UserMetaTokenRecordStub
    {
        $this->repository->loadCalls[] = [$value, $field];
        return new UserMetaTokenRecordStub($this->repository);
    }
}

final class UserMetaTokenRecordStub
{
    public function __construct(private UserMetaRepositoryStub $repository)
    {
    }

    public function isLoaded(): bool
    {
        return $this->repository->tokenShouldLoad;
    }

    public function getMeta(): ?array
    {
        return $this->repository->existingMeta;
    }

    public function save(array $payload): void
    {
        $this->repository->savedPayloads[] = $payload;
    }
}
