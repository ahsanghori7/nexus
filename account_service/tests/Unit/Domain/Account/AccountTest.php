<?php
declare(strict_types=1);

namespace Tests\Domain\Account;

use App\Domain\Account\Account;
use App\Domain\Account\Membership;
use App\Infrastructure\Environment;
use App\Infrastructure\Persistence\DB;
use PHPUnit\Framework\TestCase;
use Tests\TestDoubles\FakeRedBean;
use App\Domain\User\User;

class AccountTest extends TestCase
{
    protected function setUp(): void
    {
        parent::setUp();
        DB::addConnection('r', FakeRedBean::class);
        FakeRedBean::reset();
        $this->resetTypeCache();
        $this->setEnvironment([
            'CLINK_URL' => 'https://clink.test',
            'LOGO_MEDIA_HOST' => '',
        ]);
    }

    protected function tearDown(): void
    {
        parent::tearDown();
        $this->setEnvironment([]);
    }

    /**
     * @dataProvider logoProvider
     */
    public function testGetAccountLogoUrlBuildsExpectedPaths(int $accountId, int $typeId, string $logo, string $expected): void
    {
        $account = new Account();
        $result = $account->getAccountLogoUrl($accountId, $typeId, $logo);

        $this->assertSame($expected, $result);
    }

    public static function logoProvider(): array
    {
        return [
            'main contractor path' => [
                21,
                2,
                'logo.png',
                'https://clink.test/wp-content/themes/clink/documents/profiles/21/logos/logo.png',
            ],
            'prosper path with custom logo' => [
                9,
                3,
                'file.jpg',
                'https://clink.test/wp-content/themes/clink/framework/public/static/users/9/logo/file.jpg',
            ],
            'prosper default logo fallback' => [
                5,
                3,
                Account::LEGACY_PROSPER_PROSPER_LOGO_NAME,
                'https://clink.test/wp-content/themes/clink/framework/public/static/default/images/specialist-logo.png',
            ],
            'external contractor' => [
                4,
                4,
                'whatever.png',
                'https://clink.test/wp-content/themes/clink/images/default-icon.pngwhatever.png',
            ],
            'default clink logo' => [
                7,
                1,
                'logo.svg',
                'https://clink.test/wp-content/themes/clink/images/sunset-london.jpglogo.svg',
            ],
        ];
    }

    public function testGetMetaParsesJsonPayload(): void
    {
        $account = (new Account())->setData([
            'meta' => json_encode([
                'settings' => ['timezone' => 'UTC'],
                'flags' => [],
            ]),
        ]);

        $this->assertSame(
            [
                'settings' => ['timezone' => 'UTC'],
                'flags' => [],
            ],
            $account->getMeta()
        );
        $this->assertSame(['timezone' => 'UTC'], $account->getMeta('settings'));
        $this->assertSame([], $account->getMeta('missing'));
    }

    public function testUpdateIdMutatesPrimaryKey(): void
    {
        $account = new Account();
        $account->updateId(123);

        $this->assertSame(123, $account->getId());
    }

    public function testSetActivePersistsStatusWhenLoaded(): void
    {
        $account = (new RecordingAccount())->setData(['id' => 55]);
        $account->setActive();

        $this->assertSame(
            [
                ['status' => Account::CONFIRMED_STATUS_ID],
            ],
            $account->savedPayloads
        );
    }

    public function testSetActiveDoesNothingWhenNotLoaded(): void
    {
        $account = new RecordingAccount();
        $account->setActive();

        $this->assertSame([], $account->savedPayloads);
    }

