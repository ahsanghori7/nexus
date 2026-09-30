<?php
declare(strict_types=1);

use Phinx\Migration\AbstractMigration;

final class AddAccountActionTypes extends AbstractMigration
{
    public function up(): void
    {
        $this->execute("
            INSERT IGNORE INTO account_action_type (`label`)
            VALUES
                ('team_invite'),
                ('team_change_role'),
                ('team_member_remove')
        ");
    }

    public function down(): void
    {
        $this->execute("
            DELETE FROM account_action_type
            WHERE `label` IN ('team_invite', 'team_change_role', 'team_member_remove')
        ");
    }
}
