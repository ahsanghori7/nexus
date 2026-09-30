<?php
declare(strict_types=1);

namespace Tests\Domain\User;

use App\Domain\Account\Account;
use App\Domain\User\User;
use App\Domain\User\UserRepository;
use App\Infrastructure\Persistence\DB;
use PHPUnit\Framework\TestCase;
use Tests\Support\Fakes\FakeDB;
use Tests\Support\Fakes\FakeTokenModel;
use Tests\Support\Fakes\FakeTokenTypeModel;
use Tests\Support\Fakes\FakeUserModel;

final class UserRepositoryTest extends TestCase
{
    private TestUserRepository $repository;

    protected function setUp(): void
    {
        parent::setUp();
        FakeDB::reset();
        FakeTokenModel::reset();
        FakeTokenTypeModel::reset();
        FakeUserModel::reset();
        DB::addConnection('r', FakeDB::class);

        $this->repository = new TestUserRepository();
    }

    public function testVerifyValidLoadsUser(): void
    {
        FakeTokenModel::$isValidQueue = [true];
        $token = $this->repository->verify('good', 2);

        $this->assertInstanceOf(FakeTokenModel::class, $token);
        $this->assertSame([true], FakeTokenModel::$loadUserCalls);

        FakeTokenModel::$isValidQueue = [false];
        $this->assertFalse($this->repository->verify('bad', 2));
    }

    public function testDeleteTokensByUserIdExecutesParameterizedDelete(): void
    {
        $this->repository->deleteTokensByUserId(7);

        $this->assertSame(
            ['DELETE FROM token WHERE user_id = ?', [7]],
            FakeDB::$lastExec
        );
    }

    public function testSetTokenInactiveDelegatesToModel(): void
    {
        $this->repository->setTokenInactive('hash');

        $this->assertSame([['hash', 'token']], FakeTokenModel::$loadCalls);
        $this->assertCount(1, FakeTokenModel::$setInactiveCalls);
    }

    public function testIncrementTokenUsageDelegates(): void
    {
        $this->repository->incrementTokenUsage('hash');

        $this->assertSame([['hash', 'token']], FakeTokenModel::$loadCalls);
        $this->assertCount(1, FakeTokenModel::$incrementCalls);
    }

    public function testCreateTokenCreatesWhenInvalidAndAddsApp(): void
    {
        $user = $this->makeLoadedUser(33);

        FakeTokenModel::$defaultIsValid = false;
        FakeTokenTypeModel::$nextId = 88;

        $this->repository->createToken($user, 'session', 'api');

        $this->assertSame('api', FakeTokenModel::$savePayloads[0]['app']);
        $this->assertSame(88, FakeTokenModel::$savePayloads[0]['token_type_id']);

        FakeTokenModel::$savePayloads = [];
        FakeTokenModel::$defaultIsValid = true;
        $this->repository->createToken($user, 'session', '');
        $this->assertSame([], FakeTokenModel::$savePayloads);
    }

    public function testCreateSessionMigratesPasswordAndCreatesWhenInvalid(): void
    {
        $user = $this->makeLoadedUser(44);
        $user->passwordValid = true;

        FakeTokenModel::$defaultIsValid = true;
        $this->repository->createSession($user, 'secret');

        $this->assertSame(['secret'], $user->validatedPasswords);
        $this->assertSame(['secret'], $user->migratedPasswords);
        $this->assertSame([], FakeTokenModel::$savePayloads);

        FakeTokenModel::$defaultIsValid = false;
        $this->repository->createSession($user, 'secret', 'portal');

        $this->assertSame('portal', FakeTokenModel::$savePayloads[0]['app']);
    }

    public function testLoginAccountTypeMismatchReturnsBareToken(): void
    {
        $user = $this->makeLoadedUser(50, 1);
        $account = (new Account())->setData(['id' => 9, 'type_id' => 3, 'status' => 1]);
        $user->setAccount($account);

        $this->repository->getUserOverride = static fn (): User => $user;
        $this->repository->createSessionReturn = new FakeTokenModel();

        $token = $this->repository->login('a@b.test', 'secret', 99);

        $this->assertInstanceOf(FakeTokenModel::class, $token);
        $this->assertSame([], $this->repository->createSessionCalls);
    }

