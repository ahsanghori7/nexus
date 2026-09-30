<?php
declare(strict_types=1);

namespace App\Domain\User;

use App\Domain\AbstractModel;

class RoleRepository extends AbstractModel
{
    /**
     * Get all roles with their level
     *
     * @return array
     */
    public function getRolesWithLevel(): array
    {
        $sql = "SELECT id, label, level, display_label AS value, is_contractor_user_type, is_external FROM role ORDER BY level ASC";
        return $this->getDb()::getAll($sql);
    }

}
