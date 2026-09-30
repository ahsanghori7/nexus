<?php
declare(strict_types=1);

namespace Tests\Application\Actions\Account;

use App\Domain\AbstractModel;

require_once __DIR__ . '/AccountModelStub.php';
require_once __DIR__ . '/AccountEntityStub.php';

final class SupplyChainRepositoryStub
{
    public bool $entityExists = true;
    public array $accountModelFindOneCalls = [];
    public array $supplyChainSaveCalls = [];
    public array $supplyChainDeleteWhereCalls = [];
    public array $supplyChainFindAllResult = [];
    public array $supplyChainByAccount = [];
    public array $supplyChainDbResults = [];
    public bool $mappingExists = false;
    public int $mappingTypeId = 9;
    public int $nextMappingId = 100;
    public int $existingMappingId = 50;
    public array $accountUserMappingSaveCalls = [];
    public array $accountUserMappingDeleteCalls = [];
    public array $offeringRegionMappings = [];
    public bool $dbSupportsGetAll = true;
    public array $cleanCalls = [];
    public array $mapTradesCalls = [];
    public array $mapTradesFailures = [];
    public array $accountEntities = [];
    public array $accountSaveCalls = [];
    public array $accountsByName = [];
    public array $mapRegionsInvocations = [];
    public array $chainsByTrade = [];
    public array $loadByAccountCalls = [];
    public array $supplyChainMappingPairs = [];
    public int $nextAccountId = 1000;
    public int $nextUserId = 5000;
    public int $externalAccountTypeId = 44;
    public array $createdUsers = [];
    public array $accountHolderIds = [];
    public array $accountUserMappings = [];
    public array $getAccountUserMappingsCalls = [];
    public int $accountHolderTypeId = 5;
    public array $userDbExecCalls = [];

    public function getModel(string $name = '')
    {
        return match ($name) {
            '' => new AccountModelStub($this),
            'account_user_mapping' => new AccountUserMappingModelStub($this),
            'account_user_mapping_type' => new AccountUserMappingTypeModelStub($this),
            'supply_chain' => new SupplyChainModelStub($this),
            'offering_region_mapping' => new OfferingRegionMappingModelStub($this),
            'user' => new SupplyChainUserModelStub($this),
            default => new class {
                public function __call(string $name, array $arguments)
                {
                    return [];
                }
            },
        };
    }
}

final class SupplyChainModelStub
{
    public function __construct(private SupplyChainRepositoryStub $repository)
    {
    }

    public function save(array $data)
    {
        $this->repository->supplyChainSaveCalls[] = $data;
        return new class {
            public function getId(): int
            {
                return 0;
            }
        };
    }

    public function deleteWhere(array $criteria): void
    {
        $this->repository->supplyChainDeleteWhereCalls[] = $criteria;
    }

    public function findAll(array $filters = []): array
    {
        return $this->repository->supplyChainFindAllResult;
    }

    public function all(array $filters = []): array
    {
        return $this->repository->supplyChainFindAllResult;
    }

    public function clean(int $parentId, int $childId): void
    {
        $this->repository->cleanCalls[] = [$parentId, $childId];
    }

    public function mapTrades(int $parentId, int $childId, array $trades, array &$failed): void
    {
        $this->repository->mapTradesCalls[] = [$parentId, $childId, $trades];
        $failed = $this->repository->mapTradesFailures;
    }

    public function loadByAccount(AccountEntityStub $account, array $tradeIds): SupplyChainLoadResultStub
    {
        $this->repository->loadByAccountCalls[] = [
            'account_id' => $account->getId(),
            'trades' => $tradeIds,
        ];

        return new SupplyChainLoadResultStub($this->repository, $account->getId(), $tradeIds);
    }

    public function exists(int $parentId, int $childId): bool
    {
        $key = sprintf('%d:%d', $parentId, $childId);
        if (array_key_exists($key, $this->repository->supplyChainMappingPairs)) {
            return (bool) $this->repository->supplyChainMappingPairs[$key];
        }

        return $this->repository->mappingExists;
    }

    public function getSupplyChainByAccountId(int $accountId): array
    {
        return $this->repository->supplyChainByAccount;
    }

    public function getName(): string
    {
        return 'supply_chain';
    }

    public function getDB()
    {
        if ($this->repository->dbSupportsGetAll) {
            SupplyChainDbStub::$repository = $this->repository;
            return SupplyChainDbStub::class;
        }

        return SupplyChainDbUnavailableStub::class;
    }
}

final class AccountUserMappingModelStub extends AbstractModel
{
    private bool $loaded = false;
    private int $id = 0;

    public function __construct(private SupplyChainRepositoryStub $repository)
    {
    }

    public function findOne(array $filters): AbstractModel
    {
        if (!$this->repository->mappingExists) {
            throw new \Exception('not found');
        }
        $this->loaded = true;
        $this->id = $this->repository->existingMappingId;
        $this->data = ['id' => $this->id] + $filters;
        return $this;
    }

    public function save(array $data, $insertOnly = false): self
    {
        $this->repository->accountUserMappingSaveCalls[] = $data;
        $this->loaded = true;
        $this->id = $this->repository->nextMappingId;
        $this->data = ['id' => $this->id] + $data;
        return $this;
    }

