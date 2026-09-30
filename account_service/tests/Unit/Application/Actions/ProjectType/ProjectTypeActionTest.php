<?php
declare(strict_types=1);

namespace Tests\Application\Actions\ProjectType;

use App\Application\Actions\ProjectType\ProjectTypeAction;
use App\Application\Actions\Action;
use Psr\Log\LoggerInterface;
use Slim\Psr7\Response;
use Tests\TestCase;

final class ProjectTypeActionTest extends TestCase
{
    public function testGetTypesReturnsRepositoryData(): void
    {
        $repository = new ProjectTypeRepositoryStub();
        $repository->projectTypeMappings = [
            ['account_id' => 2, 'type_id' => 9],
        ];

        $action = $this->createAction($repository);
        $response = $action->getTypes(
            $this->createRequest('GET', '/v1/account/2/project-types'),
            new Response(),
            ['id' => '2']
        );

        self::assertSame(200, $response->getStatusCode());
        $payload = json_decode((string) $response->getBody(), true, 512, JSON_THROW_ON_ERROR);
        self::assertSame($repository->projectTypeMappings, $payload['data']);
    }

    public function testUpdateTypesPersistsMappings(): void
    {
        $repository = new ProjectTypeRepositoryStub();

        $action = $this->createAction($repository);
        $this->setActionData($action, [4, 7]);
        $response = $action->updateTypes(
            $this->createRequest('PATCH', '/v1/account/5/project-types'),
            new Response(),
            ['id' => '5']
        );

        self::assertSame(203, $response->getStatusCode());
        self::assertSame([[ 'account_id' => 5 ]], $repository->projectTypeDeleteCalls);
        self::assertSame(
            [
                ['account_id' => 5, 'type_id' => 4],
                ['account_id' => 5, 'type_id' => 7],
            ],
            $repository->projectTypeSaveCalls
        );
    }

    private function createAction(ProjectTypeRepositoryStub $repository): ProjectTypeActionUnderTest
    {
        $logger = $this->createMock(LoggerInterface::class);
        return new ProjectTypeActionUnderTest($logger, $repository);
    }

    private function setActionData(Action $action, array $data): void
    {
        $ref = new \ReflectionClass(Action::class);
        $prop = $ref->getProperty('data');
        $prop->setAccessible(true);
        $prop->setValue($action, $data);
    }
}

final class ProjectTypeActionUnderTest extends ProjectTypeAction
{
    public function __construct(LoggerInterface $logger, private ProjectTypeRepositoryStub $repositoryStub)
    {
        parent::__construct($logger);
        $this->repository = $repositoryStub;
    }
}

final class ProjectTypeRepositoryStub
{
    public array $projectTypeMappings = [];
    public array $projectTypeDeleteCalls = [];
    public array $projectTypeSaveCalls = [];

    public function getModel(string $name = '')
    {
        return new class($this) {
            public function __construct(private ProjectTypeRepositoryStub $repository)
            {
            }

            public function findAll(array $filters = []): array
            {
                return $this->repository->projectTypeMappings;
            }

            public function deleteWhere(array $conditions): void
            {
                $this->repository->projectTypeDeleteCalls[] = $conditions;
            }

            public function save(array $data): void
            {
                $this->repository->projectTypeSaveCalls[] = $data;
            }
        };
    }
}
