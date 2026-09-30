<?php
declare(strict_types=1);

namespace Tests\Application\Actions;

use App\Application\Actions\ActionError;
use App\Application\Actions\ActionPayload;
use Psr\Log\LoggerInterface;
use Slim\Psr7\Response;
use Tests\Application\Actions\Support\InstrumentedAction;
use Tests\TestCase;

final class ActionRespondTest extends TestCase
{
    public function testRespondWithDataSerialisesPayload(): void
    {
        $action = $this->makeAction();
        $data = ['status' => 'ok', 'count' => 2];

        $response = $action->respondWithData($data, 201);

        self::assertSame(201, $response->getStatusCode());
        self::assertSame('application/json', $response->getHeaderLine('Content-Type'));
        self::assertJsonStringEqualsJsonString(
            json_encode(new ActionPayload(201, $data), JSON_PRETTY_PRINT),
            (string) $response->getBody()
        );
    }

    public function testRespondWithDataHandlesNestedStructures(): void
    {
        $action = $this->makeAction();
        $payload = [
            'meta' => ['page' => 1, 'total' => 3],
            'items' => [
                ['id' => 10, 'details' => ['roles' => ['admin', 'user']]],
                ['id' => 11, 'details' => ['roles' => ['guest']]],
            ],
        ];

        $response = $action->respondWithData($payload);

        $body = json_decode((string) $response->getBody(), true);
        self::assertSame($payload, $body['data']);
    }

    public function testRespondWithErrorPayloadSerialisesActionError(): void
    {
        $action = $this->makeAction();
        $error = new ActionError('UNKNOWN', 'Something went wrong.');
        $payload = new ActionPayload(500, null, $error);

        $response = $action->respondWithPayload($payload, new Response());

        self::assertSame(500, $response->getStatusCode());
        $decoded = json_decode((string) $response->getBody(), true);
        self::assertSame(
            ['type' => 'UNKNOWN', 'description' => 'Something went wrong.', 'friendly' => 'An error has occured'],
            $decoded['error']
        );
    }

    public function testInvalidJsonHelperUsesCustomReasonPhrase(): void
    {
        $action = $this->makeAction();
        $response = $action->invalid(new Response());

        self::assertSame(400, $response->getStatusCode());
        self::assertSame('Invalid Json Supplied', $response->getReasonPhrase());
    }

    public function testRespondWithPayloadHandlesScalarData(): void
    {
        $action = $this->makeAction();
        $payload = new ActionPayload(200, 'simple');

        $response = $action->respondWithPayload($payload, new Response());
        $decoded = json_decode((string) $response->getBody(), true);

        self::assertSame('simple', $decoded['data']);
    }

    public function testRespondWithPayloadSupportsNoContentStatus(): void
    {
        $action = $this->makeAction();
        $payload = new ActionPayload(204, null);

        $response = $action->respondWithPayload($payload, new Response());

        self::assertSame(204, $response->getStatusCode());
        self::assertSame('[]', (string) $response->getBody());
    }

    /**
     * @dataProvider provideErrorMappings
     */
    public function testRespondWithErrorCoversCommonStatusMappings(int $status, string $type, string $message): void
    {
        $action = $this->makeAction();
        $payload = new ActionPayload($status, null, new ActionError($type, $message));

        $response = $action->respondWithError($payload, new Response());

        self::assertSame($status, $response->getStatusCode());
        $decoded = json_decode((string) $response->getBody(), true);
        self::assertArrayHasKey('error', $decoded);
        self::assertSame($type, $decoded['error']['type']);
        self::assertSame($message, $decoded['error']['description']);
    }

    public static function provideErrorMappings(): array
    {
        return [
            'bad-request' => [400, ActionError::BAD_REQUEST, 'Invalid input'],
            'unauthorized' => [401, ActionError::UNAUTHENTICATED, 'Auth required'],
            'forbidden' => [403, ActionError::INSUFFICIENT_PRIVILEGES, 'Access denied'],
            'not-found' => [404, ActionError::RESOURCE_NOT_FOUND, 'Missing'],
            'unprocessable' => [422, ActionError::VALIDATION_ERROR, 'Validation failed'],
            'server-error' => [503, ActionError::SERVER_ERROR, 'Service unavailable'],
        ];
    }

    public function testRespondWithDataDoesNotDuplicateHeaders(): void
    {
        $action = $this->makeAction();
        $response = $action->respondWithData(['id' => 1]);

        self::assertSame(['application/json'], $response->getHeader('Content-Type'));
    }

    private function makeAction(): InstrumentedAction
    {
        $logger = $this->createMock(LoggerInterface::class);
        $action = new InstrumentedAction($logger);
        $action->withRequest($this->createRequest('GET', '/respond'));
        $action->withResponse(new Response());
        $action->withArgs([]);

        return $action;
    }
}
