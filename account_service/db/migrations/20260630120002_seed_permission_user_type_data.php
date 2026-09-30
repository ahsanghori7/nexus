<?php

declare(strict_types=1);

use Phinx\Migration\AbstractMigration;

final class SeedPermissionUserTypeData extends AbstractMigration
{
    public function up(): void
    {
        // Part A: Ensure the 3 user-type roles exist with correct display_label values
        $this->execute("
            INSERT IGNORE INTO role (label, display_label, level)
            VALUES
                ('user', 'User',   9)
        ");

        // Part B: Fetch role IDs by label
        $roles = $this->fetchAll("
            SELECT id, label FROM role
            WHERE label IN ('super_admin', 'team_admin', 'user')
        ");

        $roleIds = [];
        foreach ($roles as $role) {
            $roleIds[$role['label']] = (int) $role['id'];
        }

        $superAdminId = $roleIds['super_admin'] ?? null;
        $adminId      = $roleIds['team_admin'] ?? null;
        $userId       = $roleIds['user'] ?? null;

        if (!$superAdminId || !$adminId || !$userId) {
            throw new \RuntimeException('Required role records not found in role table.');
        }

        // Fetch permission IDs by key
        $permissionRows = $this->fetchAll("SELECT id, `key` FROM permission");
        $permissionIds = [];
        foreach ($permissionRows as $row) {
            $permissionIds[$row['key']] = (int) $row['id'];
        }

        $matrix = [
            // Projects
            'create_projects'          => [1, 0, 0],
            'edit_project_details'     => [1, 0, 0],
            'archive_projects'         => [1, 0, null],
            'view_all_projects'        => [1, 0, null],

            // Procurement
            'create_work_packages'     => [1, 0, 0],
            'send_tender_enquiries'    => [1, 0, null],
            'award_contracts'          => [1, 0, null],
            'view_tender_pricing'      => [1, 0, 0],

            // Supply Chain
            'add_subcontractors'       => [1, 0, 0],
            'edit_subcontractor_details' => [1, 0, null],
            'send_pqq'                 => [1, 0, 0],
            'view_supply_chain'        => [1, 1, 1],

            // Financial
            'view_budgets'             => [1, 0, 0],
            'approve_variances'        => [1, 0, null],
            'export_cost_reports'      => [1, 0, null],
            'edit_order_values'        => [1, 0, null],

            // Team
            'invite_users'             => [1, 0, null],
            'edit_roles_permissions'   => [1, 0, null],
            'manage_groups'            => [1, 0, null],
            'remove_users'             => [1, 0, null],
        ];

        $userTypeIds = [$superAdminId, $adminId, $userId];

        foreach ($matrix as $permissionKey => $checks) {
            $permissionId = $permissionIds[$permissionKey] ?? null;

            if (!$permissionId) {
                continue;
            }

            foreach ($userTypeIds as $index => $userTypeId) {
                $isChecked = $checks[$index];

                if ($isChecked === null) {
                    continue;
                }

                $this->execute(sprintf(
                    "INSERT IGNORE INTO permission_user_type (permission_id, user_type_id, is_checked)
                     VALUES (%d, %d, %d)",
                    $permissionId,
                    $userTypeId,
                    $isChecked
                ));
            }
        }
    }

    public function down(): void
    {
        $roles = $this->fetchAll("
            SELECT id FROM role
            WHERE label IN ('super_admin', 'team_admin', 'user')
        ");

        $roleIds = array_column($roles, 'id');

        if (!empty($roleIds)) {
            $placeholders = implode(',', $roleIds);
            $this->execute("DELETE FROM permission_user_type WHERE user_type_id IN ({$placeholders})");
        }
    }
}
