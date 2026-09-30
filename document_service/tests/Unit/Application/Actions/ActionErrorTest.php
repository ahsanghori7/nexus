<?php

declare(strict_types=1);

namespace Tests\Unit\Application\Actions;

use App\Application\Actions\ActionError;
use PHPUnit\Framework\TestCase;

class ActionErrorTest extends TestCase
{
    public function testJsonSerializeIncludesTypeDescriptionAndFriendly(): void
    {
        $error = new ActionError(ActionError::BAD_REQUEST, 'Missing data');
        $error->setFriendly('Please provide all required fields');

        self::assertSame([
            'type' => ActionError::BAD_REQUEST,
            'description' => 'Missing data',
            'friendly' => 'Please provide all required fields',
        ], $error->jsonSerialize());
    }

    public function testGettersAndSettersUpdateValues(): void
    {
        $error = new ActionError(ActionError::DOMAIN_ERROR, 'Initial');

        $error->setType(ActionError::NOT_ALLOWED)
            ->setDescription('Updated')
            ->setFriendly('Try again later');

        self::assertSame(ActionError::NOT_ALLOWED, $error->getType());
        self::assertSame('Updated', $error->getDescription());
        self::assertSame('Try again later', $error->getFriendly());
    }
}
