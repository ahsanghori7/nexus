<?php
declare(strict_types=1);

use Phinx\Migration\AbstractMigration;

class SupplyChainStatus extends AbstractMigration
{
    public function change()
    {
        // Create supply_chain_status_type table
        $supplyChainStatusType = $this->table('supply_chain_status_type', ['id' => false, 'primary_key' => 'id', 'collation' => 'latin1_general_ci']);
        $supplyChainStatusType->addColumn('id', 'integer', ['identity' => true, 'signed' => true])
            ->addColumn('label', 'string', ['limit' => 50])
            ->create();

        // Insert data into supply_chain_status_type
        $rows = [
            ['id' => 1, 'label' => 'Not rated'],
            ['id' => 2, 'label' => 'Do not use'],
            ['id' => 3, 'label' => 'Needs improvement'],
            ['id' => 4, 'label' => 'Performed well']
        ];
        $this->table('supply_chain_status_type')->insert($rows)->save();

        // Alter supply_chain table
        $this->table('supply_chain')
            ->addForeignKey('status_id', 'supply_chain_status_type', 'id', ['delete' => 'CASCADE', 'update' => 'CASCADE'])
            ->save();

        // Create supply_chain_history_type table
        $supplyChainHistoryType = $this->table('supply_chain_history_type', ['id' => false, 'primary_key' => 'id', 'collation' => 'latin1_general_ci']);
        $supplyChainHistoryType->addColumn('id', 'integer', ['identity' => true, 'signed' => true])
            ->addColumn('label', 'string', ['limit' => 50])
            ->create();

        // Create supply_chain_history table
        $supplyChainHistory = $this->table('supply_chain_history', ['id' => false, 'primary_key' => 'id', 'collation' => 'latin1_general_ci']);
        $supplyChainHistory->addColumn('id', 'integer', ['identity' => true, 'signed' => true])
            ->addColumn('supply_chain_id', 'integer')
            ->addColumn('type_id', 'integer')
            ->addColumn('value', 'string', ['limit' => 100, 'null' => true, 'default' => null])
            ->addColumn('created_at', 'datetime', ['default' => 'CURRENT_TIMESTAMP'])
            ->addForeignKey('supply_chain_id', 'supply_chain', 'id', ['delete' => 'CASCADE', 'update' => 'CASCADE'])
            ->addForeignKey('type_id', 'supply_chain_history_type', 'id', ['delete' => 'CASCADE', 'update' => 'CASCADE'])
            ->create();
    }
}
