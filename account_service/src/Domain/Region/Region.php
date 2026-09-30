<?php


namespace App\Domain\Region;

use App\Domain\AbstractModel;

/**
 * Class Region
 * @package App\Domain\Region
 */
class Region extends AbstractModel
{

    use \App\Domain\Traits\LabelTrait;

    /**
     * @var array
     */
    protected $columns = [
        'id' => [
            'type' => 'int'
        ],
        'label' => [
            'type' => 'int'
        ],
        'region_group_id' => [
            'type' => 'int',
            'required' => true
        ]
    ];
}
