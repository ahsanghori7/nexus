<?php

declare(strict_types=1);

use Phinx\Migration\AbstractMigration;

final class CreateApiClientAuditTable extends AbstractMigration
{
    public function up(): void
    {
        $this->table('api_client_audit', ['id' => false, 'primary_key' => 'id'])
            ->addColumn('id', 'biginteger', ['signed' => true, 'identity' => true])
            ->addColumn('api_client_id', 'integer')
            ->addForeignKey('api_client_id', 'api_client', 'id', ['delete' => 'CASCADE', 'update' => 'CASCADE'])
            ->addColumn('jti', 'string', ['limit' => 36, 'null' => true])
            ->addColumn('method', 'string', ['limit' => 10, 'null' => true])
            ->addColumn('endpoint', 'string', ['limit' => 255, 'null' => true])
            ->addColumn('entity_type', 'string', ['limit' => 50, 'null' => true])
            ->addColumn('entity_id', 'integer', ['null' => true])
            ->addColumn('external_id', 'string', ['limit' => 150, 'null' => true])
            ->addColumn('request_snapshot', 'text', ['null' => true])
            ->addColumn('response_code', 'smallinteger', ['null' => true])
            ->addColumn('ip', 'string', ['limit' => 45, 'null' => true])
            ->addColumn('created_at', 'timestamp', ['default' => 'CURRENT_TIMESTAMP'])
            ->addIndex(['created_at'], ['name' => 'idx_api_client_audit_created_at'])
            ->create();
    }

    public function down(): void
    {
        $this->table('api_client_audit')->drop()->save();
    }
}
