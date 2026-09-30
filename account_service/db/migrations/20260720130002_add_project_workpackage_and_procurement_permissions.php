<?php

declare(strict_types=1);

use Phinx\Migration\AbstractMigration;

final class AddProjectWorkpackageAndProcurementPermissions extends AbstractMigration
{

    private const NEW_PERMISSION_TYPES = [
        'Project Creation / Archive',
        'Project Configuration / Setup',
        'Work Package Management',
        'Procurement Operations',
        'User Management',
    ];

    // key => [label, permission_type label]
    private const NEW_PERMISSIONS = [
        'create_new_project'           => ['Create new project', 'Project Creation / Archive'],
        'archive_project'              => ['Archive project', 'Project Creation / Archive'],
        'restore_project_from_archive' => ['Restore project from archive', 'Project Creation / Archive'],
        'edit_project_details'         => ['Edit project details', 'Project Configuration / Setup'],
        'access_project_setup'         => ['Access project setup', 'Project Configuration / Setup'],
        'manage_project_team_members'  => ['Manage project team members', 'Project Configuration / Setup'],
        'create_work_package'          => ['Create work package', 'Work Package Management'],
        'edit_work_package'            => ['Edit work package', 'Work Package Management'],
        'delete_work_package'          => ['Delete work package', 'Work Package Management'],
        'send_tenders'                 => ['Send tenders', 'Procurement Operations'],
        'analyze_quotes'               => ['Analyze quotes', 'Procurement Operations'],
        'issue_orders'                 => ['Issue orders', 'Procurement Operations'],
        'manage_documents'             => ['Manage documents', 'Procurement Operations'],
        'create_user_roles'            => ['Create new user roles', 'User Management'],
        'select_user_type_for_role'    => ['Select user type for user role', 'User Management'],
    ];

    private const FULL_ACCESS_ROLE_PERMISSION_KEYS = [
        'create_new_project',
        'archive_project',
        'restore_project_from_archive',
        'edit_project_details',
        'access_project_setup',
        'manage_project_team_members',
        'create_work_package',
        'edit_work_package',
        'delete_work_package',
        'send_tenders',
        'analyze_quotes',
        'issue_orders',
        'manage_documents',
        'create_user_roles',
        'select_user_type_for_role',
    ];

    private const TEAM_ASSISTANT_PERMISSION_KEYS = [
        'edit_work_package',
        'send_tenders',
        'analyze_quotes',
        'issue_orders',
        'manage_documents',
    ];

    private const FULL_ACCESS_ROLES = ['team_admin', 'super_admin', 'team_manager'];
    private const ALL_TARGET_ROLES = ['team_admin', 'super_admin', 'team_manager', 'team_assistant'];

