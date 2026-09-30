<?php
declare(strict_types=1);

namespace Tests\Application\Actions;

use Psr\Log\LoggerInterface;
use Slim\Exception\HttpBadRequestException;
use Slim\Psr7\Response;
use Tests\Application\Actions\Support\InstrumentedAction;
use Tests\TestCase;

final class ActionResolveArgTest extends TestCase
{
    /**
     * @dataProvider provideArgValues
     */
    public function testResolveArgReturnsTypedValue(mixed $value): void
    {
        $action = $this->makeAction(['value' => $value]);

        self::assertSame($value, $action->resolve('value'));
    }

    public static function provideArgValues(): array
    {
        return [
            'integer' => [42],
            'boolean' => [true],
            'boolean-false' => [false],
            'zero' => [0],
            'numeric-string' => ['007'],
            'string' => ['identifier'],
            'nested-array' => [['meta' => ['count' => 3]]],
        ];
    }

    public function testResolveArgThrowsBadRequestWhenArgumentMissing(): void
    {
        $action = $this->makeAction([]);

        try {
            $action->resolve('missing');
            self::fail('Expected HttpBadRequestException was not thrown.');
        } catch (HttpBadRequestException $exception) {
            self::assertSame('Could not resolve argument `missing`.', $exception->getMessage());
            self::assertSame(400, $exception->getCode());
            self::assertSame('400 Bad Request', $exception->getTitle());
        }
    }

    public function testResolveArgTreatsNullAsMissingArgument(): void
    {
        $action = $this->makeAction(['nullable' => null]);

        $this->expectException(HttpBadRequestException::class);
        $this->expectExceptionMessage('Could not resolve argument `nullable`.');

        $action->resolve('nullable');
    }

    private function makeAction(array $args): InstrumentedAction
    {
        $logger = $this->createMock(LoggerInterface::class);
        $action = new InstrumentedAction($logger);
        $action->withRequest($this->createRequest('GET', '/resource'));
        $action->withResponse(new Response());
        $action->withArgs($args);

        return $action;
    }
}
