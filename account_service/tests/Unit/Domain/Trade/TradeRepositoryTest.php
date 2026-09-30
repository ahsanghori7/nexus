<?php
declare(strict_types=1);

namespace Tests\Domain\Trade;

use App\Domain\Trade\TradeRepository;
use PHPUnit\Framework\TestCase;

/**
 * @runTestsInSeparateProcesses
 * @preserveGlobalState disabled
 */
final class TradeRepositoryTest extends TestCase
{
    public function testGetTradeGroupNestsTradeDataUnderEachRow(): void
    {
        TradeGroupModelStub::reset();
        TradeGroupModelStub::$records = [
            ['id' => 1, 'type_id' => 5, 'trade_id' => 10, 'trade_label' => 'Tiling'],
            ['id' => 2, 'type_id' => 5, 'trade_id' => 11, 'trade_label' => 'Paving'],
        ];

        $repository = new TradeRepository();
        $this->overrideRepositoryModel($repository);

        $result = $repository->getTradeGroup(['type_id' => 5]);

        self::assertSame(
            [
                ['id' => 1, 'type_id' => 5, 'trade_id' => 10, 'trade' => ['id' => 10, 'label' => 'Tiling']],
                ['id' => 2, 'type_id' => 5, 'trade_id' => 11, 'trade' => ['id' => 11, 'label' => 'Paving']],
            ],
            $result
        );

        self::assertSame([['type_id' => 5]], TradeGroupModelStub::$findAllCalls);
    }

    private function overrideRepositoryModel(TradeRepository $repository): void
    {
        $prop = new \ReflectionProperty(TradeRepository::class, 'models');
        $prop->setAccessible(true);
        $prop->setValue($repository, ['tradeGroup' => TradeGroupModelStub::class]);
    }
}

final class TradeGroupModelStub
{
    public static array $records = [];
    public static array $findAllCalls = [];

    public static function reset(): void
    {
        self::$records = [];
        self::$findAllCalls = [];
    }

    public function findAll(array $filters = []): array
    {
        self::$findAllCalls[] = $filters;
        return self::$records;
    }
}
