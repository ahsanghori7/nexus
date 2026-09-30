<?php
declare(strict_types=1);

use Phinx\Migration\AbstractMigration;

final class TransactionDocument extends AbstractMigration
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
        $this->table('transaction_document', getComonConfig()["generic_table_config"])
            ->addColumn('id', 'integer', ['identity' => true])
            ->addColumn("transaction_id", 'integer', ['null' => true])
            ->addColumn('name', 'string', ['limit' => 255, 'null' => false])
            ->addColumn('s3_key', 'string', ['limit' => 255, 'null' => false])
            ->addColumn('created_at', 'datetime', ['null' => false, 'default' => 'CURRENT_TIMESTAMP'])
            ->addForeignKey('transaction_id', 'transaction', 'id', ['delete' => 'CASCADE', 'update' => 'CASCADE'])
            ->create();
    }
}
