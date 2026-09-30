<?php

namespace App\Domain\Account\Provider;

use App\Domain\AbstractModel;

class ProviderAccountMapping extends AbstractModel
{
    const NAME = "provider_account_mapping";
    /**
     * @var array
     */
    protected $columns = [
        'account_id' => [
            'type' => 'int'
        ],
        'provider_id' => [
            'type' => 'int',
            'required' => true
        ],
        'meta' => [
            'type' => 'string',
            'required' => false
        ],
    ];
}
