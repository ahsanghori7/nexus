<?php
declare(strict_types=1);

namespace Tests\Application\Actions;

use App\Application\Actions\Action;
use App\Application\Actions\ActionError;
use App\Application\Actions\ActionPayload;
use App\Infrastructure\Action\Paginator;
use Psr\Log\LoggerInterface;
use Slim\Psr7\Request;
use Slim\Psr7\Response;
use Slim\Exception\HttpBadRequestException;
use Tests\TestCase as BaseTestCase;

final class ActionBehaviorTest extends BaseTestCase
{
    public function testResolveArgReturnsValue(): void
    {
        $action = $this->createAction();
        $action->setContext($this->createRequest('GET', '/test'), new Response(), ['id' => 5]);

        self::assertSame(5, $action->invokeResolve('id'));
    }

    public function testResolveArgThrowsWhenMissing(): void
    {
        $this->expectException(HttpBadRequestException::class);

        $action = $this->createAction();
        $action->setContext($this->createRequest('GET', '/test'), new Response(), []);

        $action->invokeResolve('id');
    }

    public function testBadRequestWithMessageSerialisesError(): void
    {
        $action = $this->createAction();
        $response = $action->callBadRequest(new Response(), ['field' => 'invalid']);

        self::assertSame(400, $response->getStatusCode());
        self::assertSame('application/json', $response->getHeaderLine('Content-Type'));
        self::assertJsonStringEqualsJsonString(
            json_encode(['error' => 'Bad Request', 'message' => ['field' => 'invalid']], JSON_PRETTY_PRINT),
            (string) $response->getBody()
        );
    }

    public function testBadRequestWithoutMessageReturnsStatusOnly(): void
    {
        $action = $this->createAction();
        $response = $action->callBadRequest(new Response());

        self::assertSame(400, $response->getStatusCode());
        self::assertSame('', (string) $response->getBody());
    }

    public function testJsonResponseWritesPayload(): void
    {
        $action = $this->createAction();
        $payload = new ActionPayload(418, ['teapot' => true]);
        $response = $action->callJsonResponse($payload, 418);

        self::assertSame(418, $response->getStatusCode());
        self::assertJsonStringEqualsJsonString(json_encode($payload, JSON_PRETTY_PRINT), (string) $response->getBody());
    }

    public function testNoAuthAndNoContentHelpers(): void
    {
        $action = $this->createAction();
        $noAuth = $action->noAuth(new Response());
        $noContent = $action->noContent(new Response());

        self::assertSame(401, $noAuth->getStatusCode());
        self::assertSame(203, $noContent->getStatusCode());
    }

    public function testCreatePayloadWrapsData(): void
    {
        $action = $this->createAction();
        $payload = $action->createPayload(202, ['ok' => true]);

        self::assertInstanceOf(ActionPayload::class, $payload);
        self::assertSame(202, $payload->getStatusCode());
        self::assertSame(['ok' => true], $payload->getData());
    }

    public function testGetRequestContentTypeFallsBackToDefault(): void
    {
        $action = $this->createAction();
        $action->setDefaultContentType('application/json');

        self::assertSame('application/json', $action->getRequestContentType());
    }

    public function testCreatePersistsPayloadAndReturnsIdentifier(): void
    {
        $action = $this->createAction();
        $action->setContext($this->createRequest('POST', '/resource'), new Response(), []);
        $repository = new RepositoryStub();
        $action->setRepository($repository);
        $action->setDataPayload(['name' => 'Test']);

        $response = $action->callCreate($this->createRequest('POST', '/resource'), new Response());
        self::assertSame(200, $response->getStatusCode());
        $data = json_decode((string) $response->getBody(), true);
        self::assertSame(['id' => 99], $data['data']);
        self::assertSame([['name' => 'Test']], $repository->payloads);
    }

    public function testCreateReturnsBadRequestWhenPayloadMissing(): void
    {
        $action = $this->createAction();
        $response = $action->callCreate($this->createRequest('POST', '/resource'), new Response());

        self::assertSame(400, $response->getStatusCode());
    }

