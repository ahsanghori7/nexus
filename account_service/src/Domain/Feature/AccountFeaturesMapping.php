<?php

declare(strict_types=1);

namespace App\Domain\Feature;

use App\Domain\AbstractModel;

class AccountFeaturesMapping extends AbstractModel
{
    use \App\Domain\Traits\LabelTrait;

    /**
     * The table associated with the model.
     *
     * @var string
     */
    protected $table = 'account_features_mapping';

    /**
     * @var array
     */
    protected $columns = [
        'account_features_id' => [
            'type' => 'int',
            'required' => true
        ],
        "feature_id" => [
            "type" => 'int',
            "required" => true
        ],
    ];
}
