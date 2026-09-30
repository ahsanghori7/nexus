<?php
declare(strict_types=1);

namespace App\Domain\Email;

use App\Domain\AbstractTypedModel;

/**
 * Class EmailBlacklisted
 * @package App\Domain\Email
 */
class EmailBlacklisted extends AbstractTypedModel
{
    /**
     * @var array
     */
    protected $columns = [
        'email_id' => [
            'type' => 'int',
            'required' => true
        ],
        "user_id" => [
            "type" => 'int',
            "required" => true
        ],
        'added_at' => [
            'type' => 'string',
            'required' => false
        ],
    ];

}
