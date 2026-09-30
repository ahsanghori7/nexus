<?php
declare(strict_types=1);

namespace Tests\Application\Actions;

use App\Application\Actions\Action;
use App\Application\Actions\ActionPayload;
use DateTimeImmutable;
use Psr\Log\LoggerInterface;
use Slim\Psr7\Response;
use Tests\TestCase;

class ActionTest extends TestCase
{
    private function createAction(LoggerInterface $logger): Action
    {
        return new class($logger) extends Action {
            public function __construct(private LoggerInterface $testLogger)
            {
                parent::__construct($this->testLogger);
            }

            public function respondWithPayload(ActionPayload $payload): Response
            {
                return $this->respond(new Response(), $payload);
            }

            public function respondWithData(array $data, int $status = 200): Response
            {
                return $this->respondWithPayload(new ActionPayload($status, $data));
            }
        };
    }

    public function testRespondWritesJsonPayloadAndStatusCode(): void
    {
        $logger = $this->createMock(LoggerInterface::class);
        $action = $this->createAction($logger);

        $payload = new ActionPayload(
            202,
            [
                'willBeDoneAt' => (new DateTimeImmutable())->format(DateTimeImmutable::ATOM),
            ]
        );

        $response = $action->respondWithPayload($payload);

        $this->assertSame(202, $response->getStatusCode());
        $this->assertSame('application/json', $response->getHeaderLine('Content-Type'));
        $this->assertJsonStringEqualsJsonString(
            json_encode($payload, JSON_PRETTY_PRINT),
            (string) $response->getBody()
        );
    }

    public function testRespondWithDataBuildsPayload(): void
    {
        $logger = $this->createMock(LoggerInterface::class);
        $action = $this->createAction($logger);

        $response = $action->respondWithData(['foo' => 'bar'], 201);

        $this->assertSame(201, $response->getStatusCode());
        $this->assertJsonStringEqualsJsonString(
            json_encode(new ActionPayload(201, ['foo' => 'bar']), JSON_PRETTY_PRINT),
            (string) $response->getBody()
        );
    }
}
