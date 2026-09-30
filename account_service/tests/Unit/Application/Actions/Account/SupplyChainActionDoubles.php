<?php
declare(strict_types=1);

namespace Tests\Application\Actions\Account;

require_once __DIR__ . '/SupplyChainSharedStubs.php';

final class CategoryRepositoryDouble
{
    public static array $categories = [];
    public static array $findAllCalls = [];

    public static function reset(): void
    {
        self::$categories = [];
        self::$findAllCalls = [];
    }

    public function findAll(array $filters = [], int $limit = 0, int $offset = 0): array
    {
        self::$findAllCalls[] = [
            'filters' => $filters,
            'limit' => $limit,
            'offset' => $offset,
        ];

        return self::$categories;
    }
}

final class TradeRepositoryDouble
{
    public static array $trades = [];

    public static function reset(): void
    {
        self::$trades = [];
    }

    public function getModel(): TradeModelDouble
    {
        return new TradeModelDouble();
    }
}

final class TradeModelDouble
{
    public function load(int $id): TradeEntityDouble
    {
        $data = TradeRepositoryDouble::$trades[$id] ?? null;
        $loaded = $data !== null;

        return new TradeEntityDouble($loaded, $loaded ? (int) ($data['id'] ?? $id) : $id);
    }
}

final class TradeEntityDouble
{
    public function __construct(private bool $loaded, private int $id)
    {
    }

    public function isLoaded(): bool
    {
        return $this->loaded;
    }

    public function getId(): int
    {
        return $this->id;
    }
}

final class RegionRepositoryDouble
{
    public static array $mapCalls = [];
    public static array $mappings = [];

    public static function reset(): void
    {
        self::$mapCalls = [];
        self::$mappings = [];
    }

    public function map(int $childId, array $regions, string $type, int $parentId, bool $addOnly): void
    {
        self::$mapCalls[] = [
            'child_id' => $childId,
            'regions' => $regions,
            'type' => $type,
            'parent_id' => $parentId,
            'add_only' => $addOnly,
        ];
    }

    public function getMappings(array $ids, string $type): array
    {
        return self::$mappings;
    }
}

final class SupplyChainActionDoubleRegistrar
{
    public static function register(): void
    {
        self::alias(CategoryRepositoryDouble::class, \App\Domain\Trade\CategoryRepository::class);
        self::alias(TradeRepositoryDouble::class, \App\Domain\Trade\TradeRepository::class);
        self::alias(RegionRepositoryDouble::class, \App\Domain\Region\RegionRepository::class);
        self::alias(SupplyChainCollectionStub::class, \App\Domain\Supplychain\Collection::class);
    }

    private static function alias(string $double, string $target): void
    {
        if (!class_exists($target, false)) {
            class_alias($double, $target);
        }
    }
}
