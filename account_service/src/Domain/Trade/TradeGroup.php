<?php

declare(strict_types=1);

namespace App\Domain\Trade;

use App\Domain\AbstractModel;

/**
 * Class TradeGroup
 * @package App\Domain\TradeGroup
 */
class TradeGroup extends AbstractModel
{

  const NAME = "trade_group";

  /**
   * @var array
   */
  protected $columns = [
    'id' => [
      'type' => 'int'
    ],
    'type_id' => [
      'type' => 'int',
      'required' => true
    ],
    'trade_id' => [
      'type' => 'int',
      'required' => true
    ]
  ];

  /**
   * Joins the related trade so callers get trade info alongside trade group data.
   * @param array|string[] $cols
   * @return string
   */
  public function getSelect(array $cols = ["*"]): string
  {
    $sql = "SELECT tg.id as id, tg.type_id as type_id, tg.trade_id as trade_id, t.label as trade_label FROM trade_group tg";
    $sql .= " join trade t on t.id = tg.trade_id";
    return $sql;
  }

}
