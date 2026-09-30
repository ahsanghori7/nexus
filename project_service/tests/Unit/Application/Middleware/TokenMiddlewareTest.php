<?php

declare(strict_types=1);

namespace Tests\Unit\Application\Middleware;

use App\Application\Middleware\TokenMiddleware;
use App\Infrastructure\Environment;
use PHPUnit\Framework\TestCase;
use Psr\Http\Message\ResponseInterface;
use Psr\Http\Server\RequestHandlerInterface;
use Slim\Psr7\Factory\ResponseFactory;
use Slim\Psr7\Factory\ServerRequestFactory;

class TokenMiddlewareTest extends TestCase
{
    protected function setUp(): void
    {
        Environment::reset();
    }

    public function testSkipsWhenDisabled(): void
    {
        $this->setEnvValues([ 'API_TOKEN_ENABLED' => 'false' ]);
        $middleware = new TokenMiddleware(new ResponseFactory());
        $handler = new RecordingHandler();
        $request = (new ServerRequestFactory())->createServerRequest('GET', '/');

        $response = $middleware->process($request, $handler);

        self::assertSame(1, $handler->handled);  // Handler should run once
        self::assertSame(200, $response->getStatusCode());
    }

    public function testReturnsForbiddenWhenTokenMissing(): void
    {
        $this->setEnvValues([
            'API_TOKEN_ENABLED' => 'true',
            'API_TOKEN' => 'secret',
        ]);
        $middleware = new TokenMiddleware(new ResponseFactory());
        $handler = new RecordingHandler();
        $request = (new ServerRequestFactory())->createServerRequest('GET', '/');

        $response = $middleware->process($request, $handler);

        self::assertSame(403, $response->getStatusCode());
        self::assertSame(0, $handler->handled);
    }

    public function testReturnsUnauthorizedWhenTokenDoesNotMatch(): void
    {
        $this->setEnvValues([
            'API_TOKEN_ENABLED' => 'true',
            'API_TOKEN' => 'secret',
        ]);
        $middleware = new TokenMiddleware(new ResponseFactory());
        $handler = new RecordingHandler();
        $request = (new ServerRequestFactory())
            ->createServerRequest('GET', '/')
            ->withHeader('api_token', 'nope');

        $response = $middleware->process($request, $handler);

        self::assertSame(401, $response->getStatusCode());
        self::assertSame(0, $handler->handled);
    }

    public function testPassesThroughWhenTokenMatches(): void
    {
        $this->setEnvValues([
            'API_TOKEN_ENABLED' => 'true',
            'API_TOKEN' => 'secret',
        ]);
        $middleware = new TokenMiddleware(new ResponseFactory());
        $handler = new RecordingHandler();
        $request = (new ServerRequestFactory())
            ->createServerRequest('GET', '/')
            ->withQueryParams(['api_token' => 'secret']);

        $response = $middleware->process($request, $handler);

        self::assertSame(200, $response->getStatusCode());
        self::assertSame(1, $handler->handled);
    }

    public function testThrowsWhenEnabledWithoutToken(): void
    {
        $this->setEnvValues([
            'API_TOKEN_ENABLED' => 'true',
        ]);
        $middleware = new TokenMiddleware(new ResponseFactory());

        $this->expectException(\Exception::class);
        $middleware->process((new ServerRequestFactory())->createServerRequest('GET', '/'), new RecordingHandler());
    }

    /**
     * @param array<string, string> $pairs
     */
    private function setEnvValues(array $pairs): void
    {
        $contents = '';
        foreach ($pairs as $key => $value) {
            $contents .= sprintf("%s=%s\n", $key, $value);
        }

        $path = tempnam(sys_get_temp_dir(), 'env');
        file_put_contents($path, $contents);
        Environment::loadEnvFile(dirname($path), basename($path));
        unlink($path);
    }
}

class RecordingHandler implements RequestHandlerInterface
{
    public int $handled = 0;

    public function handle(\Psr\Http\Message\ServerRequestInterface $request): ResponseInterface
    {
        $this->handled++;
        return (new ResponseFactory())->createResponse();
    }
}
