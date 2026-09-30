<?php
declare(strict_types=1);

use Phinx\Migration\AbstractMigration;

final class CreateTeamManagerTable extends AbstractMigration
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

        $teamManagerTable = $this->table('team_manager', ['id' => false, 'primary_key' => 'id']);
        $teamManagerTable
            ->addColumn('id', 'integer', ['signed' => true, 'identity' => true])
            ->addColumn('user_id', 'integer', ['signed' => true])
            ->addColumn('user_type_id', 'integer', ['signed' => true])
            ->addColumn('created_at', 'timestamp', ['default' => 'CURRENT_TIMESTAMP'])
            ->addColumn('updated_at', 'timestamp', [
                'default' => 'CURRENT_TIMESTAMP',
                'update' => 'CURRENT_TIMESTAMP',
            ])
            ->addForeignKey('user_id', 'user', 'id', [
                'delete' => 'CASCADE',
                'update' => 'CASCADE',
            ])
            ->addForeignKey('user_type_id', 'user_type', 'id', [
                'delete' => 'RESTRICT',
                'update' => 'CASCADE',
            ])
            ->addIndex(['user_id'], ['name' => 'team_manager_user_id'])
            ->addIndex(['user_type_id'], ['name' => 'team_manager_user_type_id'])
            ->create();
    }
}
