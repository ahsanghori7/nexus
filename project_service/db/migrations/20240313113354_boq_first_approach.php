<?php

declare(strict_types=1);

use Phinx\Migration\AbstractMigration;

final class BoqFirstApproach extends AbstractMigration
{

    protected $unitData = [
        ['name' => 'Meter', 'symbol' => 'm'],
        ['name' => 'Square Meter', 'symbol' => 'm²'],
        ['name' => 'Cubic Meter', 'symbol' => 'm³'],
        ['name' => 'Millimeter', 'symbol' => 'mm'],
        ['name' => 'Number', 'symbol' => 'nr'],
        ['name' => 'Kilogram', 'symbol' => 'kg'],
        ['name' => 'Metric Ton', 'symbol' => 't'],
        ['name' => 'Hour', 'symbol' => 'h'],
        ['name' => 'Weeks', 'symbol' => 'wk'],
        ['name' => 'Prime Cost Sum', 'symbol' => 'p c sum'],
        ['name' => 'Provisional Sum', 'symbol' => 'prov sum'],
        ['name' => 'Item', 'symbol' => 'item'],
        ['name' => 'Percentage', 'symbol' => '%']
    ];

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
        $this->table('unit', $this->commonConfig)
            ->addColumn('id', 'integer', ['identity' => true])
            ->addColumn('name', 'string', ['limit' => 100, 'null' => false])
            ->addColumn('symbol', 'string', ['limit' => 100, 'null' => false])
            ->create();

        $this->table('unit')->insert($this->unitData)->update();

        $this->table('boq_entity', $this->commonConfig)
            ->addColumn('id', 'integer', ['identity' => true])
            ->addColumn('tender_id', 'integer', ['null' => false])
            ->addColumn('created_at', 'datetime', ['null' => false, 'default' => 'CURRENT_TIMESTAMP'])
            ->addColumn('updated_at', 'datetime', ['null' => false, 'default' => 'CURRENT_TIMESTAMP', 'update' => 'CURRENT_TIMESTAMP'])
            ->addColumn('status', 'enum', ['values' => ['initialized', 'draft', 'published', 'tendered'], 'null' => false, 'default' => 'initialized'])
            ->addForeignKey('tender_id', 'tender', 'id', ['delete' => 'CASCADE', 'update' => 'CASCADE'])
            ->create();

        $this->table('boq_item', $this->commonConfig)
            ->addColumn('id', 'integer', ['identity' => true])
            ->addColumn('boq_entity_id', 'integer', ['null' => false])
            ->addColumn('parent_id', 'integer', ['null' => true])
            ->addColumn('unit_id', 'integer', ['null' => true])
            ->addColumn('item_no', 'string', ['limit' => 255, 'null' => false])
            ->addColumn('description', 'string', ['limit' => 255, 'null' => false])
            ->addColumn('quantity', 'decimal', ['precision' => 12, 'scale' => 2, 'default' => 0, 'null' => false])
            ->addForeignKey('boq_entity_id', 'boq_entity', 'id', ['delete' => 'CASCADE', 'update' => 'CASCADE'])
            ->addForeignKey('parent_id', 'boq_item', 'id', ['delete' => 'CASCADE', 'update' => 'CASCADE'])
            ->addForeignKey('unit_id', 'unit', 'id', ['delete' => 'CASCADE', 'update' => 'CASCADE'])
            ->create();

        $this->table('boq_note', $this->commonConfig)
            ->addColumn('id', 'integer', ['identity' => true])
            ->addColumn('text', 'text', ['null' => false])
            ->addColumn('created_at', 'datetime', ['null' => false, 'default' => 'CURRENT_TIMESTAMP'])
            ->addColumn('updated_at', 'datetime', ['null' => false, 'default' => 'CURRENT_TIMESTAMP', 'update' => 'CURRENT_TIMESTAMP'])
            ->create();

        $this->table('boq_note_mapping', $this->commonConfig)
            ->addColumn('id', 'integer', ['identity' => true])
            ->addColumn('note_id', 'integer')
            ->addColumn('boq_id', 'integer', ['null' => false, "comment" => "This column stores boq_entity and boq_item ids"])
            ->addColumn('type', 'enum', ['values' => ['boq_entity', 'boq_item'], 'null' => false])
            ->addForeignKey('note_id', 'boq_note', 'id', ['delete' => 'CASCADE', 'update' => 'CASCADE'])
            ->create();

        $this->table('boq_quote_item', $this->commonConfig)
            ->addColumn('id', 'integer', ['identity' => true])
            ->addColumn('boq_item_id', 'integer', ['null' => false])
            ->addColumn('subcontractor_id', 'integer', ['null' => false])
            ->addColumn('note_id', 'integer', ['null' => true])
            ->addColumn('rate', 'decimal', ['precision' => 12, 'scale' => 2, 'default' => 0, 'null' => false])
            ->addColumn('created_at', 'datetime', ['null' => false, 'default' => 'CURRENT_TIMESTAMP'])
            ->addColumn('updated_at', 'datetime', ['null' => false, 'default' => 'CURRENT_TIMESTAMP', 'update' => 'CURRENT_TIMESTAMP'])
            ->addForeignKey('boq_item_id', 'boq_item', 'id', ['delete' => 'CASCADE', 'update' => 'CASCADE'])
            ->addForeignKey('note_id', 'boq_note', 'id', ['delete' => 'CASCADE', 'update' => 'CASCADE'])
            ->create();
    }
}
