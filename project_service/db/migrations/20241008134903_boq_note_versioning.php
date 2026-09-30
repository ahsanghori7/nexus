<?php

declare(strict_types=1);

use Phinx\Migration\AbstractMigration;

final class BoqNoteVersioning extends AbstractMigration
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
        $this->table('boq_note_version', $this->commonConfig)
            ->addColumn('id', 'integer', ['identity' => true])
            ->addColumn('boq_note_id', 'integer', ['null' => false])
            ->addColumn('version', 'integer', ['null' => true, 'default' => 1])
            ->addColumn('status', 'integer', ['null' => false])
            ->addForeignKey('boq_note_id', 'boq_note_mapping', 'id', ['delete' => 'CASCADE', 'update' => 'CASCADE'])
            ->addForeignKey('status', 'project_entity_status', 'id', ['delete' => 'CASCADE', 'update' => 'CASCADE'])
            ->create();

        $table = $this->table('boq_note_mapping');
        $table->changeColumn('type', 'enum', [
            'values' => ['boq_entity', 'boq_item', 'allowances_notes', 'programme'],
            'null' => false,
            'encoding' => 'latin1',
            'collation' => 'latin1_general_ci',
        ])->update();
    }
}
