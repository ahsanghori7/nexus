<?php

declare(strict_types=1);

namespace Tests\Unit\Action;

use App\Application\Actions\OrderApprover\OrderApproverAction;
use App\Domain\OrderApprover\OrderApproverRepository;
use PHPUnit\Framework\TestCase;
use Tests\Helpers\Http;
use Tests\Helpers\Mocks;
use Tests\TestDoubles\FakeCollection;

class OrderApproverActionTest extends TestCase
{
    public function testDeleteByTransactionRejectsMissingId(): void
    {
        $action = $this->createAction();
        $response = $action->deleteByTransaction(Http::jsonRequest('DELETE', '/order-approvers'), Http::response(), []);

        self::assertSame(400, $response->getStatusCode());
    }

    public function testDeleteByTransactionDeletesRecord(): void
    {
        $repository = $this->createMock(OrderApproverRepository::class);
        $action = $this->createAction($repository);
        $model = Mocks::builder($this, ['deleteBy']);
        $model->expects(self::once())->method('deleteBy')->with(['transaction_id' => 15]);
        $repository->method('getModel')->willReturn($model);

        $response = $action->deleteByTransaction(Http::jsonRequest('DELETE', '/order-approvers/15'), Http::response(), ['tid' => 15]);

        self::assertSame(203, $response->getStatusCode());
    }

    public function testGetByTransactionValidatesId(): void
    {
        $action = $this->createAction();
        $response = $action->getByTransaction(Http::jsonRequest('GET', '/order-approvers'), Http::response(), []);

        self::assertSame(400, $response->getStatusCode());
    }

    public function testGetByTransactionReturnsPayload(): void
    {
        $repository = $this->createMock(OrderApproverRepository::class);
        $action = $this->createAction($repository);
        $builder = Mocks::builder($this, ['with', 'where', 'get']);
        $builder->method('with')->willReturnSelf();
        $builder->method('where')->willReturnSelf();
        $builder->method('get')->willReturn(new FakeCollection([
            ['id' => 1, 'status' => 'pending'],
        ]));
        $repository->method('getModel')->willReturn($builder);

        $response = $action->getByTransaction(Http::jsonRequest('GET', '/order-approvers/9'), Http::response(), ['tid' => 9]);
        $decoded = Http::decode($response);

        self::assertSame(200, $response->getStatusCode());
        self::assertSame([['id' => 1, 'status' => 'pending']], $decoded['data'] ?? null);
    }

    public function testCreateLogPersistsIncomingBody(): void
    {
        $repository = $this->createMock(OrderApproverRepository::class);
        $action = $this->createAction($repository);
        $logModel = Mocks::builder($this, ['store']);
        $logModel->expects(self::once())->method('store')->with(['message' => 'ok']);
        $repository->method('getModel')->with('orderLog')->willReturn($logModel);
        Mocks::seedActionData($action, ['message' => 'ok']);

        $response = $action->createLog(Http::jsonRequest('POST', '/order-approvers/logs'), Http::response(), []);

        self::assertSame(203, $response->getStatusCode());
    }

    public function testGetLogByTransactionRequiresId(): void
    {
        $action = $this->createAction();
        $response = $action->getLogByTransaction(Http::jsonRequest('GET', '/order-approvers/logs'), Http::response(), []);

        self::assertSame(400, $response->getStatusCode());
    }

    public function testGetLogByTransactionReturnsRows(): void
    {
        $repository = $this->createMock(OrderApproverRepository::class);
        $action = $this->createAction($repository);
        $builder = Mocks::builder($this, ['where', 'get']);
        $builder->method('where')->willReturnSelf();
        $builder->method('get')->willReturn(new FakeCollection([
            ['id' => 3, 'transaction_id' => 22],
        ]));
        $repository->method('getModel')->with('orderLog')->willReturn($builder);

        $response = $action->getLogByTransaction(Http::jsonRequest('GET', '/order-approvers/logs/22'), Http::response(), ['tid' => 22]);
        $decoded = Http::decode($response);

        self::assertSame(200, $response->getStatusCode());
        self::assertSame([['id' => 3, 'transaction_id' => 22]], $decoded['data'] ?? null);
    }

    public function testCreateBulkApproversAppliesApprovedStatusWhenSatisfied(): void
    {
        $repository = $this->createMock(OrderApproverRepository::class);
        $action = $this->createAction($repository);

        $orderApproverModel = Mocks::builder($this, ['store']);
        $stored = [];
        $orderApproverModel->expects(self::exactly(2))->method('store')->willReturnCallback(
            function (array $data) use (&$stored) {
                $stored[] = $data;
            }
        );

        $statusModel = Mocks::builder($this, ['getLabelId']);
        $statusModel->method('getLabelId')->with('Approved')->willReturn(2);

        $repository->method('getModel')->willReturnCallback(function (?string $name = null) use ($orderApproverModel, $statusModel) {
            return $name === 'orderApproverStatus' ? $statusModel : $orderApproverModel;
        });

        Mocks::seedActionData($action, [
            'transaction_id' => 55,
            'requester_user_id' => 3,
            'status_id' => 4,
            'users' => [
                ['user_id' => 7, 'is_satisfied_by_self_approved' => true],
                ['user_id' => 8],
            ],
        ]);

        $response = $action->createBulkApprovers(Http::jsonRequest('POST', '/order-approvers'), Http::response(), []);

        self::assertSame(203, $response->getStatusCode());
        self::assertSame(2, $stored[0]['status_id']);
        self::assertSame(4, $stored[1]['status_id']);
        self::assertSame(7, $stored[0]['approver_user_id']);
        self::assertSame(
            '{"is_satisfied_by_self_approved":true,"is_satisfied_by_higher_authority":false}',
            $stored[0]['meta']
        );
    }

