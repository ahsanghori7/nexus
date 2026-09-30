<?php
declare(strict_types=1);

use Phinx\Migration\AbstractMigration;

final class PackageMilestone extends AbstractMigration
{
    public function up(): void
    {
        $table = $this->table('package_milestone_status', ['id' => false, 'primary_key' => 'id']);
        $table
            ->addColumn('id', 'integer', [
                'signed' => true,
                'identity' => true,
            ])
            ->addColumn('label', 'string', [
                'limit' => 50,
                'null' => false,
            ])
            ->create();

        $table = $this->table('package_milestone', ['id' => false, 'primary_key' => 'id']);

        $table
            ->addColumn('id', 'integer', [
                'signed' => true,
                'identity' => true,
            ])
            ->addColumn('account_milestone_mapping_id', 'integer', [
                'signed' => true,
                'null' => false,
            ])
            ->addColumn('package_id', 'integer', [
                'signed' => true,
                'null' => false,
            ])
            ->addColumn('planned_start_date', 'date', [
                'null' => true,
            ])
            ->addColumn('planned_end_date', 'date', [
                'null' => true,
            ])
            ->addColumn('actual_start_date', 'date', [
                'null' => true,
            ])
            ->addColumn('actual_end_date', 'date', [
                'null' => true,
            ])
            ->addColumn('package_milestone_status_id', 'integer', [
                'signed' => true,
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
            ->addForeignKey('account_milestone_mapping_id', 'account_milestone_mapping', 'id', ['delete' => 'CASCADE', 'update' => 'CASCADE'])
            ->addForeignKey('package_milestone_status_id', 'package_milestone_status', 'id', ['delete' => 'CASCADE', 'update' => 'CASCADE'])
            ->addForeignKey('package_id', 'tender', 'id', ['delete' => 'CASCADE', 'update' => 'CASCADE'])
            ->create();
    }

    public function down(): void
    {
        $this->table('package_milestone')->drop()->save();
        $this->table('package_milestone_status')->drop()->save();
    }
}
