<?php
declare(strict_types=1);

use Phinx\Migration\AbstractMigration;

final class AddMetaToOrderApproversAndApprovals extends AbstractMigration
{
    public function up(): void
    {
        $this->table('order_approvers')
            ->addColumn('meta', 'json', [
                'null' => true,
                'after' => 'is_approver_read'
            ])
            ->update();

        $this->table('approvals')
            ->addColumn('meta', 'json', [
                'null' => true,
                'after' => 'approval_level_workflow_id'
            ])
            ->update();
    }

    public function down(): void
    {
        $this->table('order_approvers')
            ->removeColumn('meta')
            ->update();

        $this->table('approvals')
            ->removeColumn('meta')
            ->update();
    }
}
