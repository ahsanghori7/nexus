<?php

declare(strict_types=1);

namespace Tests\Unit\Infrastructure\Action;

use App\Application\Actions\Action;
use App\Application\Actions\ActionPayload;
use PHPUnit\Framework\TestCase;
use Psr\Log\LoggerInterface;
use Slim\Psr7\Factory\ResponseFactory;
use Slim\Psr7\Response;

class ActionTest extends TestCase
{
    public function testRespondWritesPayload(): void
    {
        $action = $this->createAction();
        $response = $action->respondWithPayload(new ActionPayload(200, ['ok' => true]));

        self::assertSame('application/json', $response->getHeaderLine('Content-Type'));
        self::assertSame(200, $response->getStatusCode());
        self::assertJsonStringEqualsJsonString(
            json_encode(['data' => ['ok' => true]], JSON_PRETTY_PRINT),
            (string) $response->getBody()
        );
    }

    public function testStatusHelpers(): void
    {
        $factory = new ResponseFactory();
        $action = $this->createAction();

        self::assertSame(400, $action->badRequest($factory->createResponse())->getStatusCode());
        self::assertSame(404, $action->notFound($factory->createResponse())->getStatusCode());
        self::assertSame(203, $action->noContent($factory->createResponse())->getStatusCode());
        self::assertSame(401, $action->noAuth($factory->createResponse())->getStatusCode());
    }

    public function testCreatePayload(): void
    {
        $action = $this->createAction();
        $payload = $action->createPayload(201, ['id' => 1]);

        self::assertInstanceOf(ActionPayload::class, $payload);
        self::assertSame(201, $payload->getStatusCode());
        self::assertSame(['id' => 1], $payload->getData());
    }

    public function testJsonResponseWritesToExistingResponse(): void
    {
        $action = $this->createAction();
        $response = (new ResponseFactory())->createResponse();
        $action->setResponse($response);
        $result = $action->sendJson(new ActionPayload(202, ['test' => 'ok']), 202);

        self::assertSame(202, $result->getStatusCode());
        self::assertJsonStringEqualsJsonString(
            json_encode(['data' => ['test' => 'ok']], JSON_PRETTY_PRINT),
            (string) $result->getBody()
        );
    }

    private function createAction(): TestableAction
    {
        return new TestableAction($this->createMock(LoggerInterface::class));
    }
}

class TestableAction extends Action
{
    public function __construct(LoggerInterface $logger)
    {
        parent::__construct($logger);
    }

    public function respondWithPayload(ActionPayload $payload): Response
    {
        $factory = new ResponseFactory();
        return $this->respond($factory->createResponse(), $payload);
    }

    public function setResponse(Response $response): void
    {
        $this->response = $response;
    }

    public function sendJson(ActionPayload $payload, int $status): Response
    {
        return $this->jsonResponse($payload, $status);
    }
}
