<?php

declare(strict_types=1);

namespace Tests\Unit\Action;

use App\Application\Actions\Tender\TenderAction;
use App\Domain\Project\ProjectRepository;
use PHPUnit\Framework\TestCase;
use Psr\Log\LoggerInterface;
use Slim\Psr7\Factory\ResponseFactory;
use Slim\Psr7\Factory\ServerRequestFactory;

class TenderActionTest extends TestCase
{
    private ResponseFactory $responses;

    protected function setUp(): void
    {
        $this->responses = new ResponseFactory();
    }

    public function testListTenderReturnsAggregateHistory(): void
    {
        $builder = $this->createBuilder(['select', 'leftJoin', 'join', 'where', 'whereIn', 'orderBy', 'exists']);
        $builder->method('select')->willReturnSelf();
        $builder->method('leftJoin')->willReturnSelf();
        $builder->method('join')->willReturnSelf();
        $builder->method('where')->willReturnSelf();
        $builder->method('whereIn')->willReturnSelf();
        $builder->method('orderBy')->willReturnSelf();
        $builder->method('exists')->willReturn(true);

        $repository = $this->createMock(ProjectRepository::class);
        $repository->method('getModel')->with('tender')->willReturn($builder);

        $repository->expects(self::once())
            ->method('aggregateTenderHistory')
            ->with($builder)
            ->willReturn([
                ['tender' => ['id' => 1]],
            ]);

        $action = $this->createAction($repository);

        $request = (new ServerRequestFactory())->createServerRequest('GET', '/tender');
        $response = $action->listTender($request, $this->responses->createResponse(), []);

        self::assertSame(200, $response->getStatusCode());

        $body = json_decode((string) $response->getBody(), true);

        self::assertIsArray($body['data']);
        self::assertSame(1, $body['data'][0]['tender']['id']);
    }

    public function testListTenderWithoutIdsAndSort(): void
    {
        $builder = $this->createBuilder([
            'select', 'leftJoin', 'join', 'where', 'exists'
        ]);

        $builder->method('select')->willReturnSelf();
        $builder->method('leftJoin')->willReturnSelf();
        $builder->method('join')->willReturnSelf();
        $builder->method('where')->willReturnSelf();
        $builder->method('exists')->willReturn(true);

        $repository = $this->createMock(ProjectRepository::class);
        $repository->method('getModel')->with('tender')->willReturn($builder);

        $repository->method('aggregateTenderHistory')->willReturn([
            ['tender' => ['id' => 2]]
        ]);

        $action = $this->createAction($repository);

        $request = (new ServerRequestFactory())->createServerRequest('GET', '/tender');

        $response = $action->listTender($request, $this->responses->createResponse(), []);

        self::assertSame(200, $response->getStatusCode());
    }

    public function testListTenderReturnsNotFoundWhenNoRecordsExist(): void
    {
        $builder = $this->createBuilder([
            'select', 'leftJoin', 'join', 'where', 'exists'
        ]);

        $builder->method('select')->willReturnSelf();
        $builder->method('leftJoin')->willReturnSelf();
        $builder->method('join')->willReturnSelf();
        $builder->method('where')->willReturnSelf();
        $builder->method('exists')->willReturn(false);

        $repository = $this->createMock(ProjectRepository::class);
        $repository->method('getModel')->with('tender')->willReturn($builder);

        $action = $this->createAction($repository);
        $request = (new ServerRequestFactory())->createServerRequest('GET', '/tender');
        $response = $action->listTender($request, $this->responses->createResponse(), []);

        self::assertSame(404, $response->getStatusCode());
    }

    private function createAction(ProjectRepository $repository): TenderAction
    {
        return new TenderAction($this->createMock(LoggerInterface::class), $repository);
    }

    private function createBuilder(array $methods)
    {
        return $this->getMockBuilder(\stdClass::class)
            ->addMethods($methods)
            ->getMock();
    }
}
