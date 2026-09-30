<?php
declare(strict_types=1);

use Phinx\Migration\AbstractMigration;

final class AddStatusEnumColumnToTenderTable extends AbstractMigration
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
        $this->table('tender')
            ->addColumn('status', 'enum', [
                'null' => false,
                'default' => 'needs_setup',
                'values' => ['ready', 'needs_setup', 'in_progress'],
            ])
            ->update();
    }
}
