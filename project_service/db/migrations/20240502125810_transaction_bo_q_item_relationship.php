<?php
declare(strict_types=1);

use Phinx\Migration\AbstractMigration;
include_once(__DIR__ . '/../common_config.php');
final class TransactionBoQItemRelationship extends AbstractMigration
{
    /**
     *
     * Create a relationship between quote items and the current quotation database mechanism to connect orders
     * and other quote items, such as measured works and programme
     * I've removed the subcontractor id because it's a duplication from transaction which
     * is the primary entity in the quotation mechanism and normailsed
     * Really the tender_id should be removed as well, but it will break devs local on migrate unless the table is empty as its an FK
     */
    public function change(): void
    {
        $this->table('boq_quote_item', getComonConfig()["generic_table_config"])
            ->removeColumn('subcontractor_id')
            ->addColumn("transaction_id", 'integer', ['null' => true])
            ->addForeignKey('transaction_id', 'transaction', 'id', ['delete' => 'CASCADE', 'update' => 'CASCADE'])
            ->update();
    }
}
