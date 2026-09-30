<?php
declare(strict_types=1);

namespace Tests\Application\Middleware;

use App\Application\Middleware\TokenMiddleWare;
use App\Infrastructure\Environment;
use Psr\Http\Message\ResponseInterface;
use Psr\Http\Message\ServerRequestInterface as Request;
use Psr\Http\Server\RequestHandlerInterface;
use Slim\Psr7\Response;
use Tests\TestCase;

final class TokenMiddlewareTest extends TestCase
{
    protected function setUp(): void
    {
        parent::setUp();
        require_once dirname(__DIR__, 4) . '/src/Application/Middleware/TokenMiddleware.php';
    }

    protected function tearDown(): void
    {
        $this->setEnvironmentValues([]);
        parent::tearDown();
    }

    public function testGetTokenFromRequestPrefersHeader(): void
    {
        $middleware = new TokenMiddleWare();
        $request = $this->createRequest('GET', '/status')
            ->withHeader('api_token', 'header-token');

        self::assertSame('header-token', $middleware->getTokenFromRequest($request));
    }

    public function testGetTokenFromRequestFallsBackToQueryParam(): void
    {
        $middleware = new TokenMiddleWare();
        $request = $this->createRequest('GET', '/status')
            ->withQueryParams(['api_token' => 'query-token']);

        self::assertSame('query-token', $middleware->getTokenFromRequest($request));
    }

    public function testGetTokenFromRequestReturnsFalseWhenMissing(): void
    {
        $middleware = new TokenMiddleWare();
        $request = $this->createRequest('GET', '/status');

        self::assertFalse($middleware->getTokenFromRequest($request));
    }

    public function testProcessPassesThroughWhenDisabled(): void
    {
        $this->setEnvironmentValues(['API_TOKEN_ENABLED' => false]);
        $middleware = new TokenMiddleWare();
        $handlerResponse = new Response();
        $handler = new TestRequestHandler($handlerResponse);
        $request = $this->createRequest('GET', '/status');

        $response = $middleware->process($request, $handler);

        self::assertSame($handlerResponse, $response);
        self::assertCount(1, $handler->handledRequests);
        self::assertSame($request, $handler->handledRequests[0]);
    }

    public function testProcessAllowsRequestWithMatchingToken(): void
    {
        $this->setEnvironmentValues([
            'API_TOKEN_ENABLED' => true,
            'API_TOKEN' => 'secret-token',
        ]);
        $middleware = new TokenMiddleWare();
        $handlerResponse = new Response();
        $handler = new TestRequestHandler($handlerResponse);
        $request = $this->createRequest('GET', '/secure')
            ->withHeader('api_token', 'secret-token');

        $response = $middleware->process($request, $handler);

        self::assertSame($handlerResponse, $response);
        self::assertCount(1, $handler->handledRequests);
        self::assertSame($request, $handler->handledRequests[0]);
    }

    private function setEnvironmentValues(array $values): void
    {
        $ref = new \ReflectionClass(Environment::class);
        $prop = $ref->getProperty('values');
        $prop->setAccessible(true);
        $prop->setValue(null, $values);
    }
}

final class TestRequestHandler implements RequestHandlerInterface
{
    public array $handledRequests = [];

    public function __construct(private ResponseInterface $response)
    {
    }

    public function handle(Request $request): ResponseInterface
    {
        $this->handledRequests[] = $request;
        return $this->response;
    }
}
