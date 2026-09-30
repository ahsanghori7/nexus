<?php
declare(strict_types=1);

use Phinx\Migration\AbstractMigration;

final class MilestoneConfiguration extends AbstractMigration
{
    public function up(): void
    {
        $table = $this->table('milestone', ['id' => false, 'primary_key' => 'id']);

        $table
            ->addColumn('id', 'integer', [
                'signed' => true,
                'identity' => true,
            ])
            ->addColumn('label', 'string', [
                'limit' => 50,
                'null' => false,
            ])
            ->addColumn('feature_label', 'string', [
                'limit' => 50,
                'null' => false,
            ])
            ->addColumn('is_required', 'enum', [
                'null' => false,
                'default' => '0',
                'values' => ['0', '1'],
            ])
            ->addColumn('lead_time', 'integer', [
                'limit' => 5,
                'null' => false,
                'default' => 4,
            ])
            ->addColumn('sort_order', 'integer', [
                'limit' => 10,
                'null' => false,
            ])
            ->addColumn('type', 'enum', [
                'null' => false,
                'default' => 'manual',
                'values' => ['automatic', 'manual'],
            ])
            ->create();

        $table = $this->table('account_milestone_mapping', ['id' => false, 'primary_key' => 'id']);

        $table
            ->addColumn('id', 'integer', [
                'signed' => true,
                'identity' => true,
            ])
            ->addColumn('milestone_id', 'integer', [
                'signed' => true,
                'null' => false,
            ])
            ->addColumn('account_id', 'integer', [
                'signed' => true,
                'null' => false,
            ])
            ->addColumn('label', 'string', [
                'limit' => 50,
                'null' => false,
            ])
            ->addColumn('lead_time', 'integer', [
                'limit' => 5,
                'null' => false,
            ])
            ->addColumn('sort_order', 'integer', [
                'limit' => 10,
                'null' => false,
            ])
            ->addColumn('created_at', 'timestamp', [
                'default' => 'CURRENT_TIMESTAMP',
                'null' => false,
            ])
            ->addColumn('updated_at', 'timestamp', [
                'default' => 'CURRENT_TIMESTAMP',
                'null' => false,
            ])
            ->create();
    }

    public function down(): void
    {
        $this->table('milestone')->drop()->save();
        $this->table('account_milestone_mapping')->drop()->save();
    }
}
