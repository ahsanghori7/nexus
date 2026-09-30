<?php

declare(strict_types=1);

namespace App\Domain\Trade;

use App\Domain\AbstractRepository;

use App\Domain\Trade\Trade;
use App\Domain\Trade\TradeCategoryMapping;
use App\Domain\Trade\TradeGroup;

/**
 * Class TradeRepository
 * @package App\Domain\Account
 */
class TradeRepository extends AbstractRepository
{
    /**
     * Allow a default model to be set for get model function
     */
    const DEFAULT_MODEL = "trade";

    /**
     * @var string[]
     */
    protected $models = [
        "trade" => Trade::class,
        "tradeCategoryMapping" => TradeCategoryMapping::class,
        "tradeGroup" => TradeGroup::class,
        "tradeMapping" => TradeMapping::class,
    ];

    /**
     * @param array $filters
     * @return array
     */
    public function getTradeGroup(array $filters = []): array
    {
        $rows = $this->getModel('tradeGroup')->findAll($filters);

        return array_map(function (array $row): array {
            return [
                'id' => (int) $row['id'],
                'type_id' => (int) $row['type_id'],
                'trade_id' => (int) $row['trade_id'],
                'trade' => [
                    'id' => (int) $row['trade_id'],
                    'label' => $row['trade_label'],
                ],
            ];
        }, $rows);
    }
}
