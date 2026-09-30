<?php
declare(strict_types=1);

use Phinx\Migration\AbstractMigration;

final class RenameAccountRoleMappingToAccountRoleUserMapping extends AbstractMigration
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
        if ($this->hasTable('account_role_mapping') && !$this->hasTable('account_role_user_mapping')) {
            $this->table('account_role_mapping')
                ->rename('account_role_user_mapping')
                ->update();
        }

    }
}
