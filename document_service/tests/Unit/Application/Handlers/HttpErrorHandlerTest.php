<?php
declare(strict_types=1);

namespace Tests\Application\Handlers;

use App\Application\Actions\ActionError;
use App\Application\Handlers\HttpErrorHandler;
use App\Domain\DomainException;
use PHPUnit\Framework\TestCase;
use Slim\CallableResolver;
use Slim\Exception\HttpBadRequestException;
use Slim\Exception\HttpForbiddenException;
use Slim\Exception\HttpMethodNotAllowedException;
use Slim\Exception\HttpNotFoundException;
use Slim\Exception\HttpNotImplementedException;
use Slim\Exception\HttpUnauthorizedException;
use Slim\Psr7\Factory\ResponseFactory;
use Slim\Psr7\Factory\ServerRequestFactory;

final class HttpErrorHandlerTest extends TestCase
{
    /**
     * @dataProvider httpExceptionProvider
     */
    public function testHttpExceptionsAreMapped(callable $exceptionFactory, int $statusCode, string $type): void
    {
        $handler = $this->createHandler();
        $request = (new ServerRequestFactory())->createServerRequest('GET', '/test');
        $response = $handler(
            $request,
            $exceptionFactory($request),
            false,
            false,
            false
        );

        self::assertSame($statusCode, $response->getStatusCode());
        self::assertSame('application/json', $response->getHeaderLine('Content-Type'));

        $payload = json_decode((string) $response->getBody(), true, 512, JSON_THROW_ON_ERROR);
        self::assertSame($type, $payload['error']['type']);
    }

    public function testNonHttpThrowableIncludesDetailsWhenDisplayEnabled(): void
    {
        $handler = $this->createHandler();
        $request = (new ServerRequestFactory())->createServerRequest('GET', '/test');
        $exception = new \RuntimeException('Boom');

        $response = $handler($request, $exception, true, false, false);

        $payload = json_decode((string) $response->getBody(), true, 512, JSON_THROW_ON_ERROR);
        self::assertSame(500, $response->getStatusCode());
        self::assertStringContainsString('Boom', $payload['error']['description']);
    }

    public function testNonHttpThrowableHidesDetailsWhenDisabled(): void
    {
        $handler = $this->createHandler();
        $request = (new ServerRequestFactory())->createServerRequest('GET', '/test');

        $response = $handler($request, new \RuntimeException('Boom'), false, false, false);

        $payload = json_decode((string) $response->getBody(), true, 512, JSON_THROW_ON_ERROR);
        self::assertSame(
            'An internal error has occurred while processing your request.',
            $payload['error']['description']
        );
    }

    public function testDomainExceptionMapsToDomainError(): void
    {
        $handler = $this->createHandler();
        $request = (new ServerRequestFactory())->createServerRequest('GET', '/categories/1');

        $response = $handler($request, new DomainException('duplicate category'), true, false, false);

        $payload = json_decode((string) $response->getBody(), true, 512, JSON_THROW_ON_ERROR);
        self::assertSame(500, $response->getStatusCode());
        self::assertSame(ActionError::DOMAIN_ERROR, $payload['error']['type']);
        self::assertSame('duplicate category', $payload['error']['description']);
        self::assertSame('duplicate category', $payload['error']['friendly']);
    }

    public static function httpExceptionProvider(): array
    {
        return [
            'not found' => [
                static fn($request) => new HttpNotFoundException($request),
                404,
                ActionError::RESOURCE_NOT_FOUND,
            ],
            'method not allowed' => [
                static function ($request) {
                    $exception = new HttpMethodNotAllowedException($request);
                    $exception->setAllowedMethods(['GET']);
                    return $exception;
                },
                405,
                ActionError::NOT_ALLOWED,
            ],
            'unauthorized' => [
                static fn($request) => new HttpUnauthorizedException($request),
                401,
                ActionError::UNAUTHENTICATED,
            ],
            'forbidden' => [
                static fn($request) => new HttpForbiddenException($request),
                403,
                ActionError::INSUFFICIENT_PRIVILEGES,
            ],
            'bad request' => [
                static fn($request) => new HttpBadRequestException($request),
                400,
                ActionError::BAD_REQUEST,
            ],
            'not implemented' => [
                static fn($request) => new HttpNotImplementedException($request),
                501,
                ActionError::NOT_IMPLEMENTED,
            ],
        ];
    }

    private function createHandler(): HttpErrorHandler
    {
        return new HttpErrorHandler(new CallableResolver(null), new ResponseFactory());
    }
}
