<?php
declare(strict_types=1);

use Phinx\Migration\AbstractMigration;

final class AddRolesToTeamMemberRole extends AbstractMigration
{
    /**
     * Migrate Up.
     */
    public function up()
    {
        $roles = [
            ["label" => "Principal Contractor"],
            ["label" => "Principal Designer"]
        ];

        $this->table('project_team_member_role')->insert($roles)->save();
    }

    /**
     * Migrate Down.
     */
    public function down(): void
    {
        $roles = [
            'Principal Contractor',
            'Principal Designer',
        ];

        $in = "'" . implode("','", $roles) . "'";

        $this->execute("DELETE FROM `project_team_member_role` WHERE `label` IN ($in);");
    }
}
