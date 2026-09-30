<?php
declare(strict_types=1);

use Phinx\Migration\AbstractMigration;

final class RenameTeamRolesDisplayLabel extends AbstractMigration
{
    public function up(): void
    {
        // Update Team Manager → Manager
        $this->execute(
            "UPDATE role SET display_label = 'Manager' WHERE label = 'team_manager'"
        );

        // Update Team Admin → Admin
        $this->execute(
            "UPDATE role SET display_label = 'Admin' WHERE label = 'team_admin'"
        );
    }

    public function down(): void
    {
        // Revert Manager → Team Manager
        $this->execute(
            "UPDATE role SET display_label = 'Team Manager' WHERE label = 'team_manager'"
        );

        // Revert Admin → Team Admin
        $this->execute(
            "UPDATE role SET display_label = 'Team Admin' WHERE label = 'team_admin'"
        );
    }
}
