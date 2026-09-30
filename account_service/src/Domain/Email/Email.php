<?php
declare(strict_types=1);

namespace App\Domain\Email;

use App\Domain\AbstractTypedModel;

/**
 * Class Email
 * @package App\Domain\Email
 */
class Email extends AbstractTypedModel
{
    /**
     * @var array
     */
    protected $meta_cache = [];

    /**
     * @var array
     */
    protected $columns = [
        'uid' => [
            'type' => 'int',
            'required' => true
        ],
        'label' => [
            'type' => 'string',
            'required' => true
        ],
    ];

}