    public function deleteWhere(array $criteria): void
    {
        $this->repository->accountUserMappingDeleteCalls[] = $criteria;
    }

    public function getAccountUserMappings(int $accountId, string $type, array $childIds = []): array
    {
        $this->repository->getAccountUserMappingsCalls[] = [
            'account_id' => $accountId,
            'type' => $type,
            'childIds' => $childIds,
        ];
        return $this->repository->accountUserMappings;
    }

    public function isLoaded(): bool
    {
        return $this->loaded;
    }

    public function getId(): int
    {
        return $this->id;
    }

    public function getName(): string
    {
        return 'account_user_mapping';
    }

    public function getDb()
    {
        return new class {
        };
    }
}

final class SupplyChainUserModelStub extends AbstractModel
{
    public function __construct(private SupplyChainRepositoryStub $repository)
    {
    }

    public function getTypeModel()
    {
        return new class($this->repository->accountHolderTypeId) {
            public function __construct(private int $id)
            {
            }

            public function getLabelId(string $label): int
            {
                return $this->id;
            }
        };
    }

    public function getName(): string
    {
        return 'user';
    }

    public function getDb()
    {
        SupplyChainUserDbStub::$repository = $this->repository;
        return SupplyChainUserDbStub::class;
    }
}

final class SupplyChainUserDbStub
{
    public static ?SupplyChainRepositoryStub $repository = null;

    public static function exec(string $sql): int
    {
        if (self::$repository !== null) {
            self::$repository->userDbExecCalls[] = $sql;
        }
        return 1;
    }
}

final class AccountUserMappingTypeModelStub
{
    public function __construct(private SupplyChainRepositoryStub $repository)
    {
    }

    public function findOne(array $criteria)
    {
        return new class($this->repository->mappingTypeId) {
            public function __construct(private int $id)
            {
            }

            public function getId(): int
            {
                return $this->id;
            }
        };
    }
}

final class OfferingRegionMappingModelStub
{
    public function __construct(private SupplyChainRepositoryStub $repository)
    {
    }

    public function findAll(array $filters = []): array
    {
        return $this->repository->offeringRegionMappings;
    }
}

final class SupplyChainCollectionStub
{
    public static array $constructed = [];
    public static array $nextDataQueue = [];
    public static array $nextAssocQueue = [];
    public static array $nextCountQueue = [];
    private static ?SupplyChainCollectionModelStub $model = null;

    public static function reset(): void
    {
        self::$constructed = [];
        self::$nextDataQueue = [];
        self::$nextAssocQueue = [];
        self::$nextCountQueue = [];
        self::$model = new SupplyChainCollectionModelStub();
    }

    public function __construct(
        int $accountOwnerId,
        array $attributes,
        AbstractModel $userMappingModel,
        int $limit = 0,
        int $offset = 0,
        string $term = '',
        string $orderBy = 'company',
        int $order = 0
    ) {
        self::$constructed[] = [
            'account_id' => $accountOwnerId,
            'attributes' => $attributes,
            'limit' => $limit,
            'offset' => $offset,
            'term' => $term,
            'orderBy' => $orderBy,
            'order' => $order,
        ];
    }

    public function getModel(): AbstractModel
    {
        return self::$model ??= new SupplyChainCollectionModelStub();
    }

    public function getCollectionData(array $sids = [], bool $associate_array = false)
    {
        if ($associate_array) {
            return array_shift(self::$nextAssocQueue) ?? [];
        }
        return array_shift(self::$nextDataQueue) ?? [];
    }

    public function getCollectionCount(): int
    {
        $count = array_shift(self::$nextCountQueue) ?? 0;
        if (self::$model) {
            self::$model->setCount($count);
        }
        return $count;
    }
}

final class SupplyChainCollectionModelStub extends AbstractModel
{
    private int $count = 0;

    public function setCount(int $count): void
    {
        $this->count = $count;
    }

    public function getCount(array $where = []): int
    {
        return $this->count;
    }

    public function getName(): string
    {
        return 'supply_chain_stub';
    }

    public function getDb()
    {
        return new class {
        };
    }
}

final class SupplyChainDbStub
{
    public static ?SupplyChainRepositoryStub $repository = null;

    public static function getAll(string $sql): array
    {
        return self::$repository?->supplyChainDbResults ?? [];
    }
}

final class SupplyChainDbUnavailableStub
{
}

final class SupplyChainLoadResultStub
{
    public function __construct(
        private SupplyChainRepositoryStub $repository,
        private int $accountId,
        private array $tradeFilter
    ) {
    }

    public function mapRegions($regionRepository): self
    {
        $this->repository->mapRegionsInvocations[] = [
            'account_id' => $this->accountId,
            'trade_filter' => $this->tradeFilter,
            'region_repository' => is_object($regionRepository) ? get_class($regionRepository) : $regionRepository,
        ];

        return $this;
    }

    public function getChainByTrade(int $tradeId): array
    {
        return $this->repository->chainsByTrade[$tradeId] ?? [];
    }
}
