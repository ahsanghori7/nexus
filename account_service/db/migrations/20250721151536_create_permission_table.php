<?php
declare(strict_types=1);

use Phinx\Migration\AbstractMigration;

final class CreatePermissionTable extends AbstractMigration
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
          $this->table('permission', [
                'id' => false,
                'primary_key' => 'id',
                'engine' => 'InnoDB'
            ])
            ->addColumn('id', 'integer', [
                'signed' => true,
                'identity' => true
            ])
            ->addColumn('key', 'string', [
                'limit' => 255,
                'null' => false
            ])
            ->addIndex(['key'], ['unique' => true])
            ->create();
    }
}