    public function testCreateBulkApproversAppliesApprovedStatusAndMetaWhenLevelSatisfied(): void
    {
        $repository = $this->createMock(OrderApproverRepository::class);
        $action = $this->createAction($repository);

        $orderApproverModel = Mocks::builder($this, ['store']);
        $stored = [];
        $orderApproverModel->expects(self::exactly(2))->method('store')->willReturnCallback(
            function (array $data) use (&$stored) {
                $stored[] = $data;
            }
        );

        $statusModel = Mocks::builder($this, ['getLabelId']);
        $statusModel->method('getLabelId')->with('Approved')->willReturn(2);

        $repository->method('getModel')->willReturnCallback(function (?string $name = null) use ($orderApproverModel, $statusModel) {
            return $name === 'orderApproverStatus' ? $statusModel : $orderApproverModel;
        });

        Mocks::seedActionData($action, [
            'transaction_id' => 55,
            'requester_user_id' => 3,
            'status_id' => 4,
            'users' => [
                [
                    'user_id' => 7,
                    'is_satisfied_by_self_approved' => false,
                    'is_level_satisfied_by_higher_authority' => true,
                ],
                ['user_id' => 8],
            ],
        ]);

        $response = $action->createBulkApprovers(Http::jsonRequest('POST', '/order-approvers'), Http::response(), []);

        self::assertSame(203, $response->getStatusCode());
        self::assertSame(2, $stored[0]['status_id']);
        self::assertSame(4, $stored[1]['status_id']);
        self::assertSame(
            '{"is_satisfied_by_self_approved":false,"is_satisfied_by_higher_authority":true}',
            $stored[0]['meta']
        );
    }

    public function testCreateBulkApproversAppliesApprovedStatusWhenLevelSatisfied(): void
    {
        $repository = $this->createMock(OrderApproverRepository::class);
        $action = $this->createAction($repository);

        $orderApproverModel = Mocks::builder($this, ['store']);
        $stored = [];
        $orderApproverModel->expects(self::exactly(2))->method('store')->willReturnCallback(
            function (array $data) use (&$stored) {
                $stored[] = $data;
            }
        );

        $statusModel = Mocks::builder($this, ['getLabelId']);
        $statusModel->method('getLabelId')->with('Approved')->willReturn(2);

        $repository->method('getModel')->willReturnCallback(function (?string $name = null) use ($orderApproverModel, $statusModel) {
            return $name === 'orderApproverStatus' ? $statusModel : $orderApproverModel;
        });

        Mocks::seedActionData($action, [
            'transaction_id' => 55,
            'requester_user_id' => 3,
            'status_id' => 4,
            'users' => [
                ['user_id' => 7, 'is_level_satisfied_by_higher_authority' => true],
                ['user_id' => 8],
            ],
        ]);

        $response = $action->createBulkApprovers(Http::jsonRequest('POST', '/order-approvers'), Http::response(), []);

        self::assertSame(203, $response->getStatusCode());
        self::assertSame(2, $stored[0]['status_id']);
        self::assertSame(4, $stored[1]['status_id']);
    }

    public function testGetRequiredActionsValidatesUserId(): void
    {
        $action = $this->createAction();
        $response = $action->getRequiredActions(Http::jsonRequest('GET', '/order-approvers/required'), Http::response(), []);

        self::assertSame(400, $response->getStatusCode());
    }

    public function testGetRequiredActionsReturnsList(): void
    {
        $repository = $this->createMock(OrderApproverRepository::class);
        $action = $this->createAction($repository);
        $model = Mocks::builder($this, ['getRequiredActionsData']);
        $model->expects(self::once())->method('getRequiredActionsData')->with(7, ['status' => 'open'])->willReturn([['id' => 9]]);
        $repository->method('getModel')->willReturn($model);

        $request = Http::jsonRequest('GET', '/order-approvers/required', null, ['status' => 'open']);
        $response = $action->getRequiredActions($request, Http::response(), ['uid' => 7]);
        $decoded = Http::decode($response);

        self::assertSame(200, $response->getStatusCode());
        self::assertSame([['id' => 9]], $decoded['data'] ?? null);
    }

    public function testGetCompletedActionsReturnsList(): void
    {
        $repository = $this->createMock(OrderApproverRepository::class);
        $action = $this->createAction($repository);
        $model = Mocks::builder($this, ['getCompletedActionsData']);
        $model->expects(self::once())->method('getCompletedActionsData')->with(10, [])->willReturn([['id' => 1]]);
        $repository->method('getModel')->willReturn($model);

        $response = $action->getCompletedActions(Http::jsonRequest('GET', '/order-approvers/completed'), Http::response(), ['uid' => 10]);
        $decoded = Http::decode($response);

        self::assertSame(200, $response->getStatusCode());
        self::assertSame([['id' => 1]], $decoded['data'] ?? null);
    }

    private function createAction(?OrderApproverRepository $repository = null): OrderApproverAction
    {
        $action = new OrderApproverAction(Mocks::logger());
        if ($repository) {
            Mocks::setProperty($action, 'repository', $repository);
        }

        return $action;
    }
}
