<?php
declare(strict_types=1);

use Phinx\Migration\AbstractMigration;

final class MakeTeamMemberRoleIdNullable extends AbstractMigration
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
        $table = $this->table('project_team_member_role_mapping');
        $table->changeColumn('role_id', 'integer', [
            'null' => true,
            'default' => null,
        ])->update();
    }
}
