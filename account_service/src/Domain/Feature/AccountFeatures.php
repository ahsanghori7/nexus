<?php

declare(strict_types=1);

namespace App\Domain\Feature;

use App\Domain\AbstractModel;

class AccountFeatures extends AbstractModel
{
    use \App\Domain\Traits\LabelTrait;

    /**
     * The table associated with the model.
     *
     * @var string
     */
    protected $table = 'account_features';

    /**
     * @var array
     */
    protected $columns = [
        'account_id' => [
            'type' => 'int',
            'required' => true
        ],
    ];
}
