<?php
declare(strict_types=1);

use Phinx\Migration\AbstractMigration;

final class AddPermissionTypesAndAccountRoleMappings extends AbstractMigration
{
    public function up(): void
    {
        if (!$this->hasTable('permission_type')) {
            $this->table('permission_type', [
                'id' => false,
                'primary_key' => 'id',
                'engine' => 'InnoDB',
            ])
                ->addColumn('id', 'integer', [
                    'signed' => true,
                    'identity' => true,
                ])
                ->addColumn('label', 'string', [
                    'limit' => 255,
                    'null' => false,
                ])
                ->addIndex(['label'], ['unique' => true])
                ->create();
        }

        $permissionTable = $this->table('permission');
        if (!$permissionTable->hasColumn('permission_type_id')) {
            $permissionTable
                ->addColumn('permission_type_id', 'integer', [
                    'null' => true,
                    'signed' => true,
                    'after' => 'key',
                ])
                ->addForeignKey('permission_type_id', 'permission_type', 'id', [
                    'delete' => 'SET_NULL',
                    'update' => 'NO_ACTION',
                ])
                ->addIndex(['permission_type_id'])
                ->update();
        }

        $mappingTable = $this->table('permission_mappings');
        if (!$mappingTable->hasColumn('account_role_id')) {
            $mappingTable
                ->addColumn('account_role_id', 'integer', [
                    'null' => true,
                    'signed' => false,
                    'after' => 'user_id',
                ])
                ->addForeignKey('account_role_id', 'account_role', 'id', [
                    'delete' => 'CASCADE',
                    'update' => 'NO_ACTION',
                ])
                ->addIndex(['account_role_id'])
                ->update();
        }

        if ($mappingTable->hasColumn('user_id')) {
            $mappingTable
                ->changeColumn('user_id', 'integer', [
                    'null' => true,
                    'signed' => true,
                ])
                ->update();
        }
    }

    public function down(): void
    {
        $mappingTable = $this->table('permission_mappings');
        if ($mappingTable->hasColumn('account_role_id')) {
            $mappingTable
                ->dropForeignKey('account_role_id')
                ->removeIndex(['account_role_id'])
                ->removeColumn('account_role_id')
                ->update();
        }

        $permissionTable = $this->table('permission');
        if ($permissionTable->hasColumn('permission_type_id')) {
            $permissionTable
                ->dropForeignKey('permission_type_id')
                ->removeIndex(['permission_type_id'])
                ->removeColumn('permission_type_id')
                ->update();
        }

        if ($this->hasTable('permission_type')) {
            $this->table('permission_type')->drop()->save();
        }
    }
}
