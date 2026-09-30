<?php

declare(strict_types=1);

namespace App\Domain\Project\PartnerCatalogue;

use App\Domain\AbstractModel;

/**
 * @package App\Domain\Project\PartnerCatalogue
 */
class PartnerProjectCatalogue extends AbstractModel
{
    /**
     * @var string
     */
    protected $table = 'partner_project_catalogue';

    /**
     * @var array
     */
    protected $fillable = [
        'api_client_id',
        'group_id',
        'external_id',
        'project_code',
        'project_name',
        'business_unit_code',
        'business_unit_name',
        'source_payload_hash',
        'c_link_project_id',
        'created_at',
        'updated_at',
        'linked_at',
    ];

    /**
     * @var array
     */
    protected $columns = [
        'id' => ['type' => 'int'],
        'api_client_id' => ['type' => 'int', 'required' => true],
        'group_id' => ['type' => 'int', 'required' => false],
        'external_id' => ['type' => 'string', 'required' => true],
        'project_code' => ['type' => 'string', 'required' => true],
        'project_name' => ['type' => 'string', 'required' => true],
        'business_unit_code' => ['type' => 'string', 'required' => true],
        'business_unit_name' => ['type' => 'string', 'required' => false],
        'source_payload_hash' => ['type' => 'string', 'required' => false],
        'c_link_project_id' => ['type' => 'int', 'required' => false],
        'created_at' => ['type' => 'datetime', 'required' => false],
        'updated_at' => ['type' => 'datetime', 'required' => false],
        'linked_at' => ['type' => 'datetime', 'required' => false],
    ];
}
