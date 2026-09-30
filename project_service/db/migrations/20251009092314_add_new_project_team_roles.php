<?php
declare(strict_types=1);

use Phinx\Migration\AbstractMigration;

final class AddNewProjectTeamRoles extends AbstractMigration
{
    /**
     * Migrate Up.
     */
    public function up()
    {
        // Add two new roles to the project_team_member_role table
        $newRoles = [
            ["label" => "Structural Engineer"],
            ["label" => "Services Engineer"]
        ];

        $this->table('project_team_member_role')->insert($newRoles)->save();
    }

    /**
     * Migrate Down.
     */
    public function down(): void
    {
        $roles = [
            'Structural Engineer',
            'Services Engineer',
        ];

        $in = "'" . implode("','", $roles) . "'";

        $this->execute("DELETE FROM `project_team_member_role` WHERE `label` IN ($in);");
    }
}