    public function testAfterSaveCreatesMembershipWhenMissing(): void
    {
        $capturedBean = null;

        FakeRedBean::$getAllResults = [
            [
                [
                    'id' => 3,
                    'label' => 'Free Trial',
                    'expires' => 14,
                    'website_id' => 1,
                    'uid' => 'free-trial',
                    'price' => 0,
                    'price_label' => 'Free',
                    'interval_type' => 'month',
                    'interval_unit' => 'm',
                    'interval_amount' => '1',
                ],
            ],
        ];

        FakeRedBean::$getRowHook = static function (string $sql, array $params) {
            if (str_contains($sql, 'FROM membership')) {
                return null;
            }

            if (str_contains($sql, 'FROM subscription')) {
                return [
                    'id' => $params[0] ?? 3,
                    'label' => 'Free Trial',
                    'expires' => 14,
                    'website_id' => 1,
                    'uid' => 'free-trial',
                    'price' => 0,
                    'price_label' => 'Free',
                    'interval_type' => 'month',
                    'interval_unit' => 'm',
                    'interval_amount' => '1',
                ];
            }

            if (str_contains($sql, 'FROM website')) {
                return [
                    'id' => 1,
                    'label' => 1,
                    'url' => 'https://site.test',
                ];
            }

            return null;
        };

        FakeRedBean::$storeHook = static function ($bean) use (&$capturedBean) {
            $capturedBean = $bean;
            return 101;
        };

        $account = (new Account())->setData(['id' => 42]);
        $account->afterSave();

        $this->assertNotNull($capturedBean);
        $this->assertSame(42, $capturedBean->data['account_id']);
    }

    public function testAfterSaveDoesNotCreateMembershipWhenItExists(): void
    {
        $storeCalled = false;

        FakeRedBean::$getRowHook = static function (string $sql, array $params) {
            if (str_contains($sql, 'FROM membership')) {
                return [
                    'id' => 200,
                    'account_id' => $params[0] ?? 0,
                    'subscription_id' => 3,
                ];
            }
            return null;
        };

        FakeRedBean::$storeHook = static function () use (&$storeCalled) {
            $storeCalled = true;
            return 1;
        };

        $account = (new Account())->setData(['id' => 7]);
        $account->afterSave();

        $this->assertFalse($storeCalled, 'Existing membership should not be persisted again');
    }

    public function testGetMembershipReturnsLoadedMembershipWhenAccountLoaded(): void
    {
        FakeRedBean::$getRowHook = static function (string $sql, array $params) {
            if (str_contains($sql, 'FROM membership')) {
                return [
                    'id' => 77,
                    'account_id' => $params[0] ?? null,
                    'subscription_id' => 8,
                ];
            }
            return null;
        };

        $account = (new Account())->setData(['id' => 55]);
        $membership = $account->getMembership();

        $this->assertInstanceOf(Membership::class, $membership);
        $this->assertSame(55, $membership->getData('account_id'));
    }

    public function testGetMembershipReturnsNullWhenAccountNotLoaded(): void
    {
        $account = new Account();

        $this->assertNull($account->getMembership());
    }

    public function testLoadMembershipAttachesChildMembership(): void
    {
        FakeRedBean::$getRowHook = static function (string $sql, array $params) {
            if (str_contains($sql, 'FROM membership')) {
                return [
                    'id' => 88,
                    'account_id' => $params[0] ?? null,
                    'subscription_id' => 3,
                ];
            }
            return null;
        };

        $account = (new Account())->setData(['id' => 9]);
        $account->loadMembership();

        $children = $this->readChildren($account);

        $this->assertArrayHasKey('membership', $children);
        $this->assertInstanceOf(Membership::class, $children['membership']);
        $this->assertSame(9, $children['membership']->getData('account_id'));
    }

