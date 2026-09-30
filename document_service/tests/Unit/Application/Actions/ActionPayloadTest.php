<?php

declare(strict_types=1);

namespace Tests\Unit\Application\Actions;

use App\Application\Actions\ActionError;
use App\Application\Actions\ActionPayload;
use App\Infrastructure\Action\Paginator;
use PHPUnit\Framework\TestCase;

class ActionPayloadTest extends TestCase
{
    public function testJsonSerializeReturnsDataWhenPresent(): void
    {
        $payload = new ActionPayload(201, ['ok' => true]);

        self::assertSame(201, $payload->getStatusCode());
        self::assertSame(['ok' => true], $payload->getData());
        self::assertNull($payload->getError());
        self::assertSame(['data' => ['ok' => true]], $payload->jsonSerialize());
    }

    public function testJsonSerializeFallsBackToErrorWhenNoData(): void
    {
        $error = new ActionError(ActionError::SERVER_ERROR, 'oops');
        $payload = new ActionPayload(500, null, $error);

        self::assertSame($error, $payload->getError());
        self::assertSame(['error' => $error], $payload->jsonSerialize());
    }

    public function testPagerIsIncludedWhenSet(): void
    {
        $pager = $this->createMock(Paginator::class);
        $pager->method('jsonSerialize')->willReturn(['next' => '/next']);

        $payload = (new ActionPayload(200, ['items' => []]))->setPager($pager);

        self::assertSame([
            'data' => ['items' => []],
            'links' => $pager,
        ], $payload->jsonSerialize());
    }
}
