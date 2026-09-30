<?php
declare(strict_types=1);

use Phinx\Migration\AbstractMigration;

final class ShortlistedSubcontractor extends AbstractMigration
{
    public function up(): void
    {
        $table = $this->table('shortlisted_subcontractor', [
            'id' => false,
            'primary_key' => 'id'
        ]);

        $table
            ->addColumn('id', 'integer', [
                'signed' => true,
                'identity' => true
            ])
            ->addColumn('tender_id', 'integer', [
                'signed' => true
            ])
            ->addColumn('account_id', 'integer', [
                'signed' => true
            ])
            ->addColumn('status', 'enum', [
                'values'  => ['Draft', 'Pending', 'Approved', 'Rejected'],
                'default' => 'Draft',
                'null'    => false
            ])
            ->addColumn('created_at', 'timestamp', [
                'default' => 'CURRENT_TIMESTAMP'
            ])
            ->addColumn('updated_at', 'timestamp', [
                'default' => 'CURRENT_TIMESTAMP',
                'update'  => 'CURRENT_TIMESTAMP'
            ])
            ->addForeignKey(
                'tender_id',
                'tender',
                'id',
                ['delete' => 'CASCADE', 'update' => 'CASCADE']
            )
            ->addIndex(['tender_id'])
            ->addIndex(['account_id'])
            ->create();
    }

    public function down(): void
    {
        $this->table('shortlisted_subcontractor')->drop()->save();
    }
}
