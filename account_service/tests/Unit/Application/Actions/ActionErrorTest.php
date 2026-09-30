<?php
declare(strict_types=1);

namespace Tests\Application\Actions;

use App\Application\Actions\ActionError;
use App\Application\Actions\ActionPayload;
use PHPUnit\Framework\Attributes\DataProvider;
use Tests\TestCase;

final class ActionErrorTest extends TestCase
{
    #[DataProvider('errorTypeProvider')]
    public function testConstructorExposesProvidedTypeAndDescription(string $type, ?string $description): void
    {
        $error = new ActionError($type, $description);

        self::assertSame($type, $error->getType());
        self::assertSame($description, $error->getDescription());
        self::assertSame('An error has occured', $error->getFriendly());

        $json = json_decode(json_encode($error, JSON_THROW_ON_ERROR), true, 512, JSON_THROW_ON_ERROR);
        self::assertSame(
            ['type' => $type, 'description' => $description, 'friendly' => 'An error has occured'],
            $json
        );
    }

    public static function errorTypeProvider(): iterable
    {
        yield [ActionError::BAD_REQUEST, 'Request payload missing fields'];
        yield [ActionError::INSUFFICIENT_PRIVILEGES, 'Insufficient privileges for this action'];
        yield [ActionError::NOT_ALLOWED, 'Operation not allowed'];
        yield [ActionError::NOT_IMPLEMENTED, 'Feature not implemented'];
        yield [ActionError::RESOURCE_NOT_FOUND, 'Resource does not exist'];
        yield [ActionError::SERVER_ERROR, 'Unexpected server error'];
        yield [ActionError::UNAUTHENTICATED, 'Authentication required'];
        yield [ActionError::VALIDATION_ERROR, 'Validation failed'];
        yield [ActionError::VERIFICATION_ERROR, 'Verification failed'];
        yield [ActionError::DOMAIN_ERROR, 'Domain invariant violated'];
        yield ['GENERIC_ERROR', ''];
    }

    public function testSettersAllowFriendlyOverridesAndChaining(): void
    {
        $error = new ActionError(ActionError::BAD_REQUEST, 'Invalid input');

        $error
            ->setType(ActionError::VALIDATION_ERROR)
            ->setDescription('Email address required')
            ->setFriendly('Please supply an email address.');

        self::assertSame(ActionError::VALIDATION_ERROR, $error->getType());
        self::assertSame('Email address required', $error->getDescription());
        self::assertSame('Please supply an email address.', $error->getFriendly());

        $encoded = json_decode(json_encode($error, JSON_THROW_ON_ERROR), true, 512, JSON_THROW_ON_ERROR);
        self::assertSame(
            [
                'type' => ActionError::VALIDATION_ERROR,
                'description' => 'Email address required',
                'friendly' => 'Please supply an email address.',
            ],
            $encoded
        );
    }

    public function testSerializationThroughActionPayloadOmitsDataWhenErrorPresent(): void
    {
        $error = new ActionError(ActionError::SERVER_ERROR, 'Disk full');
        $payload = new ActionPayload(503, null, $error);

        $encoded = json_decode(json_encode($payload, JSON_THROW_ON_ERROR), true, 512, JSON_THROW_ON_ERROR);

        self::assertArrayNotHasKey('data', $encoded);
        self::assertSame(
            [
                'type' => ActionError::SERVER_ERROR,
                'description' => 'Disk full',
                'friendly' => 'An error has occured',
            ],
            $encoded['error']
        );
    }

    public function testAllowsEmptyAndLongDescriptionsWithoutThrowing(): void
    {
        $emptyMessage = new ActionError(ActionError::BAD_REQUEST, '');
        self::assertSame('', $emptyMessage->getDescription());

        $longMessageText = str_repeat('x', 4096);
        $longMessage = new ActionError(ActionError::SERVER_ERROR, $longMessageText);
        self::assertSame($longMessageText, $longMessage->getDescription());

        self::assertNotEmpty(json_encode($longMessage, JSON_THROW_ON_ERROR));
    }

    public function testUnknownTypeRemainsSerializableAndCanFallbackToGeneric(): void
    {
        $error = new ActionError('SOME_UNKNOWN', 'Unmapped scenario');

        $encoded = json_decode(json_encode($error, JSON_THROW_ON_ERROR), true, 512, JSON_THROW_ON_ERROR);
        self::assertSame('SOME_UNKNOWN', $encoded['type']);

        $error->setType(ActionError::SERVER_ERROR);
        self::assertSame(ActionError::SERVER_ERROR, $error->getType());
    }
}
