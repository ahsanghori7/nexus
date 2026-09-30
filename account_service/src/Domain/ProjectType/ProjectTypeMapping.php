<?php


namespace App\Domain\ProjectType;

use App\Domain\AbstractTypedModel;


class ProjectTypeMapping extends AbstractTypedModel
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
        'type_id' => [
            'type' => 'int',
            'required' => true
        ],
    ];
}
