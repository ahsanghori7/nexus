<?php
declare(strict_types=1);

namespace Tests\Application\Actions;

require_once __DIR__ . '/Support/ActionOverrides.php';

use Psr\Log\LoggerInterface;
use Slim\Exception\HttpBadRequestException;
use Slim\Psr7\Response;
use Tests\Application\Actions\Support\InstrumentedAction;
use Tests\Application\Actions\Support\PhpInput;
use Tests\TestCase;

final class ActionRequestParsingTest extends TestCase
{
    protected function tearDown(): void
    {
        PhpInput::clear();
        parent::tearDown();
    }

    /**
     * @dataProvider provideJsonPayloads
     */
    public function testGetDataParsesJsonPayload(array $payload): void
    {
        PhpInput::set(json_encode($payload, JSON_THROW_ON_ERROR));
        $action = $this->makeAction();

        self::assertSame($payload, $action->data());
    }

    public static function provideJsonPayloads(): array
    {
        return [
            'simple payload' => [['name' => 'Alice', 'active' => true, 'age' => 30]],
            'nested structure' => [[
                'meta' => ['count' => 2, 'filters' => ['role' => 'admin']],
                'items' => [
                    ['id' => 1, 'flags' => ['a' => true, 'b' => false]],
                    ['id' => 2, 'flags' => ['a' => false, 'b' => true]],
                ],
            ]],
            'large payload' => [[
                'records' => array_map(
                    static fn (int $index): array => [
                        'id' => $index,
                        'values' => [
                            'enabled' => $index % 2 === 0,
                            'score' => $index * 1.5 + 0.1,
                            'tags' => ['x', 'y', 'z'],
                        ],
                    ],
                    range(1, 25)
                ),
            ]],
        ];
    }

    public function testGetDataReturnsDefaultForMissingKey(): void
    {
        PhpInput::set('{"primary": "value"}');
        $action = $this->makeAction();
        $action->data(); // prime cache

        self::assertSame('fallback', $action->data('missing', 'fallback'));
    }

    public function testGetDataHandlesEmptyPayloadGracefully(): void
    {
        PhpInput::clear();
        $action = $this->makeAction();

        self::assertSame([], $action->data());
    }

    public function testGetDataReturnsNullForInvalidJsonButDoesNotFatal(): void
    {
        PhpInput::set('{"unterminated": true');
        $action = $this->makeAction();

        self::assertNull($action->data());
        self::assertSame('fallback', $action->data('missing', 'fallback'));
    }

    public function testGetDataUsesCachedPayloadWhenAlreadyInitialised(): void
    {
        PhpInput::set('{"should": "be ignored"}');
        $action = $this->makeAction(['cached' => true]);

        self::assertSame(['cached' => true], $action->data());
    }

    public function testGetDataParsesWhenContentTypeIsFormUrlencoded(): void
    {
        PhpInput::set(json_encode(['form' => 'value', 'count' => '3'], JSON_THROW_ON_ERROR));
        $action = $this->makeAction([], 'application/x-www-form-urlencoded');

        self::assertSame(
            ['form' => 'value', 'count' => '3'],
            $action->data()
        );
    }

    public function testGetDataFallsBackToServerContentType(): void
    {
        PhpInput::set('{"option": "value"}');
        $_SERVER['CONTENT_TYPE'] = 'application/json; charset=utf-8';

        try {
            $action = $this->makeAction([], null);
            self::assertSame('application/json; charset=utf-8', $action->getRequestContentType());
            self::assertSame(['option' => 'value'], $action->data());
        } finally {
            unset($_SERVER['CONTENT_TYPE']);
        }
    }

    public function testGetFormDataReturnsDecodedObject(): void
    {
        PhpInput::set('{"id": 7, "enabled": false}');
        $action = $this->makeAction();

        $formData = $action->formData();
        self::assertIsObject($formData);
        self::assertSame(7, $formData->id);
        self::assertFalse($formData->enabled);
    }

    public function testGetFormDataThrowsOnMalformedJson(): void
    {
        $this->expectException(HttpBadRequestException::class);
        $this->expectExceptionMessage('Malformed JSON input.');

        PhpInput::set('{"unclosed": true');
        $action = $this->makeAction();

        $action->formData();
    }

    private function makeAction(array $data = [], ?string $defaultContentType = 'application/json'): InstrumentedAction
    {
        $logger = $this->createMock(LoggerInterface::class);
        $action = new InstrumentedAction($logger);
        $action->withRequest($this->createRequest('POST', '/input'));
        $action->withResponse(new Response());
        $action->withArgs([]);
        if ($defaultContentType !== null) {
            $action->withDefaultContentType($defaultContentType);
        }
        $action->withData($data);

        return $action;
    }
}
