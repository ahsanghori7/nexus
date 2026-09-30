<?php
declare(strict_types=1);

use Phinx\Migration\AbstractMigration;
use Phinx\Db\Adapter\MysqlAdapter;

final class AddProjectSectionsColumnsToProject extends AbstractMigration
{
    /**
     * Migrate Up.
     */
    public function up()
    {
        $this->table('project')
            ->addColumn('global_date_for_possession', 'date', ['null' => true, 'default' => null, 'after' => 'site_constrains'])
            ->addColumn('project_sections', 'json', ['null' => true, 'default' => null, 'after' => 'global_date_for_possession'])
            ->changeColumn('sectional_completion_dates', 'boolean', ['null' => true, 'default' => null, 'limit' => MysqlAdapter::INT_TINY])
            ->update();
    }

    /**
     * Migrate Down.
     */
    public function down(): void
    {
        $this->table('project')
            ->removeColumn('global_date_for_possession')
            ->removeColumn('project_sections')
            ->changeColumn('sectional_completion_dates', 'text', ['null' => true, 'default' => null, 'limit' => MysqlAdapter::TEXT_TINY])
            ->update();
    }
}
