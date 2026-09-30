<?php
declare(strict_types=1);

namespace App\Domain\Distance;

use App\Domain\AbstractModel;

/**
 * Class Account
 * @package App\Domain\Account
 */
class Distance extends AbstractModel
{
    const NAME = "distance";

    /**
     * @var array
     */
    protected $columns = [
        'id' => [
            'type' => 'int'
        ],
        'origin' => [
            'type' => 'string',
            'required' => true
        ],
        'destination' => [
            'type' => 'string',
            'required' => true
        ],
        'distance' => [
            'type' => 'string',
            'required' => true
        ],
    ];
}
