<?php

declare(strict_types=1);

use Phinx\Migration\AbstractMigration;

final class AddLabelToPermission extends AbstractMigration
{
    public function up(): void
    {
        $permissionTable = $this->table('permission');
        if (!$permissionTable->hasColumn('label')) {
            $permissionTable
                ->addColumn('label', 'string', [
                    'limit' => 255,
                    'null' => true,
                    'after' => 'key',
                ])
                ->update();
        }
    }

    public function down(): void
    {
        $permissionTable = $this->table('permission');
        if ($permissionTable->hasColumn('label')) {
            $permissionTable
                ->removeColumn('label')
                ->update();
        }
    }
}
