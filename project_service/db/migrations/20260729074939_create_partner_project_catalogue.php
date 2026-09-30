<?php

declare(strict_types=1);

use Phinx\Migration\AbstractMigration;

final class CreatePartnerProjectCatalogue extends AbstractMigration
{
    public function up(): void
    {
        $this->table('partner_project_catalogue', ['id' => false, 'primary_key' => 'id'])
            ->addColumn('id', 'integer', ['identity' => true])
            ->addColumn('api_client_id', 'integer', ['null' => true])
            ->addColumn('group_id', 'integer', ['null' => true])
            ->addColumn('external_id', 'string', ['limit' => 150, 'null' => true])
            ->addColumn('project_code', 'string', ['limit' => 100, 'null' => true])
            ->addColumn('project_name', 'string', ['limit' => 150, 'null' => true])
            ->addColumn('business_unit_code', 'string', ['limit' => 50, 'null' => true])
            ->addColumn('business_unit_name', 'string', ['limit' => 150, 'null' => true])
            ->addColumn('source_payload_hash', 'string', ['limit' => 150, 'null' => true])
            ->addColumn('c_link_project_id', 'integer', ['null' => true])
            ->addForeignKey('c_link_project_id', 'project', 'id', ['delete' => 'SET_NULL', 'update' => 'CASCADE'])
            ->addColumn('created_at', 'timestamp', ['default' => 'CURRENT_TIMESTAMP'])
            ->addColumn('updated_at', 'timestamp', ['default' => 'CURRENT_TIMESTAMP', 'update' => 'CURRENT_TIMESTAMP'])
            ->addColumn('linked_at', 'datetime', ['null' => true])
            ->addIndex(['api_client_id', 'external_id'], ['unique' => true, 'name' => 'uniq_catalogue_client_external'])
            ->addIndex(['c_link_project_id'], ['unique' => true, 'name' => 'uniq_catalogue_project'])
            ->create();
    }

    public function down(): void
    {
        $this->table('partner_project_catalogue')->drop()->save();
    }
}
