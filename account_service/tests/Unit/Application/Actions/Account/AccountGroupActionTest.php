<?php
declare(strict_types=1);

namespace Tests\Application\Actions\Account;

use App\Application\Actions\Account\AccountGroupAction;
use App\Domain\Account\AccountGroupRepository;
use Psr\Log\LoggerInterface;
use Slim\Psr7\Factory\ResponseFactory;
use Slim\Psr7\Factory\ServerRequestFactory;
use Tests\TestCase;

final class AccountGroupActionTest extends TestCase
{
    private $logger;
    private $repoMock;

    protected function setUp(): void
    {
        parent::setUp();
        $this->logger = $this->createMock(LoggerInterface::class);
        $this->repoMock = $this->createMock(AccountGroupRepository::class);
    }

    /**
     * Helper to inject mocks and MANUAL DATA into the Action
     * This bypasses the php://input limitation in CLI
     */
    private function getActionWithMock(array $requestData = []): AccountGroupAction
    {
        $action = new AccountGroupAction($this->logger);
        $reflection = new \ReflectionClass(AccountGroupAction::class);

        // 1. Inject Repository Mock
        $repoProp = $reflection->hasProperty('repository')
            ? $reflection->getProperty('repository')
            : $reflection->getParentClass()->getProperty('repository');
        $repoProp->setAccessible(true);
        $repoProp->setValue($action, $this->repoMock);

        // 2. Inject Data directly (Bypassing file_get_contents('php://input'))
        $dataProp = $reflection->getParentClass()->getProperty('data');
        $dataProp->setAccessible(true);
        $dataProp->setValue($action, $requestData);

        return $action;
    }

    // ---------------- CREATE ----------------

    public function testCreateGroupSuccess()
    {
        $payload = ['label' => 'Test Group'];

        $modelMock = $this->getMockBuilder(\stdClass::class)
            ->addMethods(['save'])
            ->getMock();

        $modelMock->expects($this->once())
            ->method('save')
            ->with($this->callback(function($data) {
                return $data['label'] === 'Test Group' && $data['account_id'] === 1;
            }))
            ->willReturn(123);

        $this->repoMock->method('getModel')->with('group')->willReturn($modelMock);

        $action = $this->getActionWithMock($payload);
        $request = (new ServerRequestFactory())->createServerRequest('POST', '/');
        $response = $action->createGroup($request, (new ResponseFactory())->createResponse(), ['account_id' => 1]);

        $this->assertEquals(200, $response->getStatusCode());
    }

    // ---------------- UPDATE ----------------

    public function testUpdateGroupSuccess()
    {
        $payload = ['label' => 'Updated Label'];

        $modelMock = $this->getMockBuilder(\stdClass::class)
            ->addMethods(['load', 'isLoaded', 'save'])
            ->getMock();

        $modelMock->method('load')->willReturnSelf();
        $modelMock->method('isLoaded')->willReturn(true);
        $modelMock->expects($this->once())->method('save')->with($payload);

        $this->repoMock->method('getModel')->willReturn($modelMock);

        $action = $this->getActionWithMock($payload);
        $request = (new ServerRequestFactory())->createServerRequest('PUT', '/');
        $response = $action->updateGroup($request, (new ResponseFactory())->createResponse(), ['group_id' => 10]);

        $this->assertEquals(200, $response->getStatusCode());
    }

    // ---------------- LIST ----------------

    public function testListGroupSuccess()
    {
        $this->repoMock->expects($this->once())
            ->method('getByAccountId')
            ->with(1)
            ->willReturn([['id' => 1, 'label' => 'Group']]);

        $action = $this->getActionWithMock();
        $request = (new ServerRequestFactory())->createServerRequest('GET', '/');
        $response = $action->listGroup($request, (new ResponseFactory())->createResponse(), ['account_id' => 1]);

        $this->assertEquals(200, $response->getStatusCode());
    }

    // ---------------- ASSIGN ----------------

    public function testAssignUserGroupSuccess()
    {
        $payload = ['user_group_ids' => [101, 102]];

        $this->repoMock->expects($this->once())
            ->method('assignUserToGroupMapping')
            ->with(55, [101, 102]);

        $action = $this->getActionWithMock($payload);
        $request = (new ServerRequestFactory())->createServerRequest('POST', '/');
        $response = $action->assignUserGroup($request, (new ResponseFactory())->createResponse(), ['user_id' => 55]);

        $this->assertEquals(200, $response->getStatusCode());
    }

    public function testAssignUserGroupValidationFail()
    {
        $action = $this->getActionWithMock([]); // Empty data
        $request = (new ServerRequestFactory())->createServerRequest('POST', '/');
        $response = $action->assignUserGroup($request, (new ResponseFactory())->createResponse(), ['user_id' => 55]);

        $this->assertEquals(400, $response->getStatusCode());
    }

    // ---------------- UPDATE MAPPING ----------------

