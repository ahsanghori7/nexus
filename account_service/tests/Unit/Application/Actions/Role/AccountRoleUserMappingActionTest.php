<?php

declare(strict_types=1);

namespace Tests\Unit\Application\Actions\Role;

use App\Application\Actions\Role\AccountRoleUserMappingAction;
use PHPUnit\Framework\TestCase;
use Psr\Http\Message\ServerRequestInterface;
use Psr\Http\Message\ResponseInterface;
use Psr\Http\Message\StreamInterface;
use Psr\Log\LoggerInterface;

class AccountRoleUserMappingActionTest extends TestCase
{
    private function makeLogger(): LoggerInterface
    {
        return $this->createMock(LoggerInterface::class);
    }

    private function makeRequest(array $body): ServerRequestInterface
    {
        $stream = $this->createMock(StreamInterface::class);
        $stream->method('getContents')
            ->willReturn(json_encode($body));

        $request = $this->createMock(ServerRequestInterface::class);
        $request->method('getBody')
            ->willReturn($stream);

        return $request;
    }

    private function makeResponse(): ResponseInterface
    {
        $stream = $this->createMock(StreamInterface::class);
        $stream->method('write')->willReturn(1);

        $response = $this->createMock(ResponseInterface::class);
        $response->method('getBody')->willReturn($stream);
        $response->method('withHeader')->willReturnSelf();

        return $response;
    }

    public function testUpdateAccountRoleActionSuccess(): void
    {
        $logger = $this->makeLogger();

        $action = new class($logger) extends AccountRoleUserMappingAction {
            public function __construct($logger)
            {
                parent::__construct($logger);

                $this->repository = new class {
                    public function updateAccountRoleMapping($userId, $roleId)
                    {
                        return true;
                    }
                };
            }
        };

        $request = $this->makeRequest([
            'role_id' => 2
        ]);

        $response = $this->makeResponse();

        $result = $action->updateAccountRoleAction($request, $response, [
            'user_id' => 10
        ]);

        $this->assertInstanceOf(ResponseInterface::class, $result);
    }

    public function testUpdateAccountRoleActionBadRequest(): void
    {
        $logger = $this->makeLogger();

        $action = new AccountRoleUserMappingAction($logger);

        $request = $this->makeRequest([
            'role_id' => 0
        ]);
        $response = $this->makeResponse();

        $result = $action->updateAccountRoleAction($request, $response, [
            'user_id' => 10
        ]);

        $this->assertInstanceOf(ResponseInterface::class, $result);
    }

    public function testDeleteAccountRoleActionSuccess(): void
    {
        $logger = $this->makeLogger();

        $action = new class($logger) extends AccountRoleUserMappingAction {
            public function __construct($logger)
            {
                parent::__construct($logger);

                $this->repository = new class {
                    public function deleteAccountRoleMapping($userId)
                    {
                        return true;
                    }
                };
            }
        };

        $request = $this->makeRequest([]);
        $response = $this->makeResponse();

        $result = $action->deleteAccountRoleAction($request, $response, [
            'user_id' => 5
        ]);

        $this->assertInstanceOf(ResponseInterface::class, $result);
    }

    public function testDeleteAccountRoleActionBadRequest(): void
    {
        $logger = $this->makeLogger();

        $action = new AccountRoleUserMappingAction($logger);

        $request = $this->makeRequest([]);
        $response = $this->makeResponse();

        $result = $action->deleteAccountRoleAction($request, $response, [
            'user_id' => 0
        ]);

        $this->assertInstanceOf(ResponseInterface::class, $result);
    }
}
