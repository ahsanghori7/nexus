<?php
declare(strict_types=1);

use Phinx\Migration\AbstractMigration;

final class CreateProjectIntegrationMapping extends AbstractMigration
{
    protected $commonConfig = [
        'engine' => 'InnoDB',
        'collation' => 'latin1_general_ci',
        'id' => false,
        'primary_key' => ['id']
    ];

    public function change(): void
    {
        $this->table('project_integration_mapping', $this->commonConfig)
            ->addColumn('id', 'integer', ['identity' => true])
            ->addColumn('project_id', 'integer', ['null' => false])
            ->addColumn('provider_id', 'integer', ['null' => false])
            ->addColumn('integration_id', 'string', ['limit' => 255, 'null' => true])
            ->addColumn('integration_name', 'string', ['limit' => 255, 'null' => true])
            ->addColumn('integration_uri', 'string', ['limit' => 500, 'null' => true])
            ->addColumn('meta', 'text', ['null' => true]) // JSON field
            ->addColumn('created_at', 'datetime', ['null' => true])
            ->addColumn('updated_at', 'datetime', ['null' => true])
            ->addForeignKey('project_id', 'project', 'id', ['delete' => 'CASCADE', 'update' => 'CASCADE'])
            ->addIndex(['project_id', 'provider_id'], ['unique' => true, 'name' => 'uniq_project_provider'])
            ->addIndex(['project_id'], ['name' => 'idx_project'])
            ->create();
    }
}