    public function testUpdateUserGroupSuccess()
    {
        $payload = ['user_group_ids' => [200]];

        $this->repoMock->expects($this->once())
            ->method('updateUserGroupMapping')
            ->with(55, [200])
            ->willReturn(true);

        $action = $this->getActionWithMock($payload);
        $request = (new ServerRequestFactory())->createServerRequest('PUT', '/');
        $response = $action->updateUserGroup($request, (new ResponseFactory())->createResponse(), ['user_id' => 55]);

        $this->assertEquals(200, $response->getStatusCode());
    }

    public function testUpdateUserGroupValidationFail()
    {
        $action = $this->getActionWithMock([]); // Empty data
        $request = (new ServerRequestFactory())->createServerRequest('PUT', '/');
        $response = $action->updateUserGroup($request, (new ResponseFactory())->createResponse(), ['user_id' => 55]);

        $this->assertEquals(400, $response->getStatusCode());
    }

    // ---------------- GET USER GROUP ----------------

    public function testGetUserGroupSuccess()
    {
        $this->repoMock->expects($this->once())
            ->method('getGroupsByUserId')
            ->with(55)
            ->willReturn([['id' => 1, 'label' => 'Group']]);

        $action = $this->getActionWithMock();
        $request = (new ServerRequestFactory())->createServerRequest('GET', '/');
        $response = $action->getUserGroup($request, (new ResponseFactory())->createResponse(), ['user_id' => 55]);

        $this->assertEquals(200, $response->getStatusCode());
    }

    // ---------------- UPDATE GROUP EDGE CASES ----------------

    public function testUpdateGroupNotFound()
    {
        $payload = ['label' => 'Updated Label'];

        $modelMock = $this->getMockBuilder(\stdClass::class)
            ->addMethods(['load', 'isLoaded', 'save'])
            ->getMock();

        $modelMock->method('load')->willReturnSelf();
        $modelMock->method('isLoaded')->willReturn(false);

        $this->repoMock->method('getModel')->willReturn($modelMock);

        $action = $this->getActionWithMock($payload);
        $request = (new ServerRequestFactory())->createServerRequest('PUT', '/');
        $response = $action->updateGroup($request, (new ResponseFactory())->createResponse(), ['group_id' => 10]);

        $this->assertEquals(404, $response->getStatusCode());
    }

    public function testUpdateGroupEmptyData()
    {
        $payload = []; // Empty data

        $modelMock = $this->getMockBuilder(\stdClass::class)
            ->addMethods(['load', 'isLoaded', 'save'])
            ->getMock();

        $modelMock->method('load')->willReturnSelf();
        $modelMock->method('isLoaded')->willReturn(true);

        $this->repoMock->method('getModel')->willReturn($modelMock);

        $action = $this->getActionWithMock($payload);
        $request = (new ServerRequestFactory())->createServerRequest('PUT', '/');
        $response = $action->updateGroup($request, (new ResponseFactory())->createResponse(), ['group_id' => 10]);

        $this->assertEquals(400, $response->getStatusCode());
    }

    // ---------------- DELETE USER GROUP ----------------

    public function testDeleteUserGroupSuccess()
    {
        $this->repoMock->expects($this->once())
            ->method('deleteUserGroupMapping')
            ->with(55, 10)
            ->willReturn(1);

        $action = $this->getActionWithMock();
        $request = (new ServerRequestFactory())->createServerRequest('DELETE', '/');
        $response = $action->deleteUserGroup($request, (new ResponseFactory())->createResponse(), ['user_id' => 55, 'group_id' => 10]);

        $this->assertEquals(200, $response->getStatusCode());
    }

    public function testDeleteUserGroupFail()
    {
        $this->repoMock->expects($this->once())
            ->method('deleteUserGroupMapping')
            ->with(55, 10)
            ->willReturn(0);

        $action = $this->getActionWithMock();
        $request = (new ServerRequestFactory())->createServerRequest('DELETE', '/');
        $response = $action->deleteUserGroup($request, (new ResponseFactory())->createResponse(), ['user_id' => 55, 'group_id' => 10]);

        $this->assertEquals(400, $response->getStatusCode());
    }

    public function testDeleteUserGroupException()
    {
        $this->repoMock->expects($this->once())
            ->method('deleteUserGroupMapping')
            ->with(55, 10)
            ->willThrowException(new \Exception('DB error'));

        $action = $this->getActionWithMock();
        $request = (new ServerRequestFactory())->createServerRequest('DELETE', '/');
        $response = $action->deleteUserGroup($request, (new ResponseFactory())->createResponse(), ['user_id' => 55, 'group_id' => 10]);

        $this->assertEquals(400, $response->getStatusCode());
    }

    // ---------------- REPOSITORY ----------------

    public function testGetModelInvalid()
    {
        $repo = new AccountGroupRepository();
        $this->expectException(\Exception::class);
        $repo->getModel('invalid_class_name');
    }
}
