<?php
declare(strict_types=1);

use Phinx\Migration\AbstractMigration;

final class UpdateRoleLevels extends AbstractMigration
{
    public function up(): void
    {
        $roles = [
            'account_holder'      => 0,
            'administrator'       => 1,
            'super_admin'         => 2,
            'team_admin'          => 3,
            'team_manager'        => 4,
            'team_assistant'      => 5,
            'approver'            => 6, // adjust if you want different
            'witness'             => 7,
            'project_team_member' => 8,
        ];

        foreach ($roles as $label => $level) {
            $this->execute(sprintf(
                "UPDATE role SET level = %d WHERE label = '%s'",
                $level,
                $label
            ));
        }
    }

    public function down(): void
    {
        // Rollback: reset all levels to 0
        $this->execute("UPDATE role SET level = 0");
    }
}
