<?php
declare(strict_types=1);

use Phinx\Migration\AbstractMigration;

final class UpdataMultiApprovalWorkflowProcess extends AbstractMigration
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
        $this->table('order_approvers')
            ->dropForeignKey('approval_level_id')
            ->removeColumn('approval_level_id')
            ->addColumn('approval_level_workflow_id', 'integer', ['null' => true, 'after' => 'status_id'])
            ->addForeignKey('approval_level_workflow_id', 'approval_level_workflow', 'id', ['delete' => 'CASCADE', 'update' => 'CASCADE'])
            ->update();

        $this->table('approvals')
            ->dropForeignKey('approval_level_id')
            ->removeColumn('approval_level_id')
            ->addColumn('approval_level_workflow_id', 'integer', ['null' => true, 'after' => 'status_id'])
            ->addForeignKey('approval_level_workflow_id', 'approval_level_workflow', 'id', ['delete' => 'CASCADE', 'update' => 'CASCADE'])
            ->update();

        $this->table('approval_level_workflow')
            ->dropForeignKey('approval_level_id')
            ->removeColumn('approval_level_id')
            ->update();
    }
}
