<?php

declare(strict_types=1);

namespace Tests\Helpers;

use PHPUnit\Framework\MockObject\MockBuilder;
use PHPUnit\Framework\MockObject\MockObject;
use PHPUnit\Framework\TestCase;
use Psr\Log\LoggerInterface;
use Psr\Log\NullLogger;
use ReflectionClass;

final class Mocks
{
    /**
     * Create a simple builder style double with fluent methods.
     *
     * @param array<int, string> $methods
     */
    public static function builder(TestCase $test, array $methods): MockObject
    {
        return (new MockBuilder($test, \stdClass::class))
            ->addMethods($methods)
            ->getMock();
    }

    public static function logger(): LoggerInterface
    {
        return new NullLogger();
    }

    /**
     * Override Action::$data without relying on php://input reads.
     *
     * @param array<string, mixed> $data
     */
    public static function seedActionData(object $action, array $data): void
    {
        self::setProperty($action, 'data', $data);
    }

    /**
     * Force-inject dependencies into protected Action properties.
     *
     * @param mixed $value
     */
    public static function setProperty(object $target, string $property, $value): void
    {
        $ref = new ReflectionClass($target);
        while ($ref) {
            if ($ref->hasProperty($property)) {
                $prop = $ref->getProperty($property);
                $prop->setAccessible(true);
                $prop->setValue($target, $value);
                return;
            }
            $ref = $ref->getParentClass();
        }

        throw new \InvalidArgumentException(sprintf('Property %s not found on %s', $property, get_class($target)));
    }
}
