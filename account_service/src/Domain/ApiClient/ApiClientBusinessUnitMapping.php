<?php

declare(strict_types=1);

namespace App\Domain\ApiClient;

use App\Domain\AbstractModel;

/**
 * @package App\Domain\ApiClient
 */
class ApiClientBusinessUnitMapping extends AbstractModel
{
    /**
     * @var array
     */
    protected $columns = [
        'id' => ['type' => 'int'],
        'api_client_id' => ['type' => 'int', 'required' => true],
        'account_group_id' => ['type' => 'int', 'required' => true],
        'external_code' => ['type' => 'string', 'required' => true, 'validate' => 'maxlength:50'],
        'external_name' => ['type' => 'string', 'required' => true, 'validate' => 'maxlength:150'],
        'active' => ['type' => 'int'],
        'created_at' => ['type' => 'datetime', 'required' => false],
        'updated_at' => ['type' => 'datetime', 'required' => false],
    ];

    /**
     * @return bool
     */
    public function isActive(): bool
    {
        return (int) $this->getData('active') === 1;
    }
}
