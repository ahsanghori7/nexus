<?php
declare(strict_types=1);

namespace Tests\Domain\User;

use App\Domain\Account\Account;
use App\Domain\User\Token;
use App\Domain\User\User;
use App\Infrastructure\Persistence\DB;
use PHPUnit\Framework\TestCase;
use Tests\TestDoubles\FakeRedBean;

class TokenVerifyTest extends TestCase
{
    protected function setUp(): void
    {
        parent::setUp();
        FakeRedBean::reset();
        DB::addConnection('r', FakeRedBean::class);
    }

    /**
     * @dataProvider validityProvider
     */
    public function testIsValidCoversActiveExpiryAndType(array $data, int $expectedType, bool $expected): void
    {
        $token = (new InspectableToken())->setData($data);

        $this->assertSame($expected, $token->isValid($expectedType));
    }

    public static function validityProvider(): array
    {
        $future = date('Y-m-d H:i:s', time() + 600);
        $past = date('Y-m-d H:i:s', time() - 600);

        return [
            'active and matching type' => [
                ['id' => 1, 'active' => 1, 'expires' => $future, 'token_type_id' => 7],
                7,
                true,
            ],
            'active without type check' => [
                ['id' => 2, 'active' => 1, 'expires' => $future, 'token_type_id' => 7],
                0,
                true,
            ],
            'inactive token' => [
                ['id' => 3, 'active' => 0, 'expires' => $future, 'token_type_id' => 7],
                7,
                false,
            ],
            'expired token' => [
                ['id' => 4, 'active' => 1, 'expires' => $past, 'token_type_id' => 7],
                7,
                false,
            ],
            'wrong type' => [
                ['id' => 5, 'active' => 1, 'expires' => $future, 'token_type_id' => 3],
                7,
                false,
            ],
        ];
    }

    public function testRenewThrowsWhenTokenNotLoaded(): void
    {
        $token = new InspectableToken();

        $this->expectException(\Exception::class);
        $this->expectExceptionMessage('Failed to renew token');

        $token->renew();
    }

    public function testLoadUserAttachesGhostAndAccountWhenRequested(): void
    {
        FakeRedBean::$getRowHook = function (string $sql, array $params) {
            if (stripos($sql, 'from user') !== false) {
                $id = (int) $params[0];
                return [
                    'id' => $id,
                    'account_id' => $id * 100,
                    'firstname' => 'User' . $id,
                    'lastname' => 'Example',
                    'email' => "user{$id}@example.com",
                    'password' => '$argon2id$placeholder$hash',
                    'type_id' => 1,
                ];
            }

            if (stripos($sql, 'from account') !== false) {
                $id = (int) $params[0];
                return [
                    'id' => $id,
                    'type_id' => 9,
                    'status' => 1,
                    'meta' => json_encode(['plan' => 'standard']),
                ];
            }

            if (stripos($sql, 'from membership') !== false) {
                return [
                    'id' => 44,
                    'account_id' => (int) $params[0],
                    'subscription_id' => 8,
                ];
            }

            return null;
        };

        $token = new InspectableToken();
        $token->setData([
            'id' => 10,
            'user_id' => 5,
            'token_type_id' => 1,
            'active' => 1,
            'expires' => date('Y-m-d H:i:s', time() + 100),
            'meta' => json_encode(['ghost' => 9]),
        ]);

        $result = $token->loadUser(true);

        $this->assertSame($token, $result);

        $primary = $token->getUser();
        $this->assertInstanceOf(User::class, $primary);
        $this->assertSame(5, $primary->getData('id'));
        $this->assertSame(500, $primary->getData('account_id'));

        $ghost = $token->getChild('ghost');
        $this->assertInstanceOf(User::class, $ghost);
        $this->assertSame(9, $ghost->getData('id'));
        $this->assertSame(900, $ghost->getData('account_id'));

        $account = $token->getChild('account');
        $this->assertInstanceOf(Account::class, $account);
        $this->assertSame(900, $account->getData('id'));

        $userLoadCalls = array_filter(
            FakeRedBean::$calls,
            static fn(array $call) => $call[0] === 'getRow' && stripos($call[1], 'from user') !== false
        );
        $this->assertNotEmpty($userLoadCalls);
    }

    public function testLoadUserSkipsWhenTokenNotLoaded(): void
    {
        FakeRedBean::$calls = [];

        $token = new InspectableToken();
        $token->loadUser(true);

        $this->assertSame([], FakeRedBean::$calls);
    }

    public function testGetMetaDecodesJson(): void
    {
        $token = new InspectableToken();
        $token->setData(['meta' => json_encode(['key' => 'value'])]);

        $this->assertSame(['key' => 'value'], $token->getMeta());
        $this->assertNull((new InspectableToken())->getMeta());
    }

    public function testSetUserAndGetUser(): void
    {
        $token = new InspectableToken();
        $this->assertFalse($token->getUser());

        $user = new User();
        $token->setUser($user);

        $this->assertSame($user, $token->getUser());
    }
}

class InspectableToken extends Token
{
    public function getChild(string $name)
    {
        return $this->children[$name] ?? null;
    }
}
