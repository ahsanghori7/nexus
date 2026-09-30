<?php
declare(strict_types=1);

use Phinx\Migration\AbstractMigration;

final class RefactorSSOToProvider extends AbstractMigration
{
    /**
     * Change Method.
     *
     * Write your reversible migrations using this method.
     *
     * More information on writing migrations is available here:
     * https://book.cakephp.org/phinx/0/en/migrations.html#the-change-method
     *
     * Remember to call "create()" or "update()" and NOT "save()" when working
     * with the Table class.
     */
    public function change(): void
    {
        //Rename tables
        if ( $this->hasTable('sso_provider') ) {
            $this->table('sso_provider')->rename('provider')->update();
        }

        if ( $this->hasTable('sso_provider_account_mapping') ) {
            $this->table('sso_provider_account_mapping')->rename('provider_account_mapping')->update();
        }

        $table = $this->table('provider_account_mapping');
        // Rename column sso_provider_id → provider_id
        if ($table->hasColumn('sso_provider_id')) {
            $table->renameColumn('sso_provider_id', 'provider_id');
        }

        // Add meta column (JSON) after provider_id
        if (!$table->hasColumn('meta')) {
            $table->addColumn('meta', 'json', [
                'null' => true,
                'after' => 'provider_id'
            ]);
        }
        $table->update();

        //Remove updated_at column from provider table if exists
        if ($this->hasTable('provider')) {
            $table = $this->table('provider');
            if ( $table->hasColumn('updated_at') ) {
                $table->removeColumn('updated_at')
                    ->update();
            }
        }

        //Create provider_type table
        if ( !$this->hasTable('provider_type') ) {
            $this->table('provider_type', ['id' => false, 'primary_key' => ['id']])
                ->addColumn('id', 'integer', ['identity' => true])
                ->addColumn('label', 'string', ['limit' => 64])
                ->create();
        }

        //Seed provider_type with default values
        $this->execute("
            INSERT INTO provider_type (label) VALUES
            ('login'),
            ('integration')
        ");

        //Add new column type_id to provider
        $table = $this->table('provider');
        if ( !$table->hasColumn('type_id') ) {
            $table->addColumn('type_id', 'integer', ['null' => true, 'after' => 'label'])
                ->addForeignKey('type_id', 'provider_type', 'id', ['delete' => 'CASCADE', 'update' => 'CASCADE'])
                ->update();
        }

        //Update existing providers (local, entra) to type_id = login
        $this->execute("
            UPDATE provider
            SET type_id = (
                SELECT id FROM provider_type WHERE label = 'login' LIMIT 1
            )
        ");

        //Insert new provider: Asite (type = integration)
        $this->execute("
            INSERT INTO provider (label, type_id, created_at)
            VALUES (
                'asite',
                (SELECT id FROM provider_type WHERE label = 'integration' LIMIT 1),
                NOW()
            )
        ");
    }

    public function down(): void
    {
        // Reverse migration safely

        // Remove Asite provider
        $this->execute("DELETE FROM provider WHERE label = 'asite'");

        // Drop foreign key and column
        $table = $this->table('provider');
        if ( $table->hasForeignKey('type_id') ) {
            $table->dropForeignKey('type_id')->save();
        }
        if ( $table->hasColumn('type_id') ) {
            $table->removeColumn('type_id')->save();
        }
        if (!$table->hasColumn('updated_at')) {
            $table->addColumn('updated_at', 'timestamp', [
                'null' => true,
                'default' => null,
                'update' => 'CURRENT_TIMESTAMP',
                'after' => 'created_at'
            ])->update();
        }

        // Drop provider_type table
        if ( $this->hasTable('provider_type') ) {
            $this->table('provider_type')->drop()->save();
        }

        // Rename tables back to original
        if ( $this->hasTable('provider_account_mapping') ) {
            $this->table('provider_account_mapping')->rename('sso_provider_account_mapping')->update();
        }

        if ( $this->hasTable('provider') ) {
            $this->table('provider')->rename('sso_provider')->update();
        }
    }
}
