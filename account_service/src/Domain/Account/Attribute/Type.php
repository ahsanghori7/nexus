<?php

namespace App\Domain\Account\Attribute;

use App\Domain\AbstractModel;

class Type extends AbstractModel
{

    const NAME = "attribute_type";

    protected $columns = [
        'id' => [
            'type' => 'int',
            'required' => true
        ],
        'label' => [
            'type' => 'string',
            'required' => true
        ]
    ];
}
