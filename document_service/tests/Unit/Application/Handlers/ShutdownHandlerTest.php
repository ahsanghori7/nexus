<?php
declare(strict_types=1);

namespace App\Application\Handlers;

if (!function_exists(__NAMESPACE__ . '\error_get_last')) {
    function error_get_last()
    {
        return \Tests\Application\Handlers\ShutdownHandlerTest::consumeNextError() ?? \error_get_last();
    }
}

namespace Tests\Application\Handlers;

use App\Application\Handlers\HttpErrorHandler;
use App\Application\Handlers\ShutdownHandler;
use PHPUnit\Framework\TestCase;
use Slim\CallableResolver;
use Slim\Psr7\Factory\ResponseFactory;
use Slim\Psr7\Factory\ServerRequestFactory;

final class ShutdownHandlerTest extends TestCase
{
    public static ?array $nextError = null;

    protected function setUp(): void
    {
        parent::setUp();
        header_remove();
    }

    protected function tearDown(): void
    {
        parent::tearDown();
        self::$nextError = null;
        header_remove();
    }

    public static function consumeNextError(): ?array
    {
        $error = self::$nextError;
        self::$nextError = null;
        return $error;
    }

    public function testInvokeDoesNothingWhenNoError(): void
    {
        self::$nextError = null;
        $handler = $this->createHandler(false);

        ob_start();
        $handler();
        $output = ob_get_clean();

        self::assertSame('', $output);
        self::assertSame([], $this->getHeaders());
    }

    public function testInvokeUsesGenericMessageWhenDisplayDisabled(): void
    {
        self::$nextError = [
            'type' => E_USER_ERROR,
            'message' => 'Fatal',
            'file' => 'file.php',
            'line' => 10,
        ];
        $handler = $this->createHandler(false);

        ob_start();
        $handler();
        $payload = json_decode((string) ob_get_clean(), true, 512, JSON_THROW_ON_ERROR);

        self::assertSame(500, http_response_code());
        self::assertSame(
            'An error while processing your request. Please try again later.',
            $payload['error']['description']
        );
        self::assertContains('Content-Type: application/json', $this->getHeaders());
    }

    /**
     * @dataProvider errorTypeProvider
     */
    public function testInvokeIncludesDetailedMessageWhenEnabled(int $errorType, string $expectedPrefix): void
    {
        self::$nextError = [
            'type' => $errorType,
            'message' => 'Exploded',
            'file' => 'detail.php',
            'line' => 42,
        ];
        $handler = $this->createHandler(true);

        ob_start();
        $handler();
        $payload = json_decode((string) ob_get_clean(), true, 512, JSON_THROW_ON_ERROR);

        self::assertStringStartsWith($expectedPrefix, $payload['error']['description']);
        self::assertContains('Content-Type: application/json', $this->getHeaders());
    }

    public static function errorTypeProvider(): array
    {
        return [
            'fatal' => [E_USER_ERROR, 'FATAL ERROR'],
            'warning' => [E_USER_WARNING, 'WARNING'],
            'notice' => [E_USER_NOTICE, 'NOTICE'],
            'default' => [E_USER_DEPRECATED, 'ERROR'],
        ];
    }

    private function createHandler(bool $displayErrorDetails): ShutdownHandler
    {
        $request = (new ServerRequestFactory())->createServerRequest('GET', '/shutdown');
        $errorHandler = new HttpErrorHandler(new CallableResolver(null), new ResponseFactory());

        return new ShutdownHandler($request, $errorHandler, $displayErrorDetails);
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
