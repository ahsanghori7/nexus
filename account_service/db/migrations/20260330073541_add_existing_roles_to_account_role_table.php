<?php
declare(strict_types=1);

use Phinx\Migration\AbstractMigration;

final class AddExistingRolesToAccountRoleTable extends AbstractMigration
{
    public function up(): void
    {
        $exists = $this->hasTable('account_role');
        if ($exists) {
            $this->execute("INSERT INTO account_role (account_id, role_id, label, description)
                SELECT a.id, r.id, r.display_label, ''
                FROM account a
                CROSS JOIN role r
                WHERE a.type_id IN (1, 2)"
            );
        }
    }
}
