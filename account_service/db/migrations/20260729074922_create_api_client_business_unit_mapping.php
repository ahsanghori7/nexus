<?php

declare(strict_types=1);

use Phinx\Migration\AbstractMigration;

final class CreateApiClientBusinessUnitMapping extends AbstractMigration
{
    public function up(): void
    {
        $this->table('api_client_business_unit_mapping', ['id' => false, 'primary_key' => 'id'])
            ->addColumn('id', 'integer', ['signed' => true, 'identity' => true])
            ->addColumn('api_client_id', 'integer', ['signed' => true])
            ->addForeignKey('api_client_id', 'api_client', 'id', ['delete' => 'CASCADE', 'update' => 'CASCADE'])
            ->addColumn('account_id', 'integer', ['signed' => true])
            ->addForeignKey('account_id', 'account', 'id', ['delete' => 'CASCADE', 'update' => 'CASCADE'])
            ->addColumn('external_code', 'string', ['limit' => 50])
            ->addColumn('external_name', 'string', ['limit' => 150])
            ->addColumn('active', 'boolean', ['default' => true])
            ->addColumn('created_at', 'timestamp', ['default' => 'CURRENT_TIMESTAMP'])
            ->addColumn('updated_at', 'timestamp', ['default' => 'CURRENT_TIMESTAMP', 'update' => 'CURRENT_TIMESTAMP'])
            ->addIndex(['api_client_id', 'external_code'], ['unique' => true, 'name' => 'uniq_bu_mapping_client_code'])
            ->create();
    }

    public function down(): void
    {
        $this->table('api_client_business_unit_mapping')->drop()->save();
    }
}
