<?php

declare(strict_types=1);

namespace App\Domain\Permission;

use App\Domain\AbstractRepository;
use App\Domain\Permission\Permission;
use App\Domain\Permission\PermissionMappings;
use App\Domain\Permission\PermissionType;
use App\Domain\Permission\PermissionUserType;

class PermissionRepository extends AbstractRepository
{
    /**
     * Allow a default model to be set for get model function
     */
    const DEFAULT_MODEL = "user_permission";

    /**
     * @var string[]
     */
    protected $models = [
        "user_permission" => Permission::class,
        "user_permission_mapping" => PermissionMappings::class,
        "permission_type" => PermissionType::class,
        "permission_user_type" => PermissionUserType::class,
    ];

    /**
     * @return array
     * @throws \Exception
     */
    public function getPermissions(): array
    {
        $permissionModel = $this->getModel();
        $permissionTypeModel = $this->getModel('permission_type');

        $query = sprintf(
            'SELECT
                p.id,
                p.`key`,
                p.label,
                p.permission_type_id,
                pt.label as permission_type_label
            FROM %s p
            LEFT JOIN %s pt ON pt.id = p.permission_type_id
            ORDER BY p.id ASC',
            $permissionModel->getName(),
            $permissionTypeModel->getName()
        );
        $results = [];
        if (method_exists($permissionModel->getDB(), 'getAll')) {
            $results = $permissionModel->getDB()::getAll($query);
        }

        return $results;
    }

    /**
     * Get all permissions grouped by user type (role), then by permission type.
     * Only permissions that have an entry in permission_user_type are returned.
     *
     * @return array
     */
    public function getPermissionsGroupedByUserType(): array
    {
        $permissionModel     = $this->getModel('user_permission');
        $permissionTypeModel = $this->getModel('permission_type');
        $permissionUserType  = $this->getModel('permission_user_type');

        $query = sprintf(
            'SELECT
                r.id            AS user_type_id,
                r.label         AS user_type_label,
                r.display_label AS user_type_display_label,
                r.level         AS user_type_level,
                pt.id           AS permission_type_id,
                pt.label        AS permission_type_label,
                p.id            AS permission_id,
                p.`key`         AS permission_key,
                p.label         AS permission_label,
                put.is_checked
            FROM %s put
            INNER JOIN role r  ON r.id  = put.user_type_id
            INNER JOIN %s p    ON p.id  = put.permission_id
            LEFT  JOIN %s pt   ON pt.id = p.permission_type_id
            ORDER BY r.level ASC, COALESCE(pt.label, "") ASC, p.id ASC',
            $permissionUserType->getName(),
            $permissionModel->getName(),
            $permissionTypeModel->getName()
        );

        $results = [];
        $db = $permissionModel->getDB();
        if (method_exists($db, 'getAll')) {
            $rows = $db::getAll($query);
            $results = $this->groupPermissionsByUserType($rows);
        }

        return $results;
    }

    /**
     * @param array<int, array<string, mixed>> $rows
     * @return array<int, array<string, mixed>>
     */
    private function groupPermissionsByUserType(array $rows): array
    {
        $grouped = [];

        foreach ($rows as $row) {
            $userTypeId = (int) $row['user_type_id'];

            if (!isset($grouped[$userTypeId])) {
                $grouped[$userTypeId] = [
                    'user_type_id'            => $userTypeId,
                    'user_type_label'         => $row['user_type_label'],
                    'user_type_display_label' => $row['user_type_display_label'],
                    'permission_groups'       => [],
                ];
            }

            $typeId    = $row['permission_type_id'] !== null ? (int) $row['permission_type_id'] : 0;
            $typeLabel = $row['permission_type_label'] ?: 'uncategorized';
            $groupKey  = $userTypeId . '_' . $typeId;

            if (!isset($grouped[$userTypeId]['permission_groups'][$groupKey])) {
                $grouped[$userTypeId]['permission_groups'][$groupKey] = [
                    'permission_type_id'    => $typeId ?: null,
                    'permission_type_label' => $typeLabel,
                    'permissions'           => [],
                ];
            }

            $grouped[$userTypeId]['permission_groups'][$groupKey]['permissions'][] = [
                'id'         => (int) $row['permission_id'],
                'key'        => $row['permission_key'],
                'label'      => $row['permission_label'],
                'is_checked' => (bool) $row['is_checked'],
            ];
        }

        return array_values(array_map(function (array $userType): array {
            $userType['permission_groups'] = array_values($userType['permission_groups']);
            return $userType;
        }, $grouped));
    }

    /**
     * Get user permission mappings by permission key
     *
     * @param string $permissionKey
     * @return array
     */
    public function getPermissionMappingsByKey(string $permissionKey , ?int $userId = null): array
    {
        $permissionModel = $this->getModel("user_permission");
        if ($userId !== null) {
            $mappingModel = $this->getModel("user_permission_mapping");
            $query = sprintf(
                "SELECT
                    upm.id,
                    upm.user_id,
                    upm.permission_id,
                    up.key as permission_key
                FROM %s upm
                INNER JOIN %s up ON upm.permission_id = up.id
                WHERE upm.user_id = %d
                AND up.key = '%s'",
                $mappingModel->getName(),
                $permissionModel->getName(),
                $userId,
                $permissionKey
            );
        }
        else{
            $query = sprintf(
                "SELECT id, `key` FROM %s WHERE `key` = '%s'",
                $permissionModel->getName(),
                addslashes($permissionKey)
            );

        }
        $results = [];
        $db = $userId !== null
            ? $this->getModel("user_permission_mapping")->getDB()
            : $permissionModel->getDB();

        if (method_exists($db, 'getAll')) {
            $results = $db::getAll($query);
        }

        return $results;
    }

}
