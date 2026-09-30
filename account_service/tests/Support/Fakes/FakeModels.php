<?php
declare(strict_types=1);

namespace Tests\Support\Fakes;

use App\Domain\AbstractModel;
use App\Domain\Account\Account;
use App\Domain\User\User;
use App\Domain\User\Token;
use App\Domain\User\TokenType;

class FakeAccountModel extends AbstractModel
{
    public const NAME = 'account';

    protected $columns = [
        'id' => [],
        'account_id' => [],
        'name' => [],
        'address' => [],
        'landline' => [],
        'mobile' => [],
        'reg_number' => [],
        'vat_number' => [],
        'utr_number' => [],
        'logo' => [],
        'slogan' => [],
        'website' => [],
        'description' => [],
        'status' => [],
        'account_status' => [],
        'type_id' => [],
        'account_type_id' => [],
        'created_at' => [],
        'meta' => [],
        'account_meta' => [],
        'subscription_id' => [],
        'subscription' => [],
        'subscription_type' => [],
        'first_pqq_sent' => [],
    ];

    public function getDB()
    {
        return FakeDB::class;
    }
}

class FakeMembershipModel extends AbstractModel
{
    public const NAME = 'membership';

    protected $columns = [
        'subscription_id' => [],
        'starts_at' => [],
        'expires_at' => [],
    ];

    public function getDB()
    {
        return FakeDB::class;
    }
}

class FakeUserRecordModel extends AbstractModel
{
    public const NAME = 'user';

    protected $columns = [
        'firstname' => [],
        'lastname' => [],
        'email' => [],
        'display_name' => [],
        'job_title' => [],
        'contact_number' => [],
        'migrated' => [],
    ];

    public function getDB()
    {
        return FakeDB::class;
    }
}

class FakeAccountActionModel extends AbstractModel
{
    public const NAME = 'account_action';

    protected $columns = [
        'id' => [],
        'account_id' => [],
        'related_account_id' => [],
        'account_user_id' => [],
        'related_account_user_id' => [],
        'action_type' => [],
        'description' => [],
        'action_date' => [],
    ];

    public function getDB()
    {
        return FakeDB::class;
    }
}

class FakeAccountRoleModel extends AbstractModel
{
    public const NAME = 'account_role';

    protected $columns = [
        'id' => [],
        'account_id' => [],
        'role_id' => [],
        'label' => [],
        'description' => [],
    ];

    public function getDB()
    {
        return FakeDB::class;
    }
}

class FakeRegionModel extends AbstractModel
{
    public const NAME = 'region';

    protected $columns = [
        'id' => [],
        'label' => [],
    ];

    public static array $records = [];

    public static function setRecords(array $records): void
    {
        self::$records = $records;
    }

    public function getDB()
    {
        return FakeDB::class;
    }

    public function findAll(array $filters = [], int $limit = 0, int $offset = 0, bool $assoc_array = false): array
    {
        return self::$records;
    }
}

class FakeRegionMappingTypeModel
{
    public array $map = [
        'delivery' => 10,
        'trade' => 20,
    ];

    public function getLabelId(string $label)
    {
        return $this->map[$label] ?? false;
    }
}

class FakeRegionMappingModel extends AbstractModel
{
    public const NAME = 'region_mapping';

    protected $columns = [
        'account_id' => [],
        'region_id' => [],
        'type_id' => [],
        'group_id' => [],
    ];

    public static array $deleteCalls = [];
    public static array $saveMappingsCalls = [];
    public static array $byIdsCalls = [];
    public static array $byIdsResult = [];
    public static array $typeMap = [
        'delivery' => 10,
        'trade' => 20,
    ];

    public static function reset(): void
    {
        self::$deleteCalls = [];
        self::$saveMappingsCalls = [];
        self::$byIdsCalls = [];
        self::$byIdsResult = [];
    }

    public function getDB()
    {
        return FakeDB::class;
    }

    public function getTypeModel(): FakeRegionMappingTypeModel
    {
        $model = new FakeRegionMappingTypeModel();
        $model->map = self::$typeMap;
        return $model;
    }

    public function deleteWhere(array $where): void
    {
        self::$deleteCalls[] = $where;
    }

    public function saveMappings(int $accountId, int $typeId, array $regions, ?int $groupId): void
    {
        self::$saveMappingsCalls[] = [$accountId, $typeId, $regions, $groupId];
    }

    public function getByIds(array $ids, int $typeId, ?int $gid)
    {
        self::$byIdsCalls[] = [$ids, $typeId, $gid];
        return self::$byIdsResult;
    }
}

class FakeTokenModel extends Token
{
    protected $data = [];

