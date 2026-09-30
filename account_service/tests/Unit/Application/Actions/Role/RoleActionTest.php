<?php
declare(strict_types=1);

namespace Tests\Application\Actions\Role;

use App\Application\Actions\Role\RoleAction;
use Psr\Log\LoggerInterface;
use Slim\Psr7\Response;
use Tests\TestCase;

final class RoleActionTest extends TestCase
{
    public function testGetRoleLevelReturnsRepositoryData(): void
    {
        $repository = new RoleRepositoryStub();
        $repository->rolesWithLevel = [
            ['id' => 1, 'level' => 10],
        ];

        $action = $this->createAction($repository);
        $response = $action->getRoleLevel(
            $this->createRequest('GET', '/v1/roles/levels'),
            new Response(),
            []
        );

        self::assertSame(200, $response->getStatusCode());
        $payload = json_decode((string) $response->getBody(), true, 512, JSON_THROW_ON_ERROR);
        self::assertSame($repository->rolesWithLevel, $payload['data']);
    }

    public function testGetRoleLevelHandlesEmptyDataset(): void
    {
        $action = $this->createAction(new RoleRepositoryStub());
        $response = $action->getRoleLevel(
            $this->createRequest('GET', '/v1/roles/levels'),
            new Response(),
            []
        );

        self::assertSame(200, $response->getStatusCode());
        $payload = json_decode((string) $response->getBody(), true, 512, JSON_THROW_ON_ERROR);
        self::assertSame([], $payload['data']);
    }

    private function createAction(RoleRepositoryStub $repository): RoleActionUnderTest
    {
        $logger = $this->createMock(LoggerInterface::class);
        return new RoleActionUnderTest($logger, $repository);
    }
}

final class RoleActionUnderTest extends RoleAction
{
    public function __construct(LoggerInterface $logger, private RoleRepositoryStub $repositoryStub)
    {
        parent::__construct($logger);
        $this->repository = $repositoryStub;
    }
}

final class RoleRepositoryStub
{
    public array $rolesWithLevel = [];

    public function getRolesWithLevel(): array
    {
        return $this->rolesWithLevel;
    }
}
