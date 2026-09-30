<?php
declare(strict_types=1);

namespace Tests\Application\ResponseEmitter;

use App\Application\ResponseEmitter\ResponseEmitter;
use PHPUnit\Framework\TestCase;
use Slim\Psr7\Factory\StreamFactory;
use Slim\Psr7\Response;

final class ResponseEmitterTest extends TestCase
{
    protected function setUp(): void
    {
        parent::setUp();
        header_remove();
        unset($_SERVER['HTTP_ORIGIN']);
    }

    protected function tearDown(): void
    {
        parent::tearDown();
        header_remove();
        unset($_SERVER['HTTP_ORIGIN']);
    }

    public function testEmitSetsCorsHeadersUsingOrigin(): void
    {
        header_remove();
        $_SERVER['HTTP_ORIGIN'] = 'https://client.test';
        $response = $this->createResponseWithBody('payload');

        ob_start();
        echo 'buffered';
        (new ResponseEmitter())->emit($response);
        $output = ob_get_clean();

        self::assertSame('payload', $output);
        $headers = $this->getHeaders();
        self::assertContains('Access-Control-Allow-Credentials: true', $headers);
        self::assertContains('Access-Control-Allow-Origin: https://client.test', $headers);
        self::assertContains(
            'Access-Control-Allow-Headers: X-Requested-With, Content-Type, Accept, Origin, Authorization',
            $headers
        );
        self::assertContains('Access-Control-Allow-Methods: GET, POST, PUT, PATCH, DELETE, OPTIONS', $headers);
        self::assertContains('Cache-Control: no-store, no-cache, must-revalidate, max-age=0', $headers);
        self::assertContains('Cache-Control: post-check=0, pre-check=0', $headers);
        self::assertContains('Pragma: no-cache', $headers);
    }

    public function testEmitDefaultsOriginWhenHeaderMissing(): void
    {
        header_remove();
        $response = $this->createResponseWithBody('ok');

        ob_start();
        (new ResponseEmitter())->emit($response);
        $output = ob_get_clean();

        self::assertSame('ok', $output);
        $headers = $this->getHeaders();
        $matched = array_filter($headers, static fn($header) => str_starts_with($header, 'Access-Control-Allow-Origin:'));
        self::assertNotEmpty($matched);
    }

    private function createResponseWithBody(string $body): Response
    {
        $factory = new StreamFactory();
        $stream = $factory->createStream($body);

        return (new Response())->withBody($stream);
    }

    /**
     * @return string[]
     */
    private function getHeaders(): array
    {
        if (function_exists('xdebug_get_headers')) {
            return xdebug_get_headers();
        }

        return headers_list();
    }
}
