<?php

declare(strict_types=1);

namespace Tests\Unit\Application\Actions;

use App\Application\Actions\Action;
use App\Application\Actions\ActionPayload;
use PHPUnit\Framework\MockObject\MockObject;
use PHPUnit\Framework\TestCase;
use Psr\Http\Message\ServerRequestInterface as Request;
use Psr\Http\Message\ResponseInterface as ResponseInterface;
use Psr\Log\LoggerInterface;
use Slim\Psr7\Response;

class ActionTest extends TestCase
{
    public function testRespondWritesJsonPayload(): void
    {
        $action = new TestableAction($this->createMock(LoggerInterface::class));
        $response = $action->callRespond(
            new Response(),
            new ActionPayload(201, ['foo' => 'bar'])
        );

        self::assertSame(201, $response->getStatusCode());
        self::assertSame('application/json', $response->getHeaderLine('Content-Type'));
        self::assertStringContainsString('"foo": "bar"', (string)$response->getBody());
    }

    public function testCreateCallsRepositoryWithData(): void
    {
        /** @var Request&MockObject $request */
        $request = $this->createMock(Request::class);
        $repository = $this->createMock(TestRepositoryDouble::class);
        $repository->expects($this->once())
            ->method('create')
            ->with(['name' => 'doc'])
            ->willReturn(5);

        $action = new TestableAction($this->createMock(LoggerInterface::class));
        $action->setRepository($repository);
        $action->setData(['name' => 'doc']);

        $response = $action->callCreate($request, new Response());

        self::assertSame(200, $response->getStatusCode());
        self::assertStringContainsString('"id": 5', (string)$response->getBody());
    }

    public function testDeleteByIdInvokesModelAndReturnsNoContent(): void
    {
        /** @var Request&MockObject $request */
        $request = $this->createMock(Request::class);
        $model = $this->createMock(TestModelDouble::class);
        $model->expects($this->once())->method('deleteById')->with(7);

        $repository = $this->createMock(TestRepositoryDouble::class);
        $repository->method('getModel')->willReturn($model);

        $action = new TestableAction($this->createMock(LoggerInterface::class));
        $action->setRepository($repository);

        $response = $action->callDeleteById($request, new Response(), ['id' => 7]);

        self::assertSame(203, $response->getStatusCode());
    }

    public function testRequestContentTypeFallsBackToDefault(): void
    {
        $action = new TestableAction($this->createMock(LoggerInterface::class));
        $action->setDefaultContentType('application/json');

        self::assertSame('application/json', $action->callGetRequestContentType());
    }

    public function testGetDataReturnsCachedValues(): void
    {
        $action = new TestableAction($this->createMock(LoggerInterface::class));
        $action->setData(['a' => 1]);

        self::assertSame(['a' => 1], $action->callGetData());
        self::assertSame(1, $action->callGetData('a'));
        self::assertSame('fallback', $action->callGetData('missing', 'fallback'));
    }
}

class TestableAction extends Action
{
    public function __construct(LoggerInterface $logger)
    {
        parent::__construct($logger);
    }

    public function setRepository($repository): void
    {
        $this->repository = $repository;
    }

    public function setData(array $data): void
    {
        $this->data = $data;
    }

    public function setDefaultContentType(string $type): void
    {
        $this->defaultContentType = $type;
    }

    public function callRespond(ResponseInterface $response, ActionPayload $payload): ResponseInterface
    {
        return $this->respond($response, $payload);
    }

    public function callCreate(Request $request, ResponseInterface $response): ResponseInterface
    {
        return $this->create($request, $response);
    }

    public function callDeleteById(Request $request, ResponseInterface $response, array $args): ResponseInterface
    {
        return $this->deleteById($request, $response, $args);
    }

    public function callGetRequestContentType(): string
    {
        return $this->getRequestContentType();
    }

    public function callGetData(?string $key = null, $default = null)
    {
        return $this->getData($key, $default);
    }
}

class TestRepositoryDouble
{
    public function getModel()
    {
        return new TestModelDouble();
    }

    public function create(array $data)
    {
        return null;
    }
}

class TestModelDouble
{
    public function deleteById(int $id): void
    {
    }
}
