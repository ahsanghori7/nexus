<?php
declare(strict_types=1);

use Phinx\Migration\AbstractMigration;

final class SupplyChain extends AbstractMigration
{

    /**
     * Migrate Up.
     */
    public function up()
    {

        // Create table 'mapping_type'
        $mappingType = $this->table('mapping_type', ['id' => false, 'primary_key' => 'id']);
        $mappingType->addColumn('id', 'integer', ['signed' => true, 'identity' => true])
            ->addColumn('label', 'string', ['limit' => 255])
           ->save();

        // Create table 'mapping_entities'
        $mappingEntities = $this->table('mapping_entities', ['id' => false, 'primary_key' => 'id']);
        $mappingEntities->addColumn('id', 'integer', ['signed' => true, 'identity' => true])
            ->addColumn('label', 'string')
            ->addColumn('mapping_type', 'integer', ['signed' => true])
            ->addIndex(['label', 'mapping_type'], ['unique' => true, 'name' => 'label_type'])
            ->addIndex('mapping_type')
            ->addForeignKey('mapping_type', 'mapping_type', 'id', ['delete' => 'CASCADE', 'update' => 'CASCADE'])
            ->save();

        // Create table 'mapping'
        $mapping = $this->table('mapping', ['id' => false, 'primary_key' => 'id']);
        $mapping->addColumn('id', 'integer', ['signed' => true, 'identity' => true])
            ->addColumn('account_id', 'integer')
            ->addColumn('group_id', 'integer')
            ->addColumn('mapping_type_id', 'integer')
            ->addColumn('created_at', 'timestamp', ['default' => 'CURRENT_TIMESTAMP'])
            ->addIndex(['account_id', 'group_id', 'mapping_type_id'], ['unique' => true, 'name' => 'account_group_type'])
            ->addIndex('mapping_type_id')
            ->addIndex('group_id')
            ->addForeignKey('account_id', 'account', 'id', ['delete' => 'CASCADE', 'update' => 'CASCADE'])
            ->addForeignKey('group_id', 'account', 'id', ['delete' => 'CASCADE', 'update' => 'CASCADE'])
            ->addForeignKey('mapping_type_id', 'mapping_entities', 'id', ['delete' => 'CASCADE', 'update' => 'CASCADE'])
            ->save();

        // Create table 'supply_chain_v2'
        // Temporary table in order to move old data
        $supplyChain = $this->table('supply_chain_v2', ['id' => false, 'primary_key' => 'id']);
        $supplyChain->addColumn('id', 'integer', ['signed' => true, 'identity' => true])
            ->addColumn('parent_id', 'integer')
            ->addColumn('child_id', 'integer')
            ->addColumn('status_id', 'integer', ['default' => 1, 'signed' => true])
            ->addColumn('created_at', 'timestamp', ['default' => 'CURRENT_TIMESTAMP'])
            ->addColumn('updated_at', 'timestamp', ['default' => 'CURRENT_TIMESTAMP'])
            ->addIndex(['parent_id', 'child_id'], ['unique' => true, 'name' => 'Trade Supply Chain'])
            ->addIndex('child_id')
            ->addForeignKey('child_id', 'account', 'id', ['delete' => 'CASCADE', 'update' => 'CASCADE'])
            ->addForeignKey('parent_id', 'account', 'id', ['delete' => 'CASCADE', 'update' => 'CASCADE'])
            ->save();

        $this->table('mapping_type')->insert([
            [
                'id'    => 1,
                'label' => 'trades'
            ],
            [
                'id'    => 2,
                'label' => 'regions'
            ],
            [
                'id'    => 3,
                'label' => 'project_types'
            ]
        ])->save();

        $entities = [];
        $rows = $this->fetchAll('SELECT * FROM trade');
        foreach($rows as $row){
            $entities[] = [
                'id'           => $row['id'],
                'label'        => $row['label'],
                'mapping_type' => 1
            ];
        }
        $rows = $this->fetchAll('SELECT * FROM region');
        foreach($rows as $row){
            $entities[] = [
                'id'           => $row['id'],
                'label'        => $row['label'],
                'mapping_type' => 2
            ];
        }
        $rows = $this->fetchAll('SELECT * FROM project_type');
        foreach($rows as $row){
            $entities[] = [
                'id'           => $row['id'],
                'label'        => $row['label'],
                'mapping_type' => 3
            ];
        }

        $this->table('mapping_entities')->insert($entities)->save();

        $mapping = [];
        $supply_chain = [];
        $rows = $this->fetchAll('SELECT * FROM supply_chain');
        foreach($rows as $row){
            $mapping[] = [
                'account_id'      => $row['parent_id'],
                'group_id'        => $row['child_id'],
                'mapping_type_id' => $row['trade_id'],
                'created_at'      => $row['created_at']
            ];

            //add data back to supply chain but only unique entries main contractor and prosper id
            $supply_chain[$row['parent_id'].$row['child_id']] =[
                'parent_id'  => $row['parent_id'],
                'child_id'   => $row['child_id'],
                'status_id'  => 1,
                'created_at' => $row['created_at'],
                'updated_at' => $row['created_at']
            ];
        }

        //selecting only entries that are still in the account table, as the group id was not a foreign key before
        $rows = $this->fetchAll('SELECT rm.group_id, rm.account_id, rm.region_id FROM region_mapping rm LEFT JOIN account a on rm.group_id = a.id WHERE rm.type_id = 2 and a.id IS NOT NULL;
');
        foreach($rows as $row){
            $mapping[$row['group_id'].$row['account_id'].$row['region_id']] = [
                'account_id'      => $row['group_id'],
                'group_id'        => $row['account_id'],
                'mapping_type_id' => $row['region_id'],
            ];
        }

        $this->table('mapping')->insert($mapping)->save();
        $this->table('supply_chain_v2')->insert($supply_chain)->save();

        $this->table("supply_chain")->rename("supply_chain_v1")->update();
        $this->table("supply_chain_v2")->rename("supply_chain")->update();
    }

    /**
     * Migrate Down.
     */
    public function down()
    {

    }
}
