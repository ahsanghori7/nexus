<?php
declare(strict_types=1);

use Phinx\Migration\AbstractMigration;

final class AddApprovalLevelIdToOrderApprovers extends AbstractMigration
{
    public function up(): void
    {
        $table = $this->table('order_approvers');

        $table
            ->addColumn('approval_level_id', 'integer', [
                'signed' => true,
                'null' => true,
                'after' => 'status_id'
            ])
            ->addForeignKey(
                'approval_level_id',
                'approval_level',
                'id',
                ['delete' => 'SET_NULL', 'update' => 'CASCADE']
            )
            ->addIndex(['approval_level_id'])
            ->update();
    }

    public function down(): void
    {
        $table = $this->table('order_approvers');

        $table
            ->dropForeignKey('approval_level_id')
            ->removeIndex(['approval_level_id'])
            ->removeColumn('approval_level_id')
            ->update();
    }
}
