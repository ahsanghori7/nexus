<?php
declare(strict_types=1);

use Phinx\Migration\AbstractMigration;

final class TenderRecommendationLogs extends AbstractMigration
{
    public function up(): void
    {
        $table = $this->table('tender_recommendation_logs', ['id' => false, 'primary_key' => 'id']);

        $table
            ->addColumn('id', 'integer', [
                'signed' => true,
                'identity' => true,
            ])
            ->addColumn('user_id', 'integer', [
                'signed' => true,
                'null' => false,
            ])
            ->addColumn('entity_type', 'string', [
                'limit' => 50,
                'null' => false,
            ])
            ->addColumn('entity_id', 'integer', [
                'signed' => true,
                'null' => false,
            ])
            ->addColumn('type', 'string', [
                'limit' => 255,
                'null' => false,
            ])
            ->addColumn('meta', 'text', [
                'null' => true,
                'limit' => 65535,
            ])
            ->addColumn('created_at', 'timestamp', [
                'default' => 'CURRENT_TIMESTAMP',
                'null' => false,
            ])
            ->addColumn('updated_at', 'timestamp', [
                'default' => 'CURRENT_TIMESTAMP',
                'null' => false,
            ])
            ->addIndex(['entity_type', 'entity_id'], [
                'name' => 'idx_logs_entity',
            ])
            ->addIndex(['user_id'], [
                'name' => 'idx_logs_user',
            ])
            ->create();
    }

    public function down(): void
    {
        $this->table('tender_recommendation_logs')->drop()->save();
    }
}
