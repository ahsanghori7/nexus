<?php

declare(strict_types=1);

namespace Tests\Unit\Action;

use App\Application\Actions\AccountGroupProjectMapping\AccountGroupProjectMappingAction;
use App\Domain\AccountGroupProjectMapping\AccountGroupProjectMappingRepository;
use PHPUnit\Framework\TestCase;
use Psr\Log\LoggerInterface;
use Slim\Psr7\Factory\ServerRequestFactory;
use Slim\Psr7\Factory\ResponseFactory;

class AccountGroupProjectMappingActionTest extends TestCase
{
    private function getLoggerMock(): LoggerInterface
    {
        return $this->createMock(LoggerInterface::class);
    }

    public function testGetAllBadRequest(): void
    {
        $repo = $this->createMock(AccountGroupProjectMappingRepository::class);

        $action = new AccountGroupProjectMappingAction(
            $this->getLoggerMock(),
            $repo
        );

        $request = (new ServerRequestFactory())->createServerRequest('GET', '/');
        $response = (new ResponseFactory())->createResponse();

        $result = $action->getAll($request, $response, ['project_id' => 0]);

        $this->assertEquals(400, $result->getStatusCode());
    }

    public function testGetAllSuccess(): void
    {
        $repo = $this->createMock(AccountGroupProjectMappingRepository::class);
        $repo->method('getByProjectId')->willReturn([['id' => 1]]);

        $action = new AccountGroupProjectMappingAction(
            $this->getLoggerMock(),
            $repo
        );

        $request = (new ServerRequestFactory())->createServerRequest('GET', '/');
        $response = (new ResponseFactory())->createResponse();

        $result = $action->getAll($request, $response, ['project_id' => 1]);

        $this->assertEquals(200, $result->getStatusCode());
    }

    public function testDeleteAllByProject(): void
    {
        $repo = $this->createMock(AccountGroupProjectMappingRepository::class);
        $repo->expects($this->once())->method('deleteByProjectId')->with(1);

        $action = new AccountGroupProjectMappingAction(
            $this->getLoggerMock(),
            $repo
        );

        $request = (new ServerRequestFactory())->createServerRequest('DELETE', '/');
        $response = (new ResponseFactory())->createResponse();

        $result = $action->deleteAllByProject($request, $response, ['project_id' => 1]);

        $this->assertEquals(200, $result->getStatusCode());
    }

    public function testDeleteAllByProjectBadRequestWhenProjectIdIsZero(): void
    {
        $repo = $this->createMock(AccountGroupProjectMappingRepository::class);
        $repo->expects($this->never())->method('deleteByProjectId');

        $action = new AccountGroupProjectMappingAction(
            $this->getLoggerMock(),
            $repo
        );

        $request = (new ServerRequestFactory())->createServerRequest('DELETE', '/');
        $response = (new ResponseFactory())->createResponse();

        $result = $action->deleteAllByProject($request, $response, ['project_id' => 0]);

        $this->assertEquals(400, $result->getStatusCode());
    }

    public function testCreateMappingBadRequestWhenProjectIdIsZero(): void
    {
        $repo = $this->createMock(AccountGroupProjectMappingRepository::class);

        $action = $this->getMockBuilder(AccountGroupProjectMappingAction::class)
            ->setConstructorArgs([$this->getLoggerMock(), $repo])
            ->onlyMethods(['getData'])
            ->getMock();

        $action->method('getData')->willReturn(['account_group_id' => [10]]);

        $request = (new ServerRequestFactory())->createServerRequest('POST', '/');
        $response = (new ResponseFactory())->createResponse();

        $result = $action->createAccountGroupProjectMapping($request, $response, ['project_id' => 0]);

        $this->assertEquals(400, $result->getStatusCode());
    }

    public function testCreateMappingBadRequestWhenAccountGroupIdNotAnArray(): void
    {
        $repo = $this->createMock(AccountGroupProjectMappingRepository::class);

        $action = $this->getMockBuilder(AccountGroupProjectMappingAction::class)
            ->setConstructorArgs([$this->getLoggerMock(), $repo])
            ->onlyMethods(['getData'])
            ->getMock();

        $action->method('getData')->willReturn(['account_group_id' => 'not-an-array']);

        $request = (new ServerRequestFactory())->createServerRequest('POST', '/');
        $response = (new ResponseFactory())->createResponse();

        $result = $action->createAccountGroupProjectMapping($request, $response, ['project_id' => 1]);

        $this->assertEquals(400, $result->getStatusCode());
    }

    public function testCreateMappingSuccessDoesNotIncludeIdWhenRowHasNone(): void
    {
        $repo = $this->createMock(AccountGroupProjectMappingRepository::class);

        $modelMock = new class {
            public function create(array $data): object
            {
                return (object)[];
            }
        };

        $repo->method('getModel')->willReturn($modelMock);

        $action = $this->getMockBuilder(AccountGroupProjectMappingAction::class)
            ->setConstructorArgs([$this->getLoggerMock(), $repo])
            ->onlyMethods(['getData'])
            ->getMock();

        $action->method('getData')->willReturn(['account_group_id' => [10]]);

        $request = (new ServerRequestFactory())->createServerRequest('POST', '/');
        $response = (new ResponseFactory())->createResponse();

        $result = $action->createAccountGroupProjectMapping($request, $response, ['project_id' => 1]);

        $this->assertEquals(201, $result->getStatusCode());
        $body = json_decode((string) $result->getBody(), true);
        $this->assertFalse($body['data']['success']);
        $this->assertSame([], $body['data']['ids']);
    }

    public function testCreateMappingBadRequest(): void
    {
        $repo = $this->createMock(AccountGroupProjectMappingRepository::class);

        $action = $this->getMockBuilder(AccountGroupProjectMappingAction::class)
            ->setConstructorArgs([$this->getLoggerMock(), $repo])
            ->onlyMethods(['getData'])
            ->getMock();

        $action->method('getData')->willReturn([]);

        $request = (new ServerRequestFactory())->createServerRequest('POST', '/');
        $response = (new ResponseFactory())->createResponse();

        $result = $action->createAccountGroupProjectMapping($request, $response, ['project_id' => 1]);

        $this->assertEquals(400, $result->getStatusCode());
    }

    public function testCreateMappingSuccess(): void
    {
        $repo = $this->createMock(AccountGroupProjectMappingRepository::class);

        $modelMock = new class {
            public function create(array $data)
            {
                return (object)['id' => 1];
            }
        };

        $repo->method('getModel')->willReturn($modelMock);

        $action = $this->getMockBuilder(AccountGroupProjectMappingAction::class)
            ->setConstructorArgs([$this->getLoggerMock(), $repo])
            ->onlyMethods(['getData'])
            ->getMock();

        $action->method('getData')->willReturn([
            'account_group_id' => [10, 20]
        ]);

        $request = (new ServerRequestFactory())->createServerRequest('POST', '/');
        $response = (new ResponseFactory())->createResponse();

        $result = $action->createAccountGroupProjectMapping($request, $response, ['project_id' => 1]);

        $this->assertEquals(201, $result->getStatusCode());
    }
}
