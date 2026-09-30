<?php
declare(strict_types=1);

use Phinx\Migration\AbstractMigration;

final class BoqEntityItemColumnUpdates extends AbstractMigration
{

    /**
     * @var array
     */
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

        $this->table('boq_entity', $this->commonConfig)
            ->addIndex(['tender_id'], ['unique' => true])
            ->removeColumn('status')
            ->update();

        $this->table('boq_item', $this->commonConfig)
            ->removeColumn('parent_id')
            ->removeColumn('unit_id')
            ->removeColumn('item_no')
            ->removeColumn('description')
            ->removeColumn('quantity')
            ->dropForeignKey(['parent_id', 'boq_item', 'id'])
            ->dropForeignKey(['unit_id', 'unit', 'id'])
            ->addColumn('boq_item_created_at', 'datetime', ['null' => false, 'default' => 'CURRENT_TIMESTAMP'])
            ->update();

        $this->table('boq_item_mapping', $this->commonConfig)
            ->addColumn('id', 'integer', ['identity' => true])
            ->addColumn('boq_item_id', 'integer', ['null' => false])
            ->addColumn('parent_id', 'integer', ['null' => true])
            ->addColumn('unit_id', 'integer', ['null' => true])
            ->addColumn('item_no', 'string', ['limit' => 255, 'null' => true])
            ->addColumn('description', 'string', ['limit' => 255, 'null' => true])
            ->addColumn('quantity', 'decimal', ['precision' => 12, 'scale' => 2, 'default' => 0, 'null' => false])
            ->addColumn('type', 'enum', ['values' => ['section', 'grouped_heading', 'item'], 'null' => false, 'default' => 'item'])
            ->addColumn('budget', 'integer', ['null' => true])
            ->addColumn('position', 'integer', ['null' => false, 'default' => 0])
            ->addForeignKey('parent_id', 'boq_item_mapping', 'id', ['delete' => 'CASCADE', 'update' => 'CASCADE'])
            ->addForeignKey('unit_id', 'unit', 'id', ['delete' => 'CASCADE', 'update' => 'CASCADE'])
            ->addForeignKey('boq_item_id', 'boq_item', 'id', ['delete' => 'CASCADE', 'update' => 'CASCADE'])
            ->create();

        $this->table('boq_item_version', $this->commonConfig)
            ->addColumn('id', 'integer', ['identity' => true])
            ->addColumn('boq_item_id', 'integer', ['null' => false])
            ->addColumn('version', 'integer', ['null' => true, 'default' => 1])
            ->addColumn('status', 'enum', ['values' => ['draft', 'published', 'tendered', 'deleted'], 'null' => false, 'default' => 'draft'])
            ->addForeignKey('boq_item_id', 'boq_item_mapping', 'id', ['delete' => 'CASCADE', 'update' => 'CASCADE'])
            ->create();

        $this->table('boq_item_version', $this->commonConfig)
            ->renameColumn("boq_item_id", "boq_item_mapping_id")
            ->update();
    }
}
