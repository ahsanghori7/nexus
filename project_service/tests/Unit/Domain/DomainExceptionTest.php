<?php

declare(strict_types=1);

namespace Tests\Unit\Domain;

use App\Domain\DomainException;
use PHPUnit\Framework\TestCase;

class DomainExceptionTest extends TestCase
{
    public function testDuplicateEntryMessageIsHumanFriendly(): void
    {
        $message = "SQLSTATE[23000]: Integrity constraint violation: 1062 Duplicate entry 'Example' for key 'project.name'";
        $exception = new DomainException($message);

        self::assertSame('name already exists', $exception->getFriendly());
    }

    public function testForeignKeyMessageIsMapped(): void
    {
        $message = "SQLSTATE[23000]: Integrity constraint violation: 1452 Cannot add or update a child row: a foreign key constraint fails (`project`.`table`, CONSTRAINT `fk_name` FOREIGN KEY (`project_id`) REFERENCES `project` (`id`))";
        $exception = new DomainException($message);

        self::assertSame('Incorrect value for project_id', $exception->getFriendly());
    }

    public function testReturnsOriginalMessageWhenNoTemplateMatches(): void
    {
        $exception = new DomainException('Unhandled message');
        self::assertSame('Unhandled message', $exception->getFriendly());
    }
}
