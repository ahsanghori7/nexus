<?php


namespace App\Domain\Region;

use App\Domain\AbstractModel;

/**
 * Class RegionGroup
 * @package App\Domain\Region
 */
class RegionGroup extends AbstractModel
{

    /**
     * @var array
     */
    protected $columns = [
        'id' => [
            'type' => 'int'
        ],
        'label' => [
            'type' => 'string'
        ],
        'code' => [
            'type' => 'string'
        ]
    ];
}
