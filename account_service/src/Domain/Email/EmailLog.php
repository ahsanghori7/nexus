<?php
declare(strict_types=1);

namespace App\Domain\Email;

use App\Domain\AbstractTypedModel;

/**
 * Class EmailLog
 * @package App\Domain\Email
 */
class EmailLog extends AbstractTypedModel
{
    /**
     * @var array
     */
    protected $columns = [
        "email_id" => [
            "type" => 'int',
            "required" => true
        ],
        'user_id' => [
            'type' => 'int',
            'required' => true
        ],
        'template' => [
            'type' => 'string',
            'required' => false
        ],
        'sent_date' => [
            'type' => 'string',
            'required' => false
        ],
        'meta' => [
            'type' => 'string',
            'required' => false
        ],
    ];

}
