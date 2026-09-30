<?php
declare(strict_types=1);

namespace Tests\Domain;

use App\Domain\DomainException;
use PHPUnit\Framework\TestCase;

final class DomainExceptionTest extends TestCase
{
    public function testFriendlyMessageForDuplicateEntry(): void
    {
        $exception = new DomainException("SQLSTATE[23000]: 1062 Duplicate entry 'foo' for key 'accounts.email'");

        self::assertSame('email already exists', $exception->getFriendly());
    }

    public function testFriendlyMessageFallsBackToOriginal(): void
    {
        $exception = new DomainException('Unrelated failure');

        self::assertSame('Unrelated failure', $exception->getFriendly());
    }

    public function testFriendlyMessageReturnsEmptyStringWhenNoMessage(): void
    {
        $exception = new DomainException('');

        self::assertSame('', $exception->getFriendly());
    }
}
