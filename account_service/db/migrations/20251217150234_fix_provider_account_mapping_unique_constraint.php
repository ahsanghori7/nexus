<?php
declare(strict_types=1);

use Phinx\Migration\AbstractMigration;

final class FixProviderAccountMappingUniqueConstraint extends AbstractMigration
{
    public function up(): void
    {
        $table = $this->table('provider_account_mapping');
        if ($table->hasIndex(['account_id'])) {
            $table->removeIndex(['account_id']);
        }

        // Add composite unique index
        $table->addIndex(
            ['account_id', 'provider_id'],
            ['unique' => true, 'name' => 'uniq_account_provider']
        )->update();
    }

    public function down(): void
    {
        $table = $this->table('provider_account_mapping');

        // Remove composite unique index
        if ($table->hasIndex(['account_id', 'provider_id'])) {
            $table->removeIndex(['account_id', 'provider_id']);
        }

        // Restore original unique index on account_id
        $table->addIndex(
            ['account_id'],
            ['unique' => true]
        )->update();
    }
}
