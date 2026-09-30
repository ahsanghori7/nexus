<?php

declare(strict_types=1);

namespace Tests\Unit\Application\Actions\Approval;

use App\Application\Actions\Approval\ApprovalAction;
use App\Domain\Threshold\ThresholdRepository;
use PHPUnit\Framework\TestCase;
use Psr\Log\LoggerInterface;
use Slim\Psr7\Factory\ServerRequestFactory;
use Slim\Psr7\Response;

final class ApprovalActionTest extends TestCase
{
    private $logger;
    private $repoMock;

    protected function setUp(): void
    {
        $this->logger = $this->createMock(LoggerInterface::class);
        $this->repoMock = $this->createMock(ThresholdRepository::class);
    }

    /**
     * Helper to inject mocks into the Action
     */
    private function getActionWithMock(): ApprovalAction
    {
        $action = new ApprovalAction($this->logger);
        $reflection = new \ReflectionClass(ApprovalAction::class);

        // Inject Repository Mock
        $repoProp = $reflection->getProperty('repository');
        $repoProp->setAccessible(true);
        $repoProp->setValue($action, $this->repoMock);

        return $action;
    }

    public function testGetTRApproversReturnsResponse(): void
    {
        $this->repoMock->expects($this->once())
            ->method('fetchTRApprovers')
            ->with(1, 1)
            ->willReturn(['approver' => 'data']);

        $action = $this->getActionWithMock();

        $request = (new ServerRequestFactory())
            ->createServerRequest('GET', '/approval/1/trapprovers')
            ->withQueryParams(['user_id' => 1]);

        $response = new Response();

        $result = $action->getTRApprovers(
            $request,
            $response,
            ['aid' => 1]
        );

        $this->assertSame(200, $result->getStatusCode());
    }

    public function testGetSLApproversReturnsResponse(): void
    {
        $this->repoMock->expects($this->once())
            ->method('fetchSLApprovers')
            ->with(1)
            ->willReturn(['approver' => 'data']);

        $action = $this->getActionWithMock();

        $request = (new ServerRequestFactory())
            ->createServerRequest('GET', '/approval/slapprovers')
            ->withQueryParams(['user_id' => 1]);

        $response = new Response();

        $result = $action->getSLApprovers(
            $request,
            $response,
            []
        );

        $this->assertSame(200, $result->getStatusCode());
    }

     public function testGetTRApproversReturns(): void
    {
        $logger = $this->createMock(LoggerInterface::class);

        $action = new ApprovalAction($logger);

        $request = (new ServerRequestFactory())
            ->createServerRequest('GET', '/v1/approvals/trapprovers')
            ->withQueryParams(['user_id' => 1]);

        $response = new Response();

        $result = $action->getTRApprovers($request, $response, ['aid' => 20]);

        $this->assertSame(200, $result->getStatusCode());
    }

    public function testGetTIApproversReturns(): void
    {
        $logger = $this->createMock(LoggerInterface::class);

        $action = new ApprovalAction($logger);

        $request = (new ServerRequestFactory())
            ->createServerRequest('GET', '/v1/approvals/99/tiapprovers')
            ->withQueryParams(['user_id' => 1]);

        $response = new Response();

        $args = [
            'account_id' => 99,
        ];

        $result = $action->getTIApprovers($request, $response, $args);

        $this->assertSame(200, $result->getStatusCode());
    }
}
