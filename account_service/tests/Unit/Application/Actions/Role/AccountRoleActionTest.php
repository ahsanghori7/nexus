<?php
declare(strict_types=1);

namespace Tests\Application\Actions\Role;

use App\Application\Actions\Role\AccountRoleAction;
use App\Domain\Account\AccountRepository;
use Psr\Log\LoggerInterface;
use Slim\Psr7\Factory\ResponseFactory;
use Slim\Psr7\Factory\ServerRequestFactory;
use Slim\Psr7\Stream;
use Tests\TestCase;

final class AccountRoleActionTest extends TestCase
{
    private $logger;
    private $repoMock;

    protected function setUp(): void
    {
        parent::setUp();
        $this->logger = $this->createMock(LoggerInterface::class);
        $this->repoMock = $this->createMock(AccountRepository::class);
    }

    /**
     * This is the "Magic" helper.
     * It uses Reflection to overwrite the hard-coded repository inside the Action.
     */
    private function getActionWithMock(): AccountRoleAction
    {
        $action = new AccountRoleAction($this->logger);

        $reflection = new \ReflectionClass(AccountRoleAction::class);

        // We look for the property 'repository'.
        // If it's defined in the parent 'Action' class, we find it there.
        if ($reflection->hasProperty('repository')) {
            $property = $reflection->getProperty('repository');
        } else {
            // Traverse up to the parent App\Application\Actions\Action
            $property = $reflection->getParentClass()->getProperty('repository');
        }

        $property->setAccessible(true);
        $property->setValue($action, $this->repoMock);

        return $action;
    }

    /**
     * Helper to create a request with a JSON body
     */
    protected function createJsonRequest(string $method, array $data = []): \Slim\Psr7\Request
    {
        $request = (new ServerRequestFactory())->createServerRequest($method, '/');
        if (!empty($data)) {
            $stream = fopen('php://temp', 'r+');
            fwrite($stream, json_encode($data));
            rewind($stream);
            $request = $request->withBody(new Stream($stream));
        }
        return $request;
    }

    // --- FETCH ACTION TESTS ---

    public function testFetchActionSuccess()
    {
        $this->repoMock->expects($this->once())
            ->method('listAccountRolesWithPermissions')
            ->with(1, '', 0)
            ->willReturn([[
                'id' => 1,
                'label' => 'Admin',
                'description' => 'Administrator role',
                'user_type_id' => 1,
                'level' => 100,
                'value' => 'Administrator',
                'permissions' => [
                    [
                        'id' => 1,
                        'key' => 'manage_roles',
                        'permission_type_id' => 2,
                        'permission_type_label' => 'Accounts'
                    ]
                ]
            ]]);

        $action = $this->getActionWithMock();
        $response = $action->fetchAction(
            $this->createJsonRequest('GET'),
            (new ResponseFactory())->createResponse(),
            ['account_id' => 1]
        );

        $this->assertEquals(200, $response->getStatusCode());
    }

    public function testFetchActionWithUserTypeAndUserTypeIdFilters(): void
    {
        $this->repoMock->expects($this->once())
            ->method('listAccountRolesWithPermissions')
            ->with(1, 'Admin', 5)
            ->willReturn([]);

        $action = $this->getActionWithMock();
        $request = $this->createJsonRequest('GET')
            ->withQueryParams(['user_type' => 'Admin', 'user_type_id' => '5']);

        $response = $action->fetchAction(
            $request,
            (new ResponseFactory())->createResponse(),
            ['account_id' => 1]
        );

        $this->assertEquals(200, $response->getStatusCode());
    }

    public function testFetchActionWithUserTypeFilterOnly(): void
    {
        $this->repoMock->expects($this->once())
            ->method('listAccountRolesWithPermissions')
            ->with(1, 'Admin', 0)
            ->willReturn([]);

        $action = $this->getActionWithMock();
        $request = $this->createJsonRequest('GET')
            ->withQueryParams(['user_type' => 'Admin']);

        $response = $action->fetchAction(
            $request,
            (new ResponseFactory())->createResponse(),
            ['account_id' => 1]
        );

        $this->assertEquals(200, $response->getStatusCode());
    }

    public function testFetchActionWithUserTypeIdFilterOnly(): void
    {
        $this->repoMock->expects($this->once())
            ->method('listAccountRolesWithPermissions')
            ->with(1, '', 7)
            ->willReturn([]);

        $action = $this->getActionWithMock();
        $request = $this->createJsonRequest('GET')
            ->withQueryParams(['user_type_id' => '7']);

        $response = $action->fetchAction(
            $request,
            (new ResponseFactory())->createResponse(),
            ['account_id' => 1]
        );

        $this->assertEquals(200, $response->getStatusCode());
    }

    public function testFetchActionMissingAccountId(): void
    {
        $action = $this->getActionWithMock();
        $response = $action->fetchAction(
            $this->createJsonRequest('GET'),
            (new ResponseFactory())->createResponse(),
            ['account_id' => 0]
        );

        $this->assertEquals(400, $response->getStatusCode());
    }

