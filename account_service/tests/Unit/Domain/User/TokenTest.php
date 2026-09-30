<?php
declare(strict_types=1);

namespace Tests\Domain\User;

use App\Domain\User\Token;
use App\Domain\User\TokenType;
use PHPUnit\Framework\TestCase;

class TokenTest extends TestCase
{
    protected function setUp(): void
    {
        parent::setUp();
        TokenTypeStub::reset();
    }

    public function testBeforeSaveGeneratesTokenAndExpiryWhenMissing(): void
    {
        TokenTypeStub::$definitions = [
            5 => ['id' => 5, 'expiry_hours' => 4],
        ];

        $token = new RecordingToken();
        $values = $token->beforeSave(['user_id' => 1, 'token_type_id' => 5], []);

        $this->assertSame(32, strlen($values['token']));
        $this->assertSame(5, $values['token_type_id']);
        $this->assertEqualsWithDelta(time() + 4 * 3600, strtotime($values['expires']), 2);
    }

    public function testBeforeSaveRespectsProvidedTokenAndExpiry(): void
    {
        TokenTypeStub::$definitions = [
            5 => ['id' => 5, 'expiry_hours' => 4],
        ];

        $token = new RecordingToken();
        $values = $token->beforeSave(
            [
                'user_id' => 1,
                'token_type_id' => 5,
                'token' => 'fixed',
                'expires' => '2025-01-01 00:00:00',
            ],
            []
        );

        $this->assertSame('fixed', $values['token']);
        $this->assertSame('2025-01-01 00:00:00', $values['expires']);
    }

    public function testIsValidChecksActiveExpiryAndType(): void
    {
        $token = (new RecordingToken())->setData([
            'active' => 1,
            'token_type_id' => 3,
            'expires' => date('Y-m-d H:i:s', time() + 3600),
        ]);

        $this->assertTrue($token->isValid(3));
        $this->assertTrue($token->isValid());

        $this->assertFalse($token->isValid(4), 'Type mismatch should invalidate');

        $token->setData(['active' => 0] + $token->getData());
        $this->assertFalse($token->isValid());

        $token->setData([
            'active' => 1,
            'token_type_id' => 3,
            'expires' => date('Y-m-d H:i:s', time() - 10),
        ]);
        $this->assertFalse($token->isValid());
    }

    public function testHasExpiredTreatsInvalidTimestampAsNotExpired(): void
    {
        $token = (new RecordingToken())->setData(['expires' => 'invalid']);
        $this->assertFalse($token->hasExpired());
    }

    public function testRenewRefreshesExpiryAndPersists(): void
    {
        TokenTypeStub::$definitions = [
            3 => ['id' => 3, 'expiry_hours' => 6],
        ];

        $token = (new RecordingToken())->setData([
            'id' => 100,
            'user_id' => 7,
            'token' => 'abc',
            'active' => 1,
            'token_type_id' => 3,
        ]);

        $token->renew();

        $this->assertCount(1, $token->savedPayloads);
        $payload = $token->savedPayloads[0];
        $this->assertSame('abc', $payload['token']);
        $this->assertSame(7, $payload['user_id']);
        $this->assertSame(3, $payload['token_type_id']);
        $this->assertEqualsWithDelta(time() + 6 * 3600, strtotime($payload['expires']), 2);
        $this->assertSame([3], TokenTypeStub::$loadedIds);
    }

    public function testSetTokenInactivePersistsState(): void
    {
        $token = (new RecordingToken())->setData([
            'id' => 1,
            'user_id' => 7,
            'token' => 'abc',
            'active' => 1,
            'token_type_id' => 3,
            'token_usage' => 2,
        ]);

        $token->setTokenInactive();

        $payload = $token->savedPayloads[0];
        $this->assertSame(0, $payload['active']);
        $this->assertEqualsWithDelta(time(), strtotime($payload['expired_at']), 2);
    }

    public function testIncrementTokenUsagePersistsIncrement(): void
    {
        $token = (new RecordingToken())->setData([
            'id' => 1,
            'token_usage' => 5,
        ]);

        $token->incrementTokenUsage();
        $payload = $token->savedPayloads[0];

        $this->assertSame(6, $payload['token_usage']);
    }

    public function testCreateActivationLinkStoresNewToken(): void
    {
        TokenTypeStub::$definitions = [
            8 => ['id' => 8, 'expiry_hours' => 12],
        ];

        $token = new RecordingToken();
        $tokenType = (new TokenTypeStub())->load(8);
        $token->createActivationLink(9, $tokenType);

        $this->assertCount(1, $token->savedPayloads);
        $payload = $token->savedPayloads[0];

        $this->assertSame(9, $payload['user_id']);
        $this->assertSame(8, $payload['token_type_id']);
        $this->assertEqualsWithDelta(time() + 12 * 3600, strtotime($payload['expires']), 2);
    }
}

class RecordingToken extends Token
{
    public array $savedPayloads = [];

    public function getTypeModel()
    {
        return new TokenTypeStub();
    }

    public function save(array $data, $insertOnly = false)
    {
        $this->savedPayloads[] = $data;
        $this->data = $data;
        return $this;
    }
}

class TokenTypeStub extends TokenType
{
    public static array $definitions = [];
    public static array $loadedIds = [];

    public static function reset(): void
    {
        self::$definitions = [];
        self::$loadedIds = [];
    }

    public function load($id, $idField = self::ID_FIELD): static
    {
        self::$loadedIds[] = $id;
        $definition = self::$definitions[$id] ?? ['id' => $id, 'expiry_hours' => 1];
        $this->data = $definition + ['id' => $id];
        return $this;
    }

    public function getExpiryHours(int $default = 1): int
    {
        return $this->data['expiry_hours'] ?? $default;
    }
}
