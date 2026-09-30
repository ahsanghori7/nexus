<?php

declare(strict_types=1);

namespace Tests\Unit\Application\Actions;

use App\Application\Actions\ActionError;
use PHPUnit\Framework\TestCase;

class ActionErrorTest extends TestCase
{
    public function testAccessorsAndMutation(): void
    {
        $error = new ActionError(ActionError::NOT_ALLOWED, 'Initial');

        self::assertSame(ActionError::NOT_ALLOWED, $error->getType());
        self::assertSame('Initial', $error->getDescription());
        self::assertSame('An error has occured', $error->getFriendly());

        $error->setType(ActionError::SERVER_ERROR)
            ->setDescription('Changed')
            ->setFriendly('Readable');

        self::assertSame(ActionError::SERVER_ERROR, $error->getType());
        self::assertSame('Changed', $error->getDescription());
        self::assertSame('Readable', $error->getFriendly());
    }

    public function testJsonSerialize(): void
    {
        $error = (new ActionError(ActionError::BAD_REQUEST, 'Invalid'))->setFriendly('Friendly');

        self::assertSame(
            [
                'type' => ActionError::BAD_REQUEST,
                'description' => 'Invalid',
                'friendly' => 'Friendly',
            ],
            $error->jsonSerialize()
        );
    }
}
