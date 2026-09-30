<?php
declare(strict_types=1);

use Phinx\Migration\AbstractMigration;

final class OrderApprovers extends AbstractMigration
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
        $table = $this->table('order_approvers_status', ['id' => false, 'primary_key' => 'id']);
        $table->addColumn('id', 'integer', ['signed' => true, 'identity' => true])
            ->addColumn('label', 'string', ['limit' => 100, 'null' => false])
            ->create();

        $this->table('order_approvers_status')
        ->insert([
            ['id' => 1, 'label' => 'Rejected'],
            ['id' => 2, 'label' => 'Approved'],
            ['id' => 3, 'label' => 'Pending']
        ])
        ->save();


        $table = $this->table('order_approvers', ['id' => false, 'primary_key' => 'id']);
        $table->addColumn('id', 'integer', ['signed' => true, 'identity' => true])
            ->addColumn('user_id', 'integer', ['signed' => true])
            ->addColumn('transaction_id', 'integer', ['signed' => true])
            ->addColumn('status_id', 'integer', ['signed' => true])
            ->addColumn('comment', 'text', ['null' => true, 'limit' => 65535])
            ->addColumn('created_at', 'timestamp', ['default' => 'CURRENT_TIMESTAMP'])
            ->addColumn('updated_at', 'timestamp', ['default' => 'CURRENT_TIMESTAMP'])
            ->addForeignKey('status_id', 'order_approvers_status', 'id', ['delete' => 'CASCADE', 'update' => 'CASCADE'])
            ->addForeignKey('transaction_id', 'transaction', 'id', ['delete' => 'CASCADE', 'update' => 'CASCADE'])
            ->create();
    }
}
