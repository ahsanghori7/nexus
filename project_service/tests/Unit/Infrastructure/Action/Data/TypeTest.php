<?php

declare(strict_types=1);

namespace Tests\Unit\Infrastructure\Action\Data;

use App\Infrastructure\Action\Data\Type;
use PHPUnit\Framework\TestCase;

class TypeTest extends TestCase
{
    public function testParseReturnsAssociativeArray(): void
    {
        self::assertSame(['foo' => 'bar'], Type::parse('application/json', '{"foo":"bar"}'));
    }

    public function testParseReturnsNullForInvalidJson(): void
    {
        self::assertNull(Type::parse('application/json', '{broken'));
    }
}
