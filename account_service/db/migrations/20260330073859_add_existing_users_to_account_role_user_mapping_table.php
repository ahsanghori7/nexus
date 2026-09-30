<?php
declare(strict_types=1);

use Phinx\Migration\AbstractMigration;

final class AddExistingUsersToAccountRoleUserMappingTable extends AbstractMigration
{
    public function up(): void
    {
        $exists = $this->hasTable('account_role_user_mapping');
        if ($exists) {
            $this->execute("INSERT INTO account_role_user_mapping (account_role_id, user_id)
                SELECT ar.id, rm.user_id
                FROM role_mappings rm
                JOIN user u ON u.id = rm.user_id
                JOIN account_role ar
                    ON ar.account_id = u.account_id
                    AND ar.role_id = rm.role_id"
        );
        }
    }
}