    public function testLoginInactiveAccountSetsStatus0(): void
    {
        $user = $this->makeLoadedUser(51, 1);
        $account = (new Account())->setData(['id' => 9, 'type_id' => 3, 'status' => 0]);
        $user->setAccount($account);
        $this->repository->getUserOverride = static fn (): User => $user;

        $token = $this->repository->login('a@b.test', 'secret', 3);

        $this->assertSame(0, $token->getData('status'));
    }

    public function testLoginHappyPathCreatesSession(): void
    {
        $user = $this->makeLoadedUser(60, 1);
        $account = (new Account())->setData(['id' => 9, 'type_id' => 3, 'status' => 1]);
        $user->setAccount($account);

        $expectedToken = new FakeTokenModel();

        $this->repository->getUserOverride = static fn (): User => $user;
        $this->repository->createSessionReturn = $expectedToken;

        $token = $this->repository->login('a@b.test', 'secret', 3, 'app');

        $this->assertSame($expectedToken, $token);
        $this->assertCount(1, $this->repository->createSessionCalls);
        $this->assertSame('app', $this->repository->createSessionCalls[0][2]);
    }

    public function testCreateSSOSessionActivatesUserAndCreatesToken(): void
    {
        $user = $this->makeLoadedUser(70, 1);

        FakeTokenModel::$defaultIsValid = false;
        FakeTokenTypeModel::$nextId = 90;

        $token = $this->repository->createSSOSession($user, 'app');

        $this->assertSame([true], $user->activateCalls);
        $this->assertInstanceOf(FakeTokenModel::class, $token);
        $this->assertSame('app', FakeTokenModel::$savePayloads[0]['app']);
    }

    public function testGetUserFallsBackToAccountHolder(): void
    {
        FakeUserModel::$loadShouldSucceed = false;

        FakeDB::queueGetRowResult([
            'id' => 11,
            'type_id' => 3,
            'status' => 1,
        ]);

        FakeDB::$getAllResults = [
            [
                [
                    'id' => 5,
                    'account_id' => 11,
                    'firstname' => 'Holder',
                    'lastname' => 'One',
                    'email' => 'holder@acme.test',
                    'type_id' => 2,
                    'logo' => '',
                    'display_name' => 'Holder',
                    'job_title' => '',
                    'contact_number' => '',
                    'migrated' => 0,
                    'password' => '$argon2id$fake',
                ],
            ],
            [
                [
                    'id' => 2,
                    'label' => 'account_holder',
                ],
            ],
        ];

        $user = $this->repository->getUser('holder@acme.test');

        $this->assertTrue($user->isLoaded());
        $this->assertSame('holder@acme.test', $user->getData('email'));
        $this->assertSame(11, $user->getAccount()->getId());
    }

    public function testGetUsersByArrayReturnsEmptyArrayWhenNoResults(): void
    {
        $data = $this->repository->getUsersByArray([1, 2]);

        $this->assertSame([], $data);
    }

    public function testGetUsersByArrayReturnsEmptyArrayWhenIdsEmpty(): void
    {
        $data = $this->repository->getUsersByArray([]);

        $this->assertSame([], $data);
        $this->assertNull(FakeDB::$lastGetAllQuery);
    }

    public function testGetUsersByArrayIgnoresNonNumericIdsAndSanitizesQuery(): void
    {
        $data = $this->repository->getUsersByArray([' 5 ', 'DROP TABLE user', null, '6']);

        $this->assertSame([], $data);
        $this->assertStringContainsString('IN (5,6)', FakeDB::$lastGetAllQuery);
    }

    public function testGetUsersByArrayReturnsEmptyArrayWhenAllIdsNonNumeric(): void
    {
        $data = $this->repository->getUsersByArray(['DROP TABLE user', null]);

        $this->assertSame([], $data);
        $this->assertNull(FakeDB::$lastGetAllQuery);
    }

