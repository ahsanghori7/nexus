<?php
declare(strict_types=1);

use Phinx\Migration\AbstractMigration;

final class SSOProvider extends AbstractMigration
{
    public function up(): void
    {
        // Create sso_provider table
        $this->table('sso_provider')
            ->addColumn('label', 'string', ['limit' => 50])
            ->addTimestamps()
            ->create();

        // Insert initial values
        $this->execute("INSERT INTO sso_provider (label, created_at, updated_at) VALUES
            ('local', NOW(), NOW()),
            ('entra', NOW(), NOW())");

        // Create mapping table with correct unsigned FK types
        $this->table('sso_provider_account_mapping')
            ->addColumn('account_id', 'integer') // Assuming account.id is unsigned
            ->addColumn('sso_provider_id', 'integer', ['signed' => false]) // Must match sso_provider.id
            ->addTimestamps()
            ->addForeignKey('account_id', 'account', 'id', ['delete'=> 'CASCADE', 'update'=> 'NO_ACTION'])
            ->addForeignKey('sso_provider_id', 'sso_provider', 'id', ['delete'=> 'RESTRICT', 'update'=> 'NO_ACTION'])
            ->addIndex(['account_id'], ['unique' => true])
            ->create();
    }

    public function down(): void
    {
        $this->table('sso_provider_account_mapping')->drop()->save();
        $this->table('sso_provider')->drop()->save();
    }
}