    public function testLoadUsersHydratesChildrenWithDerivedAttributes(): void
    {
        FakeRedBean::$getAllResults = [
            [
                [
                    'id' => 42,
                    'account_id' => 99,
                    'firstname' => 'Alice',
                    'lastname' => 'Archer',
                    'logo' => 'alice.png',
                    'type_id' => 3,
                ],
                [
                    'id' => 40,
                    'account_id' => 99,
                    'firstname' => 'Bob',
                    'lastname' => 'Builder',
                    'logo' => '',
                    'type_id' => 2,
                ],
            ],
            [
                ['id' => 2, 'label' => 'member'],
                ['id' => 3, 'label' => 'manager'],
            ],
        ];

        $account = (new Account())->setData(['id' => 99, 'type_id' => 3]);
        $account->loadUsers();

        $children = $this->readChildren($account);
        $users = $children['users'] ?? [];

        $this->assertCount(2, $users);
        $this->assertContainsOnlyInstancesOf(User::class, $users);
        $this->assertSame(
            'https://clink.test/wp-content/themes/clink/framework/public/static/users/42/logo/alice.png',
            $users[0]->getData('logo_path')
        );
        $this->assertSame('manager', $users[0]->getData('type'));
        $this->assertSame(
            'https://clink.test/wp-content/themes/clink/framework/public/static/default/images/specialist-logo.png',
            $users[1]->getData('logo_path')
        );
        $this->assertSame('member', $users[1]->getData('type'));
    }

    public function testGetAccountHolderReturnsLowestIdUser(): void
    {
        FakeRedBean::$getAllResults = [
            [
                [
                    'id' => 42,
                    'account_id' => 77,
                    'firstname' => 'Alice',
                    'lastname' => 'Archer',
                    'logo' => 'alice.png',
                    'type_id' => 3,
                ],
                [
                    'id' => 40,
                    'account_id' => 77,
                    'firstname' => 'Bob',
                    'lastname' => 'Builder',
                    'logo' => '',
                    'type_id' => 2,
                ],
            ],
            [
                ['id' => 2, 'label' => 'member'],
                ['id' => 3, 'label' => 'manager'],
            ],
        ];

        $account = (new Account())->setData(['id' => 77, 'type_id' => 3]);
        $holder = $account->getAccountHolder();

        $this->assertInstanceOf(User::class, $holder);
        $this->assertSame(40, $holder->getId());
    }

    public function testCreateUserPersistsDefaultsAndSetsAccount(): void
    {
        FakeRedBean::$getAllResults = [
            [
                ['id' => 5, 'label' => 'account_holder'],
            ],
        ];

        $capturedBean = null;
        FakeRedBean::$storeHook = static function ($bean) use (&$capturedBean) {
            $capturedBean = clone $bean;
            return 501;
        };

        $account = (new Account())->setData(['id' => 21]);
        $user = $account->createUser([
            'firstname' => 'Charlie',
            'lastname' => 'Chaplin',
            'email' => 'charlie@example.test',
            'password' => 'super-secure-pass',
        ]);

        $this->assertInstanceOf(User::class, $user);
        $this->assertSame(21, $user->getData('account_id'));
        $this->assertSame(501, $user->getId());
        $this->assertSame('Charlie Chaplin', $user->getData('display_name'));
        $this->assertSame(5, $user->getData('type_id'));
        $this->assertNotSame('super-secure-pass', $user->getData('password'));
        $this->assertSame($account, $user->getAccount());

        $this->assertNotNull($capturedBean);
        $this->assertSame(21, $capturedBean->data['account_id']);
        $this->assertSame(5, $capturedBean->data['type_id']);
    }

    private function setEnvironment(array $values): void
    {
        $ref = new \ReflectionClass(Environment::class);
        $prop = $ref->getProperty('values');
        $prop->setAccessible(true);
        $prop->setValue(null, $values);
    }

    private function resetTypeCache(): void
    {
        $ref = new \ReflectionClass(\App\Domain\AbstractTypeModel::class);
        $prop = $ref->getProperty('cache');
        $prop->setAccessible(true);
        $prop->setValue([]);
    }

    /**
     * @return array<string, mixed>
     */
    private function readChildren(Account $account): array
    {
        $prop = new \ReflectionProperty(Account::class, 'children');
        $prop->setAccessible(true);

        /** @var array<string, mixed> $children */
        $children = $prop->getValue($account);

        return $children;
    }
}

class RecordingAccount extends Account
{
    public array $savedPayloads = [];

    public function save(array $data, $insertOnly = false)
    {
        $this->savedPayloads[] = $data;
        return $this;
    }
}
