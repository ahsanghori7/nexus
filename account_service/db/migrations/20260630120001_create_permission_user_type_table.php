<?php

declare(strict_types=1);

use Phinx\Migration\AbstractMigration;

final class CreatePermissionUserTypeTable extends AbstractMigration
{
    public function up(): void
    {
        if (!$this->hasTable('permission_user_type')) {
            $this->table('permission_user_type', [
                'id' => false,
                'primary_key' => 'id',
                'engine' => 'InnoDB',
            ])
                ->addColumn('id', 'integer', [
                    'signed' => true,
                    'identity' => true,
                ])
                ->addColumn('permission_id', 'integer', [
                    'null' => false,
                    'signed' => true,
                ])
                ->addColumn('user_type_id', 'integer', [
                    'null' => false,
                    'signed' => true,
                ])
                ->addColumn('is_checked', 'boolean', [
                    'null' => false,
                    'default' => false,
                ])
                ->addForeignKey('permission_id', 'permission', 'id', [
                    'delete' => 'CASCADE',
                    'update' => 'NO_ACTION',
                ])
                ->addForeignKey('user_type_id', 'role', 'id', [
                    'delete' => 'CASCADE',
                    'update' => 'NO_ACTION',
                ])
                ->addIndex(['permission_id', 'user_type_id'], ['unique' => true])
                ->addIndex(['user_type_id'])
                ->create();
        }
    }

    public function down(): void
    {
        if ($this->hasTable('permission_user_type')) {
            $this->table('permission_user_type')->drop()->save();
        }
    }
}
