<?php
declare(strict_types=1);

namespace Tests\TestDoubles;

use Psr\Http\Message\ResponseInterface;

class GuzzleClientStub
{
    private static bool $registered = false;

    /**
     * @var array<int, array{url:string, options:array}>
     */
    public static array $requests = [];

    /**
     * @var array<int, ResponseInterface>
     */
    private static array $responses = [];

    private static ?\Throwable $exception = null;

    public static function register(): void
    {
        if (self::$registered) {
            return;
        }

        if (class_exists(\GuzzleHttp\Client::class, false)) {
            if (!is_subclass_of(\GuzzleHttp\Client::class, self::class, true)
                && \GuzzleHttp\Client::class !== self::class) {
                throw new \RuntimeException('Unable to replace existing GuzzleHttp\Client with stub.');
            }
            self::$registered = true;
            return;
        }

        class_alias(self::class, \GuzzleHttp\Client::class);
        self::$registered = true;
    }

    public static function reset(): void
    {
        self::$requests = [];
        self::$responses = [];
        self::$exception = null;
    }

    public static function queueResponse(ResponseInterface $response): void
    {
        self::$responses[] = $response;
    }

    public static function queueException(?\Throwable $exception): void
    {
        self::$exception = $exception;
    }

    public function post(string $url, array $options = [])
    {
        self::$requests[] = ['url' => $url, 'options' => $options];

        if (self::$exception) {
            $exception = self::$exception;
            self::$exception = null;
            throw $exception;
        }

        if (!self::$responses) {
            throw new \RuntimeException('No queued response available for GuzzleClientStub.');
        }

        return array_shift(self::$responses);
    }

    public function sendAsync(\GuzzleHttp\Psr7\Request $request, array $options = [])
    {
        return $this->post((string) $request->getUri(), $options);
    }
}
