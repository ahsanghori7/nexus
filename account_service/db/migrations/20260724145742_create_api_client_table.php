<?php

declare(strict_types=1);

use Phinx\Migration\AbstractMigration;

final class CreateApiClientTable extends AbstractMigration
{
    public function up(): void
    {
        $this->table('api_client', ['id' => false, 'primary_key' => 'id'])
            ->addColumn('id', 'integer', ['signed' => true, 'identity' => true])
            ->addColumn('provider_id', 'integer', ['signed' => false])
            ->addForeignKey('provider_id', 'provider', 'id', ['delete' => 'RESTRICT', 'update' => 'CASCADE'])
            ->addColumn('name', 'string', ['limit' => 100])
            ->addColumn('client_id', 'string', ['limit' => 32])
            ->addColumn('client_secret_hash', 'string', ['limit' => 255])
            ->addColumn('account_id', 'integer')
            ->addColumn('scopes', 'text')
            ->addColumn('active', 'boolean', ['default' => true])
            ->addColumn('token_ttl_seconds', 'integer', ['default' => 1800])
            ->addColumn('last_used_at', 'datetime', ['null' => true])
            ->addColumn('created_at', 'timestamp', ['default' => 'CURRENT_TIMESTAMP'])
            ->addColumn('updated_at', 'timestamp', ['default' => 'CURRENT_TIMESTAMP', 'update' => 'CURRENT_TIMESTAMP'])
            ->addIndex(['client_id'], ['unique' => true, 'name' => 'uniq_api_client_client_id'])
            ->create();
    }

    public function down(): void
    {
        $this->table('api_client')->drop()->save();
    }
}
