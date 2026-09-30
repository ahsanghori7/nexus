<?php
declare(strict_types=1);

use Phinx\Migration\AbstractMigration;

final class ApprovalLevelCondition extends AbstractMigration
{
    protected $commonConfig = [
        'engine' => 'InnoDB',
        'collation' => 'latin1_general_ci',
        'id' => false,
        'primary_key' => ['id']
    ];

    public function change(): void
    {
        $this->table('approval_level_condition', $this->commonConfig)
        ->addColumn('id', 'integer', ['identity' => true])
        ->addColumn('approval_level_id', 'integer', ['null' => false])
        ->addColumn('threshold_type', 'enum', ['values' => ['less_than_equal', 'greater_than', 'between'], 'null' => false])
        ->addColumn('from_value', 'integer', ['null' => true])
        ->addColumn('to_value', 'integer', ['null' => true])
        ->addColumn('sort_order', 'integer', ['null' => false])
        ->addColumn('allow_higher_level_approval', 'boolean', ['null' => false, 'default' => false])
        ->addColumn('created_at', 'datetime', ['null' => false, 'default' => 'CURRENT_TIMESTAMP'])
        ->addColumn('updated_at', 'datetime', ['null' => false, 'default' => 'CURRENT_TIMESTAMP'])
        ->addForeignKey('approval_level_id', 'approval_level', 'id', ['delete' => 'CASCADE', 'update' => 'CASCADE'])
        ->create();
    }
}
