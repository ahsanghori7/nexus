<?php

declare(strict_types=1);

namespace Tests\Unit\Application\Actions;

use App\Application\Actions\ActionError;
use App\Application\Actions\ActionPayload;
use App\Infrastructure\Action\Paginator;
use PHPUnit\Framework\TestCase;

class ActionPayloadTest extends TestCase
{
    public function testDefaultsAndGetters(): void
    {
        $payload = new ActionPayload();

        self::assertSame(200, $payload->getStatusCode());
        self::assertNull($payload->getData());
        self::assertNull($payload->getError());
    }

    public function testJsonSerializeWithDataAndPager(): void
    {
        $payload = new ActionPayload(202, ['foo' => 'bar']);
        $payload->setPager(new class extends Paginator {
            public function __construct() {}
            public function jsonSerialize(): array
            {
                return ['next' => '/v1/projects?offset=10'];
            }
        });

        $json = json_encode($payload, JSON_THROW_ON_ERROR);

        self::assertJsonStringEqualsJsonString(
            json_encode([
                'data' => ['foo' => 'bar'],
                'links' => ['next' => '/v1/projects?offset=10'],
            ], JSON_THROW_ON_ERROR),
            $json
        );
    }

    public function testJsonSerializeWithError(): void
    {
        $error = new ActionError(ActionError::BAD_REQUEST, 'nope');
        $payload = new ActionPayload(400, null, $error);

        self::assertSame(
            ['error' => $error],
            $payload->jsonSerialize()
        );
    }
}
