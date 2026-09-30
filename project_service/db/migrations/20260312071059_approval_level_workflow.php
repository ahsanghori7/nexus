<?php
declare(strict_types=1);

use Phinx\Migration\AbstractMigration;

final class ApprovalLevelWorkflow extends AbstractMigration
{
    public function up(): void
    {
        $table = $this->table('approval_level_workflow', [
            'id' => false,
            'primary_key' => 'id'
        ]);

        $table
            ->addColumn('id', 'integer', [
                'signed' => true,
                'identity' => true
            ])
            ->addColumn('approval_level_id', 'integer', [
                'signed' => true
            ])
            ->addColumn('entity_type', 'string', [
                'limit' => 50
            ])
            ->addColumn('entity_id', 'integer', [
                'signed' => true
            ])
            ->addColumn('status', 'enum', [
                'values' => ['in_progress', 'completed'],
                'default' => 'in_progress',
                'null' => false
            ])
            ->addColumn('created_at', 'timestamp', [
                'default' => 'CURRENT_TIMESTAMP'
            ])
            ->addColumn('updated_at', 'timestamp', [
                'default' => 'CURRENT_TIMESTAMP',
                'update' => 'CURRENT_TIMESTAMP'
            ])
            ->addForeignKey(
                'approval_level_id',
                'approval_level',
                'id',
                ['delete' => 'CASCADE', 'update' => 'CASCADE']
            )
            ->addIndex(['approval_level_id'])
            ->addIndex(['entity_type'])
            ->addIndex(['entity_id'])
            ->create();
    }

    public function down(): void
    {
        $this->table('approval_level_workflow')->drop()->save();
    }
}
