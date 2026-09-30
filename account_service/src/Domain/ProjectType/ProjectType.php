<?php


namespace App\Domain\ProjectType;

use App\Domain\AbstractModel;

/**
 * Class ProjectType
 * @package App\Domain\ProjectType
 */
class ProjectType extends AbstractModel
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
        ]
    ];
}