    public function testFetchActionException()
    {
        $this->repoMock->method('listAccountRolesWithPermissions')
            ->willThrowException(new \Exception("Database error"));

        $action = $this->getActionWithMock();
        $response = $action->fetchAction(
            $this->createJsonRequest('GET'),
            (new ResponseFactory())->createResponse(),
            ['account_id' => 1]
        );

        $this->assertEquals(400, $response->getStatusCode());
    }

    public function testDeleteActionSuccess(): void
    {
        $this->repoMock->expects($this->once())
            ->method('deleteAccountRoleById')
            ->with(1, 10)
            ->willReturn(true);

        $action = $this->getActionWithMock();
        $response = $action->deleteAction(
            $this->createJsonRequest('DELETE'),
            (new ResponseFactory())->createResponse(),
            ['account_id' => 1, 'id' => 10]
        );

        $this->assertEquals(200, $response->getStatusCode());
    }

    // --- CREATE ACTION TESTS ---

    public function testCreateActionSuccess()
    {
        $modelMock = $this->getMockBuilder(\stdClass::class)
            ->addMethods(['save', 'getId', 'labelExistsForAccount'])
            ->getMock();
        $modelMock->method('getId')->willReturn(42);
        $modelMock->method('labelExistsForAccount')->willReturn(false);
        $modelMock->expects($this->atLeastOnce())->method('save')->willReturnSelf();

        // Note: the action calls getModel twice in createAction, we handle that
        $this->repoMock->method('getModel')->with('account_role')->willReturn($modelMock);
        $this->repoMock->expects($this->once())
            ->method('replaceAccountRolePermissions')
            ->with(42, [1, 2]);

        $createdRoleData = [
            'id' => 42,
            'label' => 'Admin',
            'description' => 'desc',
            'user_type_id' => 1,
            'level' => 50,
            'value' => 'Administrator',
            'permissions' => [
                [
                    'id' => 1,
                    'key' => 'perm1',
                    'permission_type_id' => 1,
                    'permission_type_label' => 'Type1'
                ],
                [
                    'id' => 2,
                    'key' => 'perm2',
                    'permission_type_id' => 2,
                    'permission_type_label' => 'Type2'
                ]
            ]
        ];

        $this->repoMock->expects($this->once())
            ->method('getAccountRoleWithPermissions')
            ->with(42)
            ->willReturn($createdRoleData);

        $action = $this->getActionWithMock();
        $data = ['user_type_id' => 1, 'label' => 'Admin', 'description' => 'desc', 'permission_ids' => [1, 2]];
        $response = $action->createAction(
            $this->createJsonRequest('POST', $data),
            (new ResponseFactory())->createResponse(),
            ['account_id' => 1]
        );

        $this->assertEquals(200, $response->getStatusCode());

        $body = json_decode((string) $response->getBody(), true);
        $this->assertArrayHasKey('data', $body);
        $roleData = $body['data'];
        $this->assertEquals(42, $roleData['id']);
        $this->assertEquals('Admin', $roleData['label']);
        $this->assertArrayHasKey('permissions', $roleData);
        $this->assertCount(2, $roleData['permissions']);
    }

    public function testCreateActionBadRequest()
    {
        $action = $this->getActionWithMock();
        $response = $action->createAction(
            $this->createJsonRequest('POST', []),
            (new ResponseFactory())->createResponse(),
            ['account_id' => 1]
        );

        $this->assertEquals(400, $response->getStatusCode());
    }

    public function testCreateActionException()
    {
        $this->repoMock->method('getModel')
            ->willThrowException(new \Exception("Mapping error"));

        $action = $this->getActionWithMock();
        $response = $action->createAction(
            $this->createJsonRequest('POST', ['user_type_id' => 1, 'label' => 'Admin']),
            (new ResponseFactory())->createResponse(),
            ['account_id' => 1]
        );

        $this->assertEquals(400, $response->getStatusCode());
    }

    public function testCreateActionDuplicateLabel()
    {
        $modelMock = $this->getMockBuilder(\stdClass::class)
            ->addMethods(['save', 'getId', 'labelExistsForAccount'])
            ->getMock();
        $modelMock->method('labelExistsForAccount')->willReturn(true);
        $modelMock->expects($this->never())->method('save');

        $this->repoMock->method('getModel')->with('account_role')->willReturn($modelMock);
        $this->repoMock->expects($this->never())->method('replaceAccountRolePermissions');

        $action = $this->getActionWithMock();
        $data = ['user_type_id' => 1, 'label' => 'Admin', 'description' => 'desc'];
        $response = $action->createAction(
            $this->createJsonRequest('POST', $data),
            (new ResponseFactory())->createResponse(),
            ['account_id' => 1]
        );

        $this->assertEquals(400, $response->getStatusCode());

        $body = json_decode((string) $response->getBody(), true);
        $this->assertEquals(
            'A role with this name already exists for this account',
            $body['data']['error']
        );
    }

