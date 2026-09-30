<?php

namespace App\Domain\Account\Attribute;

use App\Domain\AbstractModel;

class CategoryMapping extends AbstractModel
{

    const NAME = "attribute_category_mapping";

    protected $columns = [
        'category_id' => [
            'type' => 'int',
            'required' => true
        ],
        'attribute_id' => [
            'type' => 'int',
            'required' => true
        ]
    ];
}
