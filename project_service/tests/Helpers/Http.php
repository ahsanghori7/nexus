<?php

declare(strict_types=1);

namespace Tests\Helpers;

use PHPUnit\Framework\Assert;
use Psr\Http\Message\ResponseInterface;
use Psr\Http\Message\ServerRequestInterface;
use Slim\Psr7\Factory\ResponseFactory;
use Slim\Psr7\Factory\ServerRequestFactory;
use Slim\Psr7\Factory\StreamFactory;

final class Http
{
    public static function jsonRequest(string $method, string $path, ?array $body = null, array $query = []): ServerRequestInterface
    {
        $request = (new ServerRequestFactory())->createServerRequest($method, $path);
        if ($query) {
            $request = $request->withQueryParams($query);
        }

        if ($body !== null) {
            $stream = (new StreamFactory())->createStream(json_encode($body, JSON_THROW_ON_ERROR));
            $request = $request->withBody($stream);
        }

        return $request->withHeader('Content-Type', 'application/json');
    }

    public static function response(): ResponseInterface
    {
        return (new ResponseFactory())->createResponse();
    }

    /**
     * Decode the JSON body and return the associative array
     *
     * @return array<string, mixed>
     */
    public static function decode(ResponseInterface $response): array
    {
        $decoded = json_decode((string) $response->getBody(), true);
        return is_array($decoded) ? $decoded : [];
    }

    /**
     * Assert status code and that response JSON contains subset
     *
     * @param array<string, mixed> $expected
     */
    public static function assertJson(ResponseInterface $response, int $status, array $expected = []): void
    {
        Assert::assertSame($status, $response->getStatusCode(), 'Unexpected status code');
        if ($expected) {
            $decoded = self::decode($response);
            foreach ($expected as $key => $value) {
                Assert::assertEquals($value, $decoded[$key] ?? null);
            }
        }
    }
}
