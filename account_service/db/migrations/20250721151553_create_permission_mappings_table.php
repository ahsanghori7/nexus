<?php
declare(strict_types=1);

use Phinx\Migration\AbstractMigration;

final class CreatePermissionMappingsTable extends AbstractMigration
{
    /**
     * Change Method.
     *
     * Write your reversible migrations using this method.
     *
     * More information on writing migrations is available here:
     * https://book.cakephp.org/phinx/0/en/migrations.html#the-change-method
     *
     * Remember to call "create()" or "update()" and NOT "save()" when working
     * with the Table class.
     */
    public function change(): void
    {
        $this->table('permission_mappings')
            ->addColumn('role_id', 'integer', [
                'null' => false,
                'signed' => true
            ])
            ->addColumn('permission_id', 'integer', [
                'null' => false,
                'signed' => true
            ])
            ->addForeignKey('role_id', 'role', 'id', [
                'delete' => 'CASCADE',
                'update' => 'NO_ACTION'
            ])
            ->addForeignKey('permission_id', 'permission', 'id', [
                'delete' => 'CASCADE',
                'update' => 'NO_ACTION'
            ])
            ->create();
    }
}
