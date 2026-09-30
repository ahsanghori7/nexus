<?php

declare(strict_types=1);

namespace App\Domain\Threshold;

use App\Domain\AbstractModel;

/**
 * Class ApprovalThresholds
 * @package App\Domain\Threshold
 */
class ApprovalThresholds extends AbstractModel
{
    /**
     * @var array
     */
    protected $columns = [
        'account_id' => [
            'type' => 'int',
            'required' => true,
        ],
        'from_value' => [
            'type' => 'decimal',
            'precision' => 10,
            'scale' => 2,
            'required' => true,
        ],
        'to_value' => [
            'type' => 'decimal',
            'precision' => 10,
            'scale' => 2,
            'required' => false,
        ],
    ];
}
