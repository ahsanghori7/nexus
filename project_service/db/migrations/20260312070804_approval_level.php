<?php
declare(strict_types=1);

use Phinx\Migration\AbstractMigration;

final class ApprovalLevel extends AbstractMigration
{
    public function up(): void
    {
        $table = $this->table('approval_level', [
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
            ->addColumn('approval_type', 'enum', [
                'values' => ['order', 'tender_recommendation', 'supplier_list'],
                'null' => false
            ])
            ->addColumn('is_threshold', 'boolean', [
                'default' => false
            ])
            ->addColumn('threshold_type', 'enum', [
                'values' => ['less_than_equal', 'greater_than', 'between'],
                'null' => true
            ])
            ->addColumn('threshold_value', 'integer', [
                'null' => true
            ])
            ->addColumn('min_value', 'integer', [
                'null' => true
            ])
            ->addColumn('max_value', 'integer', [
                'null' => true
            ])
            ->addColumn('rule_type', 'enum', [
                'values' => ['all', 'any', 'custom'],
                'null' => false
            ])
            ->addColumn('min_required', 'integer', [
                'null' => true
            ])
            ->addColumn('created_at', 'timestamp', [
                'default' => 'CURRENT_TIMESTAMP'
            ])
            ->addColumn('updated_at', 'timestamp', [
                'default' => 'CURRENT_TIMESTAMP',
                'update' => 'CURRENT_TIMESTAMP'
            ])
            ->addIndex(['account_id'])
            ->create();
    }

    public function down(): void
    {
        $this->table('approval_level')->drop()->save();
    }
}
