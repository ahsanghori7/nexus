<?php
declare(strict_types=1);

namespace Tests\Application\Actions\Trade;

use App\Application\Actions\Trade\CategoryAction;
use App\Application\Actions\Action;
use Psr\Log\LoggerInterface;
use Slim\Psr7\Response;
use Tests\TestCase;

final class CategoryRepositoryShim
{
    public static bool $categoryLoaded = true;
    public static array $loadCalls = [];

    public static function reset(): void
    {
        self::$categoryLoaded = true;
        self::$loadCalls = [];
    }

    public function getModel(string $name = '')
    {
        return new CategoryModelShim();
    }
}

final class CategoryModelShim
{
    public function load(int $id): CategoryEntityShim
    {
        CategoryRepositoryShim::$loadCalls[] = $id;
        return new CategoryEntityShim(CategoryRepositoryShim::$categoryLoaded, $id);
    }
}

final class CategoryEntityShim
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

final class TradeRepositoryShim
{
    public static array $tradeSaves = [];
    public static array $tradeCategoryMappingSaves = [];
    public static array $execCalls = [];
    public static int $lastInsertedId = 0;

    public static function reset(): void
    {
        self::$tradeSaves = [];
        self::$tradeCategoryMappingSaves = [];
        self::$execCalls = [];
        self::$lastInsertedId = 0;
    }

    public function getModel(string $name = '')
    {
        return match ($name) {
            'tradeCategoryMapping' => new TradeCategoryMappingModelShim(),
            default => new TradeModelShim(),
        };
    }
}

final class TradeModelShim
{
    public const ID_FIELD = 'id';

    public function save(array $data): TradeEntityShim
    {
        TradeRepositoryShim::$tradeSaves[] = $data;
        TradeRepositoryShim::$lastInsertedId++;
        return new TradeEntityShim(TradeRepositoryShim::$lastInsertedId);
    }

    public function getDB(): TradeDbShim
    {
        return new TradeDbShim();
    }

    public function getName(): string
    {
        return 'trade';
    }
}

final class TradeEntityShim
{
    public function __construct(private int $id)
    {
    }

    public function getId(): int
    {
        return $this->id;
    }
}

final class TradeDbShim
{
    public function exec(string $sql, array $params): void
    {
        TradeRepositoryShim::$execCalls[] = [
            'sql' => $sql,
            'params' => $params,
        ];
    }
}

final class TradeCategoryMappingModelShim
{
    public function save(array $data): void
    {
        TradeRepositoryShim::$tradeCategoryMappingSaves[] = $data;
    }
}

if (!class_exists(\App\Domain\Trade\CategoryRepository::class, false)) {
    class_alias(CategoryRepositoryShim::class, \App\Domain\Trade\CategoryRepository::class);
}

if (!class_exists(\App\Domain\Trade\TradeRepository::class, false)) {
    class_alias(TradeRepositoryShim::class, \App\Domain\Trade\TradeRepository::class);
}

final class CategoryActionTest extends TestCase
{
    protected function setUp(): void
    {
        parent::setUp();
        CategoryRepositoryShim::reset();
        TradeRepositoryShim::reset();
    }

    public function testCreatePackagePersistsTradeAndMapping(): void
    {
        CategoryRepositoryShim::$categoryLoaded = true;

        $action = $this->createAction();
        $this->setActionData($action, [
            'id' => 3,
            'label' => 'New Trade',
            'trade_id' => 22,
        ]);

        $response = $action->createPackage(
            $this->createRequest('POST', '/v1/trade/category/package'),
            new Response(),
            []
        );

        self::assertSame(200, $response->getStatusCode());
        self::assertSame(
            [
                ['label' => 'New Trade'],
            ],
            TradeRepositoryShim::$tradeSaves
        );
        self::assertSame(
            [
                [
                    'sql' => 'UPDATE trade SET id = ? WHERE id = ?',
                    'params' => [22, TradeRepositoryShim::$lastInsertedId],
                ],
            ],
            TradeRepositoryShim::$execCalls
        );
        self::assertSame(
            [
                ['trade_id' => 22, 'category_id' => 3],
            ],
            TradeRepositoryShim::$tradeCategoryMappingSaves
        );
    }

    public function testCreatePackageSkipsWhenCategoryMissing(): void
    {
        CategoryRepositoryShim::$categoryLoaded = false;

        $action = $this->createAction();
        $this->setActionData($action, [
            'id' => 5,
            'label' => 'Missing Category',
            'trade_id' => 30,
        ]);

        $response = $action->createPackage(
            $this->createRequest('POST', '/v1/trade/category/package'),
            new Response(),
            []
        );

        self::assertSame(200, $response->getStatusCode());
        self::assertSame([], TradeRepositoryShim::$tradeSaves);
        self::assertSame([], TradeRepositoryShim::$tradeCategoryMappingSaves);
        self::assertSame([], TradeRepositoryShim::$execCalls);
    }

    private function createAction(): CategoryActionUnderTest
    {
        $logger = $this->createMock(LoggerInterface::class);
        return new CategoryActionUnderTest($logger);
    }

    private function setActionData(Action $action, array $data): void
    {
        $ref = new \ReflectionClass(Action::class);
        $prop = $ref->getProperty('data');
        $prop->setAccessible(true);
        $prop->setValue($action, $data);
    }
}

final class CategoryActionUnderTest extends CategoryAction
{
    public function __construct(LoggerInterface $logger)
    {
        parent::__construct($logger);
        $this->repository = new CategoryRepositoryShim();
    }
}
