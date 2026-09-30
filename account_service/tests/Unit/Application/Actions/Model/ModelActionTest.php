<?php
declare(strict_types=1);

namespace Tests\Application\Actions\Model;

use App\Application\Actions\Model\ModelAction;
use Psr\Log\LoggerInterface;
use Slim\Psr7\Response;
use Tests\TestCase;

final class ModelActionTest extends TestCase
{
    public function testDescribeReturnsFieldsForKnownResource(): void
    {
        $resource = new ModelResourceStub(['id' => 'int', 'name' => 'string']);

        $action = $this->createAction(['account' => $resource]);
        $response = $action->describe(
            $this->createRequest('GET', '/v1/model/account'),
            new Response(),
            ['resource' => 'account']
        );

        self::assertSame(200, $response->getStatusCode());
        $payload = json_decode((string) $response->getBody(), true, 512, JSON_THROW_ON_ERROR);
        self::assertSame(['fields' => ['id' => 'int', 'name' => 'string']], $payload['data']);
    }

    public function testDescribeReturnsNotFoundForUnknownResource(): void
    {
        $action = $this->createAction(['account' => new ModelResourceStub([])]);
        $response = $action->describe(
            $this->createRequest('GET', '/v1/model/project'),
            new Response(),
            ['resource' => 'project']
        );

        self::assertSame(404, $response->getStatusCode());
    }

    public function testDescribeReturnsNotFoundWhenRepositoryThrows(): void
    {
        $action = $this->createAction(['account' => new ModelResourceStub([], true)]);
        $response = $action->describe(
            $this->createRequest('GET', '/v1/model/account'),
            new Response(),
            ['resource' => 'account']
        );

        self::assertSame(404, $response->getStatusCode());
    }

    private function createAction(array $resources): ModelActionUnderTest
    {
        $logger = $this->createMock(LoggerInterface::class);
        return new ModelActionUnderTest($logger, $resources);
    }
}

final class ModelActionUnderTest extends ModelAction
{
    /**
     * @param array<string,ModelResourceStub> $resources
     */
    public function __construct(LoggerInterface $logger, array $resources)
    {
        parent::__construct($logger);
        $this->resources = $resources;
    }
}

final class ModelResourceStub
{
    public function __construct(private array $columns, private bool $throwOnGet = false)
    {
    }

    public function getModel(string $name)
    {
        if ($this->throwOnGet) {
            throw new \Exception('missing');
        }
        return new class($this->columns) {
            public function __construct(private array $columns)
            {
            }

            public function getColumns(): array
            {
                return $this->columns;
            }
        };
    }
}
