<?php
declare(strict_types=1);

use Phinx\Migration\AbstractMigration;

final class RenameRoleIdToUserIdInPermissionMappings extends AbstractMigration
{
    public function change(): void
    {
        $table = $this->table('permission_mappings');

        // Drop the old foreign key on role_id
        $table->dropForeignKey('role_id')
              ->save();

        // Rename column role_id to user_id
        $table->renameColumn('role_id', 'user_id')
              ->save();

        // Add new foreign key to user table
        $table->addForeignKey('user_id', 'user', 'id', [
                'delete' => 'CASCADE',
                'update' => 'NO_ACTION'
            ])
            ->update();
    }
}
