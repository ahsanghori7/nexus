<?php

declare(strict_types=1);

use Phinx\Migration\AbstractMigration;

final class AddNotesItemMapping extends AbstractMigration
{
    protected $commonConfig = [
        'engine' => 'InnoDB',
        'collation' => 'latin1_general_ci',
        'id' => false,
        'primary_key' => ['id']
    ];

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
        $this->table('boq_item_mapping')
            ->addColumn('tenderee_note', 'text', ['null' => false, 'after' => 'budget_total'])
            ->update();

        $this->table('boq_note')->rename('boq_resource')->update();
        $this->table('boq_note_mapping')->rename('boq_resource_mapping')->update();
        $this->table('boq_note_version')->rename('boq_resource_version')->update();

        $this->table('boq_resource_version')
            ->renameColumn('boq_note_id', 'boq_resource_mapping_id')
            ->changeColumn('boq_resource_mapping_id', 'integer', ['null' => false])
            ->update();

        $this->table('boq_resource_mapping')
            ->renameColumn('note_id', 'boq_resource_id')
            ->changeColumn('boq_resource_id', 'integer', ['null' => true, 'default' => null])
            ->update();

        $this->table('boq_resource_type', $this->commonConfig)
            ->addColumn('id', 'integer', ['identity' => true])
            ->addColumn('label', 'string', ['limit' => 100, 'null' => false])
            ->create();
    }
}
