<?php


namespace App\Domain\Trade;

use App\Domain\AbstractTypedModel;

class TradeMapping extends AbstractTypedModel
{

    /**
     * @var array
     */
    protected $columns = [
        'id' => [
            'type' => 'int'
        ],
        'account_id' => [
            'type' => 'int',
            'required' => true
        ],
        'trade_id' => [
            'type' => 'int',
            'required' => true
        ],
    ];
}
