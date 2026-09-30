<?php
declare(strict_types=1);

namespace Tests\Application\Actions\Role;

use App\Application\Actions\Action;
use App\Application\Actions\Role\RoleMappingAction;
use Psr\Log\LoggerInterface;
use Slim\Psr7\Response;
use Tests\TestCase;

final class RoleMappingActionTest extends TestCase
{
    public function testUpdateRoleSavesExistingMapping(): void
    {
        $repository = new RoleMappingRepositoryStub();
        $repository->mappingLoaded = true;

        $action = $this->createAction($repository);
        $this->setActionData($action, ['role_id' => 9]);

        $response = $action->updateRole(
            $this->createRequest('PATCH', '/v1/role-mapping/2'),
            new Response(),
            ['user_id' => '2']
        );

        self::assertSame(200, $response->getStatusCode());
        $payload = json_decode((string) $response->getBody(), true, 512, JSON_THROW_ON_ERROR);
        self::assertTrue($payload['data']['success']);
        self::assertSame([[2, 'user_id']], $repository->loadCalls);
        self::assertSame(
            [
                [
                    'user_id' => 2,
                    'role_id' => 9,
                ],
            ],
            $repository->saveCalls
        );
    }

    public function testUpdateRoleRequiresIdentifiers(): void
    {
        $action = $this->createAction(new RoleMappingRepositoryStub());
        $response = $action->updateRole(
            $this->createRequest('PATCH', '/v1/role-mapping'),
            new Response(),
            []
        );

        self::assertSame(400, $response->getStatusCode());
    }

    private function createAction(RoleMappingRepositoryStub $repository): RoleMappingActionUnderTest
    {
        $logger = $this->createMock(LoggerInterface::class);
        return new RoleMappingActionUnderTest($logger, $repository);
    }

    private function setActionData(Action $action, array $data): void
    {
        $ref = new \ReflectionClass(Action::class);
        $prop = $ref->getProperty('data');
        $prop->setAccessible(true);
        $prop->setValue($action, $data);
    }
}

final class RoleMappingActionUnderTest extends RoleMappingAction
{
    public function __construct(LoggerInterface $logger, private RoleMappingRepositoryStub $repositoryStub)
    {
        parent::__construct($logger);
        $this->repository = $repositoryStub;
    }
}

final class RoleMappingRepositoryStub
{
    public bool $mappingLoaded = true;
    public array $loadCalls = [];
    public array $saveCalls = [];

    public function getModel(string $name = '')
    {
        return new RoleMappingModelStub($this);
    }
}

final class RoleMappingModelStub
{
    public function __construct(private RoleMappingRepositoryStub $repository)
    {
    }

    public function load(int $id, string $field = 'id'): RoleMappingEntityStub
    {
        $this->repository->loadCalls[] = [$id, $field];
        return new RoleMappingEntityStub($this->repository->mappingLoaded, $this->repository);
    }

    public function save(array $data): void
    {
        $this->repository->saveCalls[] = $data;
    }
}

final class RoleMappingEntityStub
{
    public function __construct(private bool $loaded, private RoleMappingRepositoryStub $repository)
    {
    }

    public function isLoaded(): bool
    {
        return $this->loaded;
    }

    public function save(array $data): void
    {
        $this->repository->saveCalls[] = $data;
    }
}