    public function up(): void
    {
        // Deleting the permission rows first cascades (ON DELETE CASCADE) into permission_mappings
        // and permission_user_type, so no dependent rows are left behind.
        $this->execute("
            DELETE FROM permission WHERE permission_type_id IS NOT NULL
        ");
        $this->execute("
            DELETE FROM permission_type
        ");

        $this->execute("
            INSERT IGNORE INTO permission_type (label) VALUES
            ('Project Creation / Archive'),
            ('Project Configuration / Setup'),
            ('Work Package Management'),
            ('Procurement Operations'),
            ('User Management')
        ");

        $typeRows = $this->fetchAll("
            SELECT id, label FROM permission_type WHERE label IN ('" . implode("','", self::NEW_PERMISSION_TYPES) . "')
        ");
        $typeIds = [];
        foreach ($typeRows as $row) {
            $typeIds[$row['label']] = (int) $row['id'];
        }

        foreach (self::NEW_PERMISSIONS as $key => [$label, $typeLabel]) {
            $typeId = $typeIds[$typeLabel] ?? null;
            if (!$typeId) {
                throw new \RuntimeException("Missing permission_type '{$typeLabel}' required for permission '{$key}'.");
            }

            $this->execute(sprintf(
                "INSERT IGNORE INTO permission (`key`, label, permission_type_id) VALUES ('%s', '%s', %d)",
                $key,
                $label,
                $typeId
            ));
        }

        // Old role-based permission assignments for these roles are being fully replaced by the sets
        // below; this only removes account_role-scoped mappings (user_id IS NULL), never per-user overrides.
        $this->execute("
            DELETE pm FROM permission_mappings pm
            INNER JOIN account_role ar ON ar.id = pm.account_role_id
            INNER JOIN role r ON r.id = ar.role_id
            WHERE pm.user_id IS NULL
              AND r.label IN ('" . implode("','", self::ALL_TARGET_ROLES) . "')
        ");

        $this->execute("
            INSERT INTO permission_mappings (account_role_id, permission_id, user_id)
            SELECT ar.id, p.id, NULL
            FROM account_role ar
            INNER JOIN role r ON r.id = ar.role_id
            CROSS JOIN permission p
            WHERE r.label IN ('" . implode("','", self::FULL_ACCESS_ROLES) . "')
              AND p.`key` IN ('" . implode("','", self::FULL_ACCESS_ROLE_PERMISSION_KEYS) . "')
        ");

        $this->execute("
            INSERT INTO permission_mappings (account_role_id, permission_id, user_id)
            SELECT ar.id, p.id, NULL
            FROM account_role ar
            INNER JOIN role r ON r.id = ar.role_id
            CROSS JOIN permission p
            WHERE r.label = 'team_assistant'
              AND p.`key` IN ('" . implode("','", self::TEAM_ASSISTANT_PERMISSION_KEYS) . "')
        ");

        $this->seedPermissionUserType();
    }

    /**
     * The "permission with type" API (PermissionRepository::getPermissionsGroupedByUserType)
     * only returns permissions that have a row in permission_user_type, keyed by role id — so
     * the new permissions need entries here too, not just in permission_mappings.
     */
    private function seedPermissionUserType(): void
    {
        // Resolve via account_role (not `role.label` directly) to avoid the duplicate
        // super_admin/user rows in `role` that no account_role actually points at.
        $roleRows = $this->fetchAll("
            SELECT DISTINCT ar.role_id, r.label
            FROM account_role ar
            INNER JOIN role r ON r.id = ar.role_id
            WHERE r.label IN ('" . implode("','", self::ALL_TARGET_ROLES) . "')
        ");
        $roleIds = [];
        foreach ($roleRows as $row) {
            $roleIds[$row['label']] = (int) $row['role_id'];
        }

        $permissionRows = $this->fetchAll("
            SELECT id, `key` FROM permission WHERE `key` IN ('" . implode("','", array_keys(self::NEW_PERMISSIONS)) . "')
        ");
        $permissionIds = [];
        foreach ($permissionRows as $row) {
            $permissionIds[$row['key']] = (int) $row['id'];
        }

        foreach (self::FULL_ACCESS_ROLES as $roleLabel) {
            $roleId = $roleIds[$roleLabel] ?? null;
            if (!$roleId) {
                continue;
            }

            foreach (array_keys(self::NEW_PERMISSIONS) as $key) {
                $this->execute(sprintf(
                    "INSERT IGNORE INTO permission_user_type (permission_id, user_type_id, is_checked) VALUES (%d, %d, 1)",
                    $permissionIds[$key],
                    $roleId
                ));
            }
        }

        $teamAssistantRoleId = $roleIds['team_assistant'] ?? null;
        if ($teamAssistantRoleId) {
            foreach (array_keys(self::NEW_PERMISSIONS) as $key) {

                if(!in_array($key, self::TEAM_ASSISTANT_PERMISSION_KEYS, true)) {
                    continue;
                }

                $this->execute(sprintf(
                    "INSERT IGNORE INTO permission_user_type (permission_id, user_type_id, is_checked) VALUES (%d, %d, %d)",
                    $permissionIds[$key],
                    $teamAssistantRoleId,
                    1
                ));
            }
        }
    }

    public function down(): void
    {
        // Note: this cannot restore whatever permission_mappings/permission_user_type rows existed
        // for the old 'Projects' permissions, or for these 4 roles, prior to `up()` — that prior
        // state was deleted, not archived.
        $newKeys = array_keys(self::NEW_PERMISSIONS);
        $this->execute("DELETE FROM permission WHERE `key` IN ('" . implode("','", $newKeys) . "')");

        $this->execute("
            DELETE FROM permission_type WHERE label IN ('" . implode("','", self::NEW_PERMISSION_TYPES) . "')
        ");

    }
}
