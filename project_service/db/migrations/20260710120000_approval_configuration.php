<?php
declare(strict_types=1);

use Phinx\Migration\AbstractMigration;

final class ApprovalConfiguration extends AbstractMigration
{
    public function up(): void
    {
        $table = $this->table('approval_configuration', [
            'id' => false,
            'primary_key' => 'id'
        ]);

        $table
            ->addColumn('id', 'integer', [
                'signed' => true,
                'identity' => true
            ])
            ->addColumn('account_id', 'integer', [
                'signed' => true
            ])
            ->addColumn('approval_type_id', 'integer', [
                'signed' => true
            ])
            ->addColumn('allow_requester_self_approval', 'boolean', [
                'null' => false,
                'default' => false
            ])
            ->addColumn('consolidate_duplicate_approver_notifications', 'boolean', [
                'null' => false,
                'default' => false
            ])
            ->addColumn('auto_complete_lower_approvals', 'boolean', [
                'null' => false,
                'default' => false
            ])
            ->addColumn('created_at', 'timestamp', [
                'default' => 'CURRENT_TIMESTAMP'
            ])
            ->addColumn('updated_at', 'timestamp', [
                'default' => 'CURRENT_TIMESTAMP',
                'update' => 'CURRENT_TIMESTAMP'
            ])
            ->addForeignKey('approval_type_id', 'approval_type', 'id', [
                'delete' => 'CASCADE',
                'update' => 'NO_ACTION'
            ])
            ->addIndex(['account_id'])
            ->addIndex(['account_id', 'approval_type_id'], ['unique' => true])
            ->create();
    }

    public function down(): void
    {
        $this->table('approval_configuration')->drop()->save();
    }
}
