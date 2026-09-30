<?php

namespace App\Domain\Account\Provider;

use App\Domain\AbstractModel;


/**
 * Class ProviderType
 * @package App\Domain\Account\Provider
 */
class ProviderType extends AbstractModel
{

    const NAME = "provider_type";
    /**
     * @var array
     */
    protected $columns = [
        'id' => [
            'type' => 'int'
        ],
        'label' => [
            'type' => 'string',
            'required' => true
        ]
    ];
}
