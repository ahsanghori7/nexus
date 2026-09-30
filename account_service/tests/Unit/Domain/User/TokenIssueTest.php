<?php
declare(strict_types=1);

namespace Tests\Domain\User;

use App\Domain\User\Token;
use App\Domain\User\TokenType;
use PHPUnit\Framework\TestCase;

class TokenIssueTest extends TestCase
{
    protected function setUp(): void
    {
        parent::setUp();
        IssueTokenTypeDouble::reset();
    }

    /**
     * @dataProvider issuanceMethodProvider
     */
    public function testIssuanceMethodsPersistExpectedPayload(string $method, int $typeId, int $expiryHours): void
    {
        IssueTokenTypeDouble::$definitions = [
            $typeId => ['id' => $typeId, 'expiry_hours' => $expiryHours],
        ];

        $token = new DeterministicIssuingToken();
        $tokenType = (new IssueTokenTypeDouble())->load($typeId);

        $result = $token->$method(42, $tokenType);

        $this->assertSame($token, $result);
        $this->assertCount(1, $token->savedPayloads);
        $payload = $token->savedPayloads[0];

        $this->assertSame(42, $payload['user_id']);
        $this->assertSame(1, $payload['active']);
        $this->assertSame($typeId, $payload['token_type_id']);
        $this->assertSame('deadbeefdeadbeefdeadbeefdeadbeef', $payload['token']);
        $this->assertEqualsWithDelta(time() + $expiryHours * 3600, strtotime($payload['expires']), 2);
    }

    public static function issuanceMethodProvider(): array
    {
        return [
            ['createActivationLink', 11, 4],
            ['createPaymentRequest', 12, 6],
            ['resetPassword', 13, 2],
        ];
    }

    public function testLoadByUserStoresFetchedTokens(): void
    {
        $token = new class extends Token {
            public array $getTokensCalls = [];

            public function getTokens(int $id, TokenType $type, int $limit): array
            {
                $this->getTokensCalls[] = [$id, $type->getId(), $limit];
                return [
                    ['token' => 'first'],
                    ['token' => 'second'],
                ];
            }
        };

        $tokenType = (new IssueTokenTypeDouble())->load(5);

        $token->loadByUser(99, $tokenType, 2);

        $this->assertSame([[99, 5, 2]], $token->getTokensCalls);
        $this->assertSame(
            [
                ['token' => 'first'],
                ['token' => 'second'],
            ],
            $token->getData('tokens')
        );
    }

    public function testGetExpiryTimestampProducesFutureDate(): void
    {
        $timestamp = Token::getExpiryTimeStamp(1);

        $this->assertEqualsWithDelta(time() + 3600, strtotime($timestamp), 2);
    }
}

class DeterministicIssuingToken extends Token
{
    public array $savedPayloads = [];

    public function generateToken(int $len = 16): string
    {
        return 'deadbeefdeadbeefdeadbeefdeadbeef';
    }

    public function getTypeModel(): TokenType
    {
        return new IssueTokenTypeDouble();
    }

    public function save(array $data, $insertOnly = false): Token
    {
        $this->savedPayloads[] = $data;
        $this->data = $data;
        return $this;
    }
}

class IssueTokenTypeDouble extends TokenType
{
    public static array $definitions = [];

    public static function reset(): void
    {
        self::$definitions = [];
    }

    public function load($id, $idField = self::ID_FIELD): static
    {
        $definition = self::$definitions[$id] ?? ['id' => $id, 'expiry_hours' => 1];
        $this->data = $definition + ['id' => $id];
        return $this;
    }
}
