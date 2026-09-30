<?php
declare(strict_types=1);

namespace Tests\Application\Actions;

use App\Application\Actions\ActionError;
use App\Application\Actions\ActionPayload;
use Tests\TestCase;

final class ActionErrorPayloadTest extends TestCase
{
    public function testActionErrorAllowsFriendlyOverride(): void
    {
        $error = (new ActionError(ActionError::VALIDATION_ERROR, 'Email required'))
            ->setFriendly('Please supply an email address.');

        $json = json_decode(json_encode($error, JSON_THROW_ON_ERROR), true);

        self::assertSame(ActionError::VALIDATION_ERROR, $json['type']);
        self::assertSame('Email required', $json['description']);
        self::assertSame('Please supply an email address.', $json['friendly']);
    }

    public function testActionPayloadWrapsErrorWhenDataMissing(): void
    {
        $payload = new ActionPayload(
            422,
            null,
            new ActionError('UNKNOWN_ERROR', 'Unexpected failure')
        );

        $encoded = json_decode(json_encode($payload, JSON_THROW_ON_ERROR), true);

        self::assertArrayNotHasKey('data', $encoded);
        self::assertSame(
            ['type' => 'UNKNOWN_ERROR', 'description' => 'Unexpected failure', 'friendly' => 'An error has occured'],
            $encoded['error']
        );
    }

    public function testActionPayloadOmitsErrorWhenDataPresent(): void
    {
        $payload = new ActionPayload(200, ['id' => 5]);

        $encoded = json_decode(json_encode($payload, JSON_THROW_ON_ERROR), true);

        self::assertArrayHasKey('data', $encoded);
        self::assertArrayNotHasKey('error', $encoded);
    }

    public function testGetErrorReturnsActionError(): void
    {
        $error = new ActionError(ActionError::BAD_REQUEST, 'oops');
        $payload = new ActionPayload(400, null, $error);

        self::assertSame($error, $payload->getError());
    }

    public function testGetErrorReturnsNullWhenNoError(): void
    {
        $payload = new ActionPayload(200, ['ok' => true]);

        self::assertNull($payload->getError());
    }
}
