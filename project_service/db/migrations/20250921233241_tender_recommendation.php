<?php
declare(strict_types=1);

use Phinx\Migration\AbstractMigration;

final class TenderRecommendation extends AbstractMigration
{
    public function up(): void
    {
        $table = $this->table('tender_recommendation', ['id' => false, 'primary_key' => 'id']);
        $table->addColumn('id', 'integer', ['signed' => true, 'identity' => true])
            ->addColumn('tender_id', 'integer', ['signed' => true])
            ->addColumn('transaction_id', 'integer', ['signed' => true])
            ->addColumn('author_id', 'integer', ['signed' => true]) // soft FK (user.id in another DB)
            ->addColumn('status', 'enum', [
                'values' => ['Draft', 'Shared', 'Approved', 'Rejected'],
                'default' => 'Draft',
                'null' => false
            ])
            ->addColumn('created_at', 'timestamp', ['default' => 'CURRENT_TIMESTAMP'])
            ->addColumn('updated_at', 'timestamp', [
                'default' => 'CURRENT_TIMESTAMP',
                'update' => 'CURRENT_TIMESTAMP'
            ])
            ->addColumn('deleted_at', 'timestamp', ['null' => true, 'default' => null])
            ->addForeignKey('tender_id', 'tender', 'id', ['delete' => 'CASCADE', 'update' => 'CASCADE'])
            ->addForeignKey('transaction_id', 'transaction', 'id', ['delete' => 'CASCADE', 'update' => 'CASCADE'])
            ->addIndex(['author_id'])
            ->addIndex(['tender_id'])
            ->addIndex(['transaction_id'])
            ->create();
    }

    public function down(): void
    {
        $this->table('tender_recommendation')->drop()->save();
    }
}
