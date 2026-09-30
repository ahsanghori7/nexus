<?php
declare(strict_types=1);

use Phinx\Migration\AbstractMigration;

final class ApprovalConditionAccountRoleMapping extends AbstractMigration
{
    protected $commonConfig = [
        'engine' => 'InnoDB',
        'collation' => 'latin1_general_ci',
        'id' => false,
        'primary_key' => ['id']
    ];

    public function change(): void
    {
        $this->table('approval_condition_account_role_mapping', $this->commonConfig)
        ->addColumn('id', 'integer', ['identity' => true])
        ->addColumn('approval_level_condition_id', 'integer', ['null' => false])
        ->addColumn('account_role_id', 'integer', ['null' => false])
        ->addColumn('created_at', 'datetime', ['null' => false, 'default' => 'CURRENT_TIMESTAMP'])
        ->addColumn('updated_at', 'datetime', ['null' => false, 'default' => 'CURRENT_TIMESTAMP'])
        ->addForeignKey('approval_level_condition_id', 'approval_level_condition', 'id', ['delete' => 'CASCADE', 'update' => 'CASCADE'])
        ->create();
    }
}
