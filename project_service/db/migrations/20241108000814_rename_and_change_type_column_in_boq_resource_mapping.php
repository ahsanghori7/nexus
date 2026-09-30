<?php

declare(strict_types=1);

use Phinx\Migration\AbstractMigration;

final class RenameAndChangeTypeColumnInBoqResourceMapping extends AbstractMigration
{
    /**
     * Change Method.
     *
     * Write your reversible migrations using this method.
     *
     * More information on writing migrations is available here:
     * https://book.cakephp.org/phinx/0/en/migrations.html#the-change-method
     *
     * Remember to call "create()" or "update()" and NOT "save()" when working
     * with the Table class.
     */
    public function change(): void
    {
        $this->table('boq_resource_mapping')
            ->renameColumn('type', 'boq_resource_type_id')
            ->changeColumn('boq_id', 'integer', ['null' => false])
            ->changeColumn('boq_resource_type_id', 'integer', ['null' => false])
            ->removeIndexByName('note_id')
            ->addIndex(['boq_resource_id'], ['name' => 'boq_resource_id', 'type' => 'BTREE'])
            ->addForeignKey('boq_resource_type_id', 'boq_resource_type', 'id', ['delete' => 'CASCADE', 'update' => 'CASCADE'])
            ->update();
    }
}
