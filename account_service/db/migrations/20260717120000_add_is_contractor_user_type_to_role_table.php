<?php

declare(strict_types=1);

use Phinx\Migration\AbstractMigration;

final class AddIsContractorUserTypeToRoleTable extends AbstractMigration
{
    public function up(): void
    {
        $roleTable = $this->table('role');
        if (!$roleTable->hasColumn('is_contractor_user_type')) {
            $roleTable
                ->addColumn('is_contractor_user_type', 'boolean', [
                    'null' => false,
                    'default' => false,
                    'after' => 'display_label',
                ])
                ->update();
        }

        $this->execute(
            "UPDATE role SET is_contractor_user_type = 1 WHERE label IN ('witness', 'project_team_member' , 'team_admin' , 'super_admin' , 'team_manager' , 'team_assistant')"
        );
    }

    public function down(): void
    {
        $roleTable = $this->table('role');
        if ($roleTable->hasColumn('is_contractor_user_type')) {
            $roleTable
                ->removeColumn('is_contractor_user_type')
                ->update();
        }
    }
}