    public static array $loadCalls = [];
    public static array $loadLatestCalls = [];
    public static array $isValidQueue = [];
    public static bool $defaultIsValid = true;
    public static array $savePayloads = [];
    public static array $setInactiveCalls = [];
    public static array $incrementCalls = [];
    public static array $loadUserCalls = [];

    public static function reset(): void
    {
        self::$loadCalls = [];
        self::$loadLatestCalls = [];
        self::$isValidQueue = [];
        self::$defaultIsValid = true;
        self::$savePayloads = [];
        self::$setInactiveCalls = [];
        self::$incrementCalls = [];
        self::$loadUserCalls = [];
    }

    public function getDB()
    {
        return FakeDB::class;
    }

    public function load($value, $field = 'id')
    {
        self::$loadCalls[] = [$value, $field];
        $this->data['token'] = $value;

        return $this;
    }

    public function setData(array $data)
    {
        $this->data = $data;
        return $this;
    }

    public function loadLatest(int $user_id, TokenType $type): void
    {
        self::$loadLatestCalls[] = [$user_id, $type];
        $this->data['user_id'] = $user_id;
        $this->data['token_type_id'] = $type->getId();
    }

    public function isValid($tokenType = 0): bool
    {
        if (self::$isValidQueue) {
            return (bool) array_shift(self::$isValidQueue);
        }

        return self::$defaultIsValid;
    }

    public function save(array $data, $insertOnly = false)
    {
        self::$savePayloads[] = $data;
        $token = new self();
        $token->data = $data;
        $token->data['id'] = $data['user_id'] ?? 0;
        return $token;
    }

    public function setTokenInactive(): void
    {
        self::$setInactiveCalls[] = true;
    }

    public function incrementTokenUsage(): void
    {
        self::$incrementCalls[] = true;
    }

    public function loadUser($loadAccount = false): Token
    {
        self::$loadUserCalls[] = (bool) $loadAccount;
        if ($loadAccount) {
            $this->children['account'] = (new Account())->setData(['id' => 1]);
        }
        return $this;
    }

    public function getId()
    {
        return $this->data['id'] ?? null;
    }

    public function getData(?string $k = null, $def = null): mixed
    {
        if ($k) {
            return $this->data[$k] ?? $def;
        }

        return $this->data;
    }
}

class FakeTokenTypeModel extends TokenType
{
    public static bool $shouldLoad = true;
    public static int $nextId = 100;
    public static array $loadCalls = [];

    public static function reset(): void
    {
        self::$shouldLoad = true;
        self::$nextId = 100;
        self::$loadCalls = [];
    }

    public function getDB()
    {
        return FakeDB::class;
    }

    public function load($value, $field = self::ID_FIELD)
    {
        self::$loadCalls[] = [$value, $field];
        if (self::$shouldLoad) {
            $this->setData([
                'id' => self::$nextId,
                'label' => is_string($value) ? $value : 'session',
                'expiry_hours' => 1,
            ]);
        } else {
            $this->setData([]);
        }
        return $this;
    }

    public function getId(): int
    {
        return $this->data['id'] ?? 0;
    }
}

class FakeUserModel extends User
{
    public static bool $loadShouldSucceed = true;
    public static array $loadData = [
        'id' => 55,
        'account_id' => 77,
        'password' => '$argon2id$fake',
    ];
    public static array $loadCalls = [];

    public array $validatedPasswords = [];
    public array $migratedPasswords = [];
    public bool $passwordValid = true;
    public bool $forceLoaded = false;
    protected $account;

    public static function reset(): void
    {
        self::$loadShouldSucceed = true;
        self::$loadData = [
            'id' => 55,
            'account_id' => 77,
            'password' => '$argon2id$fake',
        ];
        self::$loadCalls = [];
    }

    public function getDB()
    {
        return FakeDB::class;
    }

    public function load($value, $field = self::ID_FIELD)
    {
        self::$loadCalls[] = [$value, $field];
        if (self::$loadShouldSucceed) {
            $this->setData(self::$loadData);
            $this->forceLoaded = true;
        } else {
            $this->setData([]);
            $this->forceLoaded = false;
        }

        return $this;
    }

    public function isLoaded(): bool
    {
        if ($this->forceLoaded) {
            return true;
        }

        return parent::isLoaded();
    }

    public function validatePassword(string $password): bool
    {
        $this->validatedPasswords[] = $password;
        return $this->passwordValid;
    }

    public function migratePassword(string $password): void
    {
        $this->migratedPasswords[] = $password;
    }

    public array $activateCalls = [];

    public function activate(): void
    {
        $this->activateCalls[] = true;
    }

    public function setAccount(Account $account)
    {
        $this->account = $account;
        return $this;
    }

    public function getAccount()
    {
        return $this->account ?? (new Account())->setData(['type_id' => 0, 'status' => 1]);
    }
}
