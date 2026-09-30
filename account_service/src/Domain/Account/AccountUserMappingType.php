<?php
namespace App\Domain\Account;
use App\Domain\AbstractTypeModel;

class AccountUserMappingType extends AbstractTypeModel
{
    /**
     * @var array
     */
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
