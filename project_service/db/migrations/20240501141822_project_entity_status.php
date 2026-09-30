<?php
declare(strict_types=1);

use Phinx\Migration\AbstractMigration;


include(__DIR__ . '/../common_config.php');

final class ProjectEntityStatus extends AbstractMigration
{
    /**
     * Change Method.
     *
     * Status is used across multiple tables with the same values in project service and beyond, it makes more sense to
     * start a unified data structure that fits these use cases.
     *
     */
    public function change(): void
    {

        $this->table('project_entity_status', getComonConfig()["generic_table_config"])
            ->addColumn('id', 'integer', ['identity' => true])
            ->addColumn('label', 'string', ['limit' => 100, 'null' => false])
            ->create();

        $this->table('project_entity_status')->insert([
            ['label' => 'initialized'],['label' => 'draft'], ['label' => 'published'], ['label' => 'deleted'], ['label' => 'archived']
        ])->save();

    }
}
