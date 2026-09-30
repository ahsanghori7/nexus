<?php
declare(strict_types=1);

namespace Tests\Domain\User;

use App\Domain\User\Token;
use App\Domain\User\TokenType;
use App\Infrastructure\Persistence\DB;
use PHPUnit\Framework\TestCase;
use Tests\TestDoubles\FakeRedBean;

class TokenUsageInvalidationTest extends TestCase
{
    protected function setUp(): void
    {
        parent::setUp();
        FakeRedBean::reset();
        DB::addConnection('r', FakeRedBean::class);
    }

    public function testSetTokenInactiveMarksExpiredAndInvalid(): void
    {
        $token = (new UsageTrackingToken())->setData([
            'id' => 21,
            'user_id' => 8,
            'token_usage' => 2,
            'token_type_id' => 3,
            'active' => 1,
            'expires' => date('Y-m-d H:i:s', time() + 600),
        ]);

        $token->setTokenInactive();

        $this->assertCount(1, $token->savedPayloads);
        $payload = $token->savedPayloads[0];

        $this->assertSame(0, $payload['active']);
        $this->assertEqualsWithDelta(time(), strtotime($payload['expired_at']), 2);
        $this->assertFalse($token->isValid());
    }

    public function testIncrementTokenUsagePersistsConsecutiveUpdates(): void
    {
        $token = (new UsageTrackingToken())->setData([
            'id' => 33,
            'token_usage' => 0,
            'active' => 1,
            'expires' => date('Y-m-d H:i:s', time() + 600),
        ]);

        $token->incrementTokenUsage();
        $token->incrementTokenUsage();

        $this->assertCount(2, $token->savedPayloads);
        $this->assertSame(1, $token->savedPayloads[0]['token_usage']);
        $this->assertSame(2, $token->savedPayloads[1]['token_usage']);
        $this->assertSame(2, $token->getData('token_usage'));
    }

    public function testLoadLatestFetchesByUserAndType(): void
    {
        $expected = [
            'id' => 55,
            'user_id' => 77,
            'token' => 'recent-token',
            'token_type_id' => 9,
            'active' => 1,
            'token_usage' => 0,
            'expires' => date('Y-m-d H:i:s', time() + 3600),
        ];

        $token = new UsageTrackingToken();
        $tableName = $token->getName();

        FakeRedBean::$getRowHook = function (string $sql, array $params) use ($expected, $tableName) {
            TestCase::assertStringContainsString('FROM ' . $tableName, $sql);
            TestCase::assertStringContainsString('ORDER BY `created_at` DESC LIMIT 1', $sql);
            TestCase::assertSame([$expected['user_id'], $expected['token_type_id']], $params);

            return $expected;
        };

        $tokenType = (new TokenType())->setData(['id' => $expected['token_type_id']]);
        $token->loadLatest($expected['user_id'], $tokenType);

        $this->assertSame($expected['id'], $token->getId());
        $this->assertSame($expected['token'], $token->getData('token'));
        $this->assertSame($expected['token_type_id'], $token->getData('token_type_id'));
    }

    public function testLoadLatestWithNoResultsLeavesTokenUnloaded(): void
    {
        FakeRedBean::$getRowHook = static fn() => null;

        $tokenType = (new TokenType())->setData(['id' => 2]);
        $token = new UsageTrackingToken();
        $token->loadLatest(99, $tokenType);

        $this->assertFalse($token->isLoaded());
    }
}

class UsageTrackingToken extends Token
{
    public array $savedPayloads = [];

    public function save(array $data, $insertOnly = false): Token
    {
        $this->savedPayloads[] = $data;
        $this->data = $data;
        return $this;
    }

    public function getTypeModel(): TokenType
    {
        return new class extends TokenType {
            public function load($id, $idField = self::ID_FIELD): static
            {
                $this->data = ['id' => $id, 'expiry_hours' => 1] + $this->data;
                return $this;
            }
        };
    }
}
