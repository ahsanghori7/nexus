<?php
declare(strict_types=1);

namespace App\Domain\Account;

use App\Domain\AbstractTypeModel;

/**
 * Class Account
 * @package App\Domain\Account
 */
class ClientReferences extends AbstractTypeModel
{
    /**
     * @var array
     */
    protected $columns = [
        'id' => [
            'type' => 'int',
            'required' => true
        ],
        'account_id' => [
            'type' => 'int',
            'required' => true
        ],
        "project_name" => [
            "type" => 'string',
            "required" => true
        ],
        'client_name' => [
            'type' => 'string',
            'required' => true
        ],
        "contract_value" => [
            "type" => 'string',
            "required" => true
        ],
        "contact_name" => [
            "type" => 'string',
            "required" => true
        ],
        "contact_email" => [
            "type" => 'string',
            "required" => true
        ],
        "completion_date" => [
            "type" => 'string',
            "required" => true
        ],
        "reference_pdf" => [
            "type" => 'string',
            "required" => true
        ],
        "sow" => [
            "type" => 'string',
            "required" => false
        ],
        "client_summary" => [
            "type" => 'string',
            "required" => false
        ],
        "status" => [
            "type" => 'int',
            "required" => true
        ],
        "updated_at" => [
            "type" => 'string',
            "required" => false
        ],
    ];
}
