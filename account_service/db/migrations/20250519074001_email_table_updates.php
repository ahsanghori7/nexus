<?php

declare(strict_types=1);

use Phinx\Migration\AbstractMigration;

final class EmailTableUpdates extends AbstractMigration
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
        $this->table('email')
            ->changeColumn('uid', 'string', ['limit' => 512])
            ->update();

        $this->table('email')->insert(["uid" => "bounce", "label" => "Bounce"])->save();
        $this->table('email')->insert(["uid" => "open", "label" => "Open"])->save();

        $this->table('email_log')
            ->changeColumn('user_id', 'integer', ['null' => true, 'default' => null])
            ->addColumn('reason', 'text', ['null' => false])
            ->update();
    }
}