    public function testCheckEntityExistsThrowsNotFoundWhenRepositoryReturnsNone(): void
    {
        $this->expectException(\Slim\Exception\HttpNotFoundException::class);
        $this->expectExceptionMessage('Entity not found');

        $action = $this->createAction();
        $request = $this->createRequest('GET', '/resource/4');
        $action->setContext($request, new Response(), []);
        $action->setRepository(new class {
            public function getModel()
            {
                return new class {
                    public function findOne(array $criteria)
                    {
                        throw new \Exception('no records found', 0);
                    }
                };
            }
        });

        $action->callCheckEntityExists(4, $request);
    }

    public function testCheckEntityExistsReturnsEntityWhenFound(): void
    {
        $action = $this->createAction();
        $request = $this->createRequest('GET', '/resource/9');
        $entity = new \stdClass();

        $action->setContext($request, new Response(), []);
        $action->setRepository(new class($entity) {
            public function __construct(private object $entity)
            {
            }

            public function getModel()
            {
                return new class($this->entity) {
                    public function __construct(private object $entity)
                    {
                    }

                    public function findOne(array $criteria)
                    {
                        return $this->entity;
                    }
                };
            }
        });

        self::assertSame($entity, $action->callCheckEntityExists(9, $request));
    }

    public function testActionErrorSerialisesStructure(): void
    {
        $error = (new ActionError(ActionError::DOMAIN_ERROR, 'Invalid'))
            ->setFriendly('Oops');

        $this->assertSame(ActionError::DOMAIN_ERROR, $error->getType());
        $payload = json_decode(json_encode($error), true);
        $this->assertSame(
            ['type' => ActionError::DOMAIN_ERROR, 'description' => 'Invalid', 'friendly' => 'Oops'],
            $payload
        );
    }

    public function testActionPayloadIncludesErrorAndPager(): void
    {
        $payload = (new ActionPayload(400, null, new ActionError(ActionError::BAD_REQUEST, 'Bad')))
            ->setPager(new PaginatorStub());

        $this->assertSame(400, $payload->getStatusCode());
        $json = json_decode(json_encode($payload), true);
        $this->assertArrayHasKey('error', $json);
        $this->assertArrayHasKey('links', $json);
        $this->assertSame(['next' => '/next'], $json['links']);
    }

    private function createAction(): TestAction
    {
        $logger = $this->createMock(LoggerInterface::class);
        return new TestAction($logger);
    }
}

final class TestAction extends Action
{
    public function __construct(LoggerInterface $logger)
    {
        parent::__construct($logger);
    }

    public function setContext(Request $request, Response $response, array $args): void
    {
        $this->request = $request;
        $this->response = $response;
        $this->args = $args;
    }

    public function setRepository(object $repository): void
    {
        $this->repository = $repository;
    }

    public function setDefaultContentType(string $type): void
    {
        $this->defaultContentType = $type;
    }

    public function setDataPayload(array $data): void
    {
        $this->data = $data;
    }

    public function invokeResolve(string $name)
    {
        return $this->resolveArg($name);
    }

    public function callBadRequest(Response $response, array $error = [])
    {
        return $this->badRequest($response, $error);
    }

    public function callJsonResponse(ActionPayload $payload, int $status)
    {
        $this->response = new Response();
        return $this->jsonResponse($payload, $status);
    }

    public function callCreate(Request $request, Response $response)
    {
        return $this->create($request, $response);
    }

    public function callCheckEntityExists(int $id, Request $request)
    {
        return $this->checkEntityExists($id, $request);
    }
}

final class RepositoryStub
{
    public array $payloads = [];

    public function create(array $payload): int
    {
        $this->payloads[] = $payload;
        return 99;
    }
}

final class PaginatorStub extends Paginator
{
    public function __construct()
    {
        // Skip parent dependencies required by the real paginator.
    }

    public function jsonSerialize(): array
    {
        return ['next' => '/next'];
    }
}
