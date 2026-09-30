<?php

declare(strict_types=1);

namespace Tests\Unit\Infrastructure\Action;

use App\Infrastructure\Action\Data\Type;
use PHPUnit\Framework\TestCase;

class TypeTest extends TestCase
{
    public function testParseReturnsAssociativeArray(): void
    {
        $result = Type::parse('application/json', '{"foo":"bar","count":3}');

        self::assertSame(['foo' => 'bar', 'count' => 3], $result);
    }

    public function testParseReturnsNullForInvalidJson(): void
    {
        self::assertNull(Type::parse('application/json', '{invalid json'));
    }
}