    public function testGetUsersByArrayLeavesRoleNullWhenAccountRoleResultsEmpty(): void
    {
        FakeDB::queueGetAllResult([
            [
                'id' => 5,
                'account_id' => 11,
                'firstname' => 'Jane',
                'lastname' => 'Doe',
                'email' => 'jane@example.com',
                'type_id' => 2,
                'display_name' => 'Jane Doe',
                'job_title' => 'Manager',
                'contact_number' => '12345',
                'migrated' => 0,
            ],
        ]);
        FakeDB::queueGetAllResult([]);

        $data = $this->repository->getUsersByArray([5]);

        $this->assertNull($data[11][0]['role']);
        $this->assertNull($data[11][0]['user_type']);
    }

    public function testGetUsersByArrayHydratesUserTypeAndAccountRole(): void
    {
        FakeDB::queueGetAllResult([
            [
                'id' => 5,
                'account_id' => 11,
                'firstname' => 'Jane',
                'lastname' => 'Doe',
                'email' => 'jane@example.com',
                'type_id' => 2,
                'display_name' => 'Jane Doe',
                'job_title' => 'Manager',
                'contact_number' => '12345',
                'migrated' => 0,
            ],
            [
                'id' => 6,
                'account_id' => 11,
                'firstname' => 'John',
                'lastname' => 'Smith',
                'email' => 'john@example.com',
                'type_id' => null,
                'display_name' => 'John Smith',
                'job_title' => 'Estimator',
                'contact_number' => '67890',
                'migrated' => 0,
            ],
        ]);
        FakeDB::queueGetAllResult([
            [
                'id' => 5,
                'account_role_id' => 8,
                'account_role_label' => 'Admin',
                'account_role_description' => 'Full access',
                'user_type_id' => 2,
                'user_type_label' => 'team_admin',
                'user_type_display_label' => 'Team Admin',
            ],
        ]);

        $data = $this->repository->getUsersByArray([5, 6]);

        $this->assertSame([
            11 => [
                [
                    'id' => 5,
                    'account_id' => 11,
                    'firstname' => 'Jane',
                    'lastname' => 'Doe',
                    'email' => 'jane@example.com',
                    'type_id' => 2,
                    'display_name' => 'Jane Doe',
                    'job_title' => 'Manager',
                    'contact_number' => '12345',
                    'migrated' => 0,
                    'user_type' => [
                        'id' => 2,
                        'label' => 'team_admin',
                        'display_label' => 'Team Admin',
                    ],
                    'role' => [
                        'id' => 8,
                        'label' => 'Admin',
                        'description' => 'Full access',
                    ],
                ],
                [
                    'id' => 6,
                    'account_id' => 11,
                    'firstname' => 'John',
                    'lastname' => 'Smith',
                    'email' => 'john@example.com',
                    'type_id' => null,
                    'display_name' => 'John Smith',
                    'job_title' => 'Estimator',
                    'contact_number' => '67890',
                    'migrated' => 0,
                    'user_type' => null,
                    'role' => null,
                ],
            ],
        ], $data);
    }

    private function makeLoadedUser(int $id, int $status = 1): FakeUserModel
    {
        $user = new FakeUserModel();
        $user->forceLoaded = true;
        $user->setData([
            'id' => $id,
            'account_id' => $id + 100,
            'status' => $status,
        ]);

        return $user;
    }
}

final class TestUserRepository extends UserRepository
{
    /** @var callable|null */
    public $getUserOverride = null;
    public array $createSessionCalls = [];
    public ?FakeTokenModel $createSessionReturn = null;

    protected array $modelMap = [
        'user' => FakeUserModel::class,
        'token' => FakeTokenModel::class,
        'tokenType' => FakeTokenTypeModel::class,
    ];

    public function getModel(string $model = 'user')
    {
        if (!isset($this->modelMap[$model])) {
            return parent::getModel($model);
        }

        $cls = $this->modelMap[$model];
        return new $cls();
    }

    public function getUser(string $email)
    {
        if ($this->getUserOverride) {
            return ($this->getUserOverride)($email);
        }

        return parent::getUser($email);
    }

    public function createSession(User $user, string $password, $app = '')
    {
        if ($this->createSessionReturn) {
            $this->createSessionCalls[] = [$user, $password, $app];
            return $this->createSessionReturn;
        }

        return parent::createSession($user, $password, $app);
    }
}
