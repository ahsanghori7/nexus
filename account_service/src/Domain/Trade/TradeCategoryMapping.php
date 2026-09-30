<?php
declare(strict_types=1);

namespace App\Domain\Trade;

use App\Domain\AbstractModel;

/**
 * Class TradeCategoryMapping
 * @package App\Domain\TradeCategoryMapping
 */
class TradeCategoryMapping extends AbstractModel
{

  /**
   * @var array
   */
  protected $columns = [
    'id' => [
      'type' => 'int'
    ],
    'category_id' => [
      'type' => 'int',
      'required' => true
    ],
    'trade_id' => [
      'type' => 'int',
      'required' => true
    ]
  ];
}
