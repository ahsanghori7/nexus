<?php

declare(strict_types=1);

use Phinx\Migration\AbstractMigration;

final class AddIsExternalToRoleTable extends AbstractMigration
{
    public function up(): void
    {
        $roleTable = $this->table('role');
        if (!$roleTable->hasColumn('is_external')) {
            $roleTable
                ->addColumn('is_external', 'boolean', [
                    'null' => false,
                    'default' => false,
                    'after' => 'is_contractor_user_type',
                ])
                ->update();
        }

        $this->execute(
            "UPDATE role SET is_external = 1 WHERE label IN ('witness', 'project_team_member')"
        );
    }

    public function down(): void
    {
        $roleTable = $this->table('role');
        if ($roleTable->hasColumn('is_external')) {
            $roleTable
                ->removeColumn('is_external')
                ->update();
        }
    }
}
