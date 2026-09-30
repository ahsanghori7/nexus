<?php

declare(strict_types=1);

use Phinx\Migration\AbstractMigration;

final class AddAccountMetaKey extends AbstractMigration
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
        // Insert data into account_meta_key
        $this->table('account_meta_key')
            ->insert([
                ['id' => null, 'key' => 'bank_name'],
                ['id' => null, 'key' => 'address'],
                ['id' => null, 'key' => 'sort_code'],
                ['id' => null, 'key' => 'account_number'],
                ['id' => null, 'key' => 'collateral_warranties'],
                ['id' => null, 'key' => 'performance_guarantee_bonds'],
            ])
            ->update();
    }
}
