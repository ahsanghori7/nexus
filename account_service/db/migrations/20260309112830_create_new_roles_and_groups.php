<?php
declare(strict_types=1);

use Phinx\Migration\AbstractMigration;

final class CreateNewRolesAndGroups extends AbstractMigration
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
        $account_table = $this->table('account_role');

        $account_table->addColumn('account_id', 'integer')
              ->addColumn('role_id', 'integer')
              ->addColumn('label', 'string', ['null' => false, 'limit' => 255])
              ->addColumn('description', 'text', ['null' => false])
              ->addForeignKey('account_id', 'account', 'id')
              ->addForeignKey('role_id', 'role', 'id')
              ->create();

        $account_role_mapping = $this->table('account_role_mapping');

        $account_role_mapping->addColumn('user_id', 'integer')
              ->addColumn('account_role_id', 'integer', ['signed' => false])
              ->addForeignKey('user_id', 'user', 'id')
              ->addForeignKey('account_role_id', 'account_role', 'id')
              ->create();

        $group = $this->table('account_group');

        $group->addColumn('account_id', 'integer')
              ->addColumn('label', 'string', ['null' => false, 'limit' => 255])
              ->addForeignKey('account_id', 'account', 'id')
              ->create();

        $group_mapping = $this->table('account_group_user_mapping');

        $group_mapping->addColumn('user_id', 'integer')
              ->addColumn('account_group_id', 'integer', ['signed' => false])
              ->addForeignKey('user_id', 'user', 'id')
              ->addForeignKey('account_group_id', 'account_group', 'id')
              ->create();

    }
}