    // --- UPDATE ACTION TESTS ---

    public function testUpdateActionSuccess()
    {
        $modelMock = $this->getMockBuilder(\stdClass::class)
            ->addMethods(['load', 'isLoaded', 'save', 'labelExistsForAccount'])
            ->getMock();

        $modelMock->method('load')->willReturnSelf();
        $modelMock->method('isLoaded')->willReturn(true);
        $modelMock->method('labelExistsForAccount')->willReturn(false);
        $modelMock->expects($this->once())->method('save')->willReturnSelf();

        $this->repoMock->method('getModel')->willReturn($modelMock);
        $this->repoMock->expects($this->once())
            ->method('replaceAccountRolePermissions')
            ->with(10, [3]);

        $updatedRoleData = [
            'id' => 10,
            'label' => 'Editor',
            'description' => 'Editor description',
            'user_type_id' => 1,
            'level' => 25,
            'value' => 'Editor Role',
            'permissions' => [
                [
                    'id' => 3,
                    'key' => 'edit_projects',
                    'permission_type_id' => 1,
                    'permission_type_label' => 'Projects'
                ]
            ]
        ];

        $this->repoMock->expects($this->once())
            ->method('getAccountRoleWithPermissions')
            ->with(10)
            ->willReturn($updatedRoleData);

        $action = $this->getActionWithMock();
        $data = ['user_type_id' => 1, 'label' => 'Editor', 'permission_ids' => [3]];
        $response = $action->updateAction(
            $this->createJsonRequest('PUT', $data),
            (new ResponseFactory())->createResponse(),
            ['account_id' => 1, 'id' => 10]
        );

        $this->assertEquals(200, $response->getStatusCode());

        $body = json_decode((string) $response->getBody(), true);
        $this->assertArrayHasKey('data', $body);
        $roleData = $body['data'];
        $this->assertEquals(10, $roleData['id']);
        $this->assertEquals('Editor', $roleData['label']);
        $this->assertArrayHasKey('permissions', $roleData);
        $this->assertCount(1, $roleData['permissions']);
    }

    public function testUpdateActionNotFound()
    {
        $modelMock = $this->getMockBuilder(\stdClass::class)->addMethods(['load', 'isLoaded'])->getMock();
        $modelMock->method('load')->willReturnSelf();
        $modelMock->method('isLoaded')->willReturn(false);

        $this->repoMock->method('getModel')->willReturn($modelMock);

        $action = $this->getActionWithMock();
        $data = ['user_type_id' => 1, 'label' => 'Admin'];
        $response = $action->updateAction(
            $this->createJsonRequest('PUT', $data),
            (new ResponseFactory())->createResponse(),
            ['account_id' => 1, 'id' => 999]
        );

        $this->assertEquals(404, $response->getStatusCode());
    }

    public function testUpdateActionDuplicateLabel()
    {
        $modelMock = $this->getMockBuilder(\stdClass::class)
            ->addMethods(['load', 'isLoaded', 'save', 'labelExistsForAccount'])
            ->getMock();

        $modelMock->method('load')->willReturnSelf();
        $modelMock->method('isLoaded')->willReturn(true);
        $modelMock->method('labelExistsForAccount')->willReturn(true);
        $modelMock->expects($this->never())->method('save');

        $this->repoMock->method('getModel')->willReturn($modelMock);
        $this->repoMock->expects($this->never())->method('replaceAccountRolePermissions');

        $action = $this->getActionWithMock();
        $data = ['user_type_id' => 1, 'label' => 'Editor'];
        $response = $action->updateAction(
            $this->createJsonRequest('PUT', $data),
            (new ResponseFactory())->createResponse(),
            ['account_id' => 1, 'id' => 10]
        );

        $this->assertEquals(400, $response->getStatusCode());

        $body = json_decode((string) $response->getBody(), true);
        $this->assertEquals(
            'A role with this name already exists for this account',
            $body['data']['error']
        );
    }

    public function testUpdateActionException()
    {
        $this->repoMock->method('getModel')
            ->willThrowException(new \Exception("Update failed"));

        $action = $this->getActionWithMock();
        $response = $action->updateAction(
            $this->createJsonRequest('PUT', ['user_type_id' => 1, 'label' => 'Admin']),
            (new ResponseFactory())->createResponse(),
            ['account_id' => 1, 'id' => 10]
        );

        $this->assertEquals(400, $response->getStatusCode());
    }

    public function testUpdateActionValidationFailure()
    {
        $action = $this->getActionWithMock();
        $response = $action->updateAction(
            $this->createJsonRequest('PUT', []),
            (new ResponseFactory())->createResponse(),
            ['account_id' => 1]
        );

        $this->assertEquals(400, $response->getStatusCode());
    }
}
