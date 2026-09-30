<?php
declare(strict_types=1);

use Phinx\Migration\AbstractMigration;

final class MigrateExistingUsersToTeamManager extends AbstractMigration
{
    public function up(): void
    {
        // Populate team_manager table with existing users of specific types
        $this->execute("
            INSERT INTO team_manager (user_id, user_type_id, created_at, updated_at)
            SELECT
                id AS user_id,
                type_id AS user_type_id,
                NOW(),
                NOW()
            FROM user
            WHERE type_id IN (
                SELECT id FROM user_type
                WHERE label IN (
                    'team_manager',
                    'team_admin',
                    'team_assistant',
                    'project_team_member'
                )
            )
        ");
    }

    public function down(): void
    {
        // Remove all rows inserted by this migration
        $this->execute("
            DELETE FROM team_manager
            WHERE user_type_id IN (
                SELECT id FROM user_type
                WHERE label IN (
                    'team_manager',
                    'team_admin',
                    'team_assistant',
                    'project_team_member'
                )
            )
        ");
    }
}
