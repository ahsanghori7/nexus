<?php
declare(strict_types=1);

use Phinx\Migration\AbstractMigration;

final class RenameTeamManagerTableAndColumns extends AbstractMigration
{
    public function up(): void
    {
        $adapter = $this->getAdapter();

        if ($adapter->hasTable('team_manager') && !$adapter->hasTable('role_mappings')) {
            $this->table('team_manager')->rename('role_mappings')->update();
        }

        if ($adapter->hasTable('role_mappings')) {
            $table = $this->table('role_mappings');

            if ($adapter->hasColumn('role_mappings', 'user_type_id')) {
                $table->renameColumn('user_type_id', 'role_id');
            }

            if (!$adapter->hasForeignKey('role_mappings', ['user_id'])) {
                $table->addForeignKey('user_id', 'user', 'id', ['delete' => 'CASCADE']);
            }

            if (!$adapter->hasForeignKey('role_mappings', ['role_id'])) {
                $table->addForeignKey('role_id', 'role', 'id', ['delete' => 'CASCADE']);
            }

            $table->update();
        }
    }

    public function down(): void
    {
        $adapter = $this->getAdapter();

        if ($adapter->hasTable('role_mappings')) {
            $table = $this->table('role_mappings');

            if ($adapter->hasForeignKey('role_mappings', ['user_id'])) {
                $table->dropForeignKey('user_id');
            }

            if ($adapter->hasForeignKey('role_mappings', ['role_id'])) {
                $table->dropForeignKey('role_id');
            }

            if ($adapter->hasColumn('role_mappings', 'role_id')) {
                $table->renameColumn('role_id', 'user_type_id');
            }

            $table->update();
        }

        if (!$adapter->hasTable('team_manager') && $adapter->hasTable('role_mappings')) {
            $this->table('role_mappings')->rename('team_manager')->update();
        }
    }
}
