<?php

declare(strict_types=1);

namespace Tests\Middleware;

use Api\Middleware\OrderMiddleware;
use Api\TestBootstrap;
use Core\Data\Shape;
use Core\Service\Manager;
use Core\Service\Testing\MockRestService;

class CapturingProjectService extends MockRestService
{
    public string $updatedPath = '';
    public ?Shape $updatedPayload = null;

    public function update(string $path, Shape $shape): Shape
    {
        $this->updatedPath = $path;
        $this->updatedPayload = $shape;

        return new Shape(['success' => true]);
    }
}

class OrderMiddlewareTest extends TestBootstrap
{
    public function testRequestApprovalClearsWithdrawnTransactionStatus(): void
    {
        $projectService = new CapturingProjectService();
        Manager::addService('project', $projectService);

        $action = new Shape([
            'pid' => 42,
            'quote' => [
                'id' => 99,
                'status_id' => OrderMiddleware::TRANSACTION_STATUS_WITHDRAWN,
            ],
            'meta' => ['values' => ['order_value' => 12500]],
        ]);

        OrderMiddleware::syncOrderPrice(clearWithdrawnStatus: true)($action);

        $this->assertSame(12500, $projectService->updatedPayload->get('data.order_price'));
        $this->assertSame(
            OrderMiddleware::TRANSACTION_STATUS_SENT,
            $projectService->updatedPayload->get('data.status_id')
        );
    }

    public function testRequestApprovalDoesNotRewriteActiveTransactionStatus(): void
    {
        $projectService = new CapturingProjectService();
        Manager::addService('project', $projectService);

        $action = new Shape([
            'pid' => 42,
            'quote' => ['id' => 99, 'status_id' => OrderMiddleware::TRANSACTION_STATUS_SENT],
            'meta' => ['values' => ['order_value' => 12500]],
        ]);

        OrderMiddleware::syncOrderPrice(clearWithdrawnStatus: true)($action);

        $this->assertNull($projectService->updatedPayload->get('data.status_id'));
    }

    public function testResetOrderPriceUpdatesTheCorrectTransaction(): void
    {
        $projectService = new CapturingProjectService();
        Manager::addService('project', $projectService);

        $action = new Shape([
            'pid' => 42,
            'transaction_id' => 99,
        ]);

        OrderMiddleware::resetOrderPrice()($action);

        $this->assertSame(
            'project/42/tender/transaction/99',
            $projectService->updatedPath
        );
        $this->assertSame(0, $projectService->updatedPayload->get('data.order_price'));
        $this->assertNotEmpty($projectService->updatedPayload->get('data.order_updated'));
    }

    public function testResetOrderPriceRejectsMissingTransactionContext(): void
    {
        $this->expectException(\Core\Middleware\Exception::class);

        OrderMiddleware::resetOrderPrice()(new Shape(['pid' => 42]));
    }
}
