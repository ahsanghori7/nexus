<?php

namespace App\Domain\Account\Attribute;

use App\Domain\AbstractModel;

class Attribute extends AbstractModel
{

    const NAME = "attribute";

    protected $columns = [
        'id' => [
            'type' => 'int',
            'required' => true
        ],
        'label' => [
            'type' => 'string',
            'required' => true
        ],
        'attribute_type_id' => [
            'type' => 'int',
            'required' => true
        ]
    ];
}
