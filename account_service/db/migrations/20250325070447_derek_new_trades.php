<?php
declare(strict_types=1);

use Phinx\Migration\AbstractMigration;

final class DerekNewTrades extends AbstractMigration
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
        $trades = [
            "High-End Retail"             => "Fit-Out and Interiors",
            "Flooring Fitters"            => "Flooring",
            "Flooring Suppliers"          => "Flooring",
            "Leisure Specialist"          => "Miscellaneous Trades",
            "Specialist Trades/Suppliers" => "Miscellaneous Trades"

        ];
        foreach($trades as $trade_label => $trade_category){
            $categoryRow = $this->fetchRow("SELECT * FROM trade_category where label = '".$trade_category."'");
            $categoryId = $categoryRow['id'] ?? null;
            if(!$categoryId){
                $this->table('trade_category')->insert([
                    'label' => $trade_category
                ])->save();
                $categoryId = $this->getAdapter()->getConnection()->lastInsertId();
            }

            $tradeLast = $this->fetchRow('SELECT MAX(id) AS last_id FROM trade');
            $lastId    = $tradeLast['last_id'];
            $mappingEntitiesLast = $this->fetchRow('SELECT MAX(id) AS last_id FROM mapping_entities');
            $mappingEntitiesLastId = $mappingEntitiesLast['last_id'];
            $greaterId = max($lastId, $mappingEntitiesLastId);
            $nextId = $greaterId + 1;
            $this->table('trade')->insert([
                'id'    => $nextId,
                'label' => $trade_label,
            ])->save();
            $tradeId = $this->getAdapter()->getConnection()->lastInsertId();
            $this->table('trade_category_mapping')->insert([
                'category_id' => $categoryId,
                'trade_id'    => $tradeId
            ])->save();
            $this->table('mapping_entities')->insert([
                'id'           => $tradeId,
                'label'        => $trade_label,
                'mapping_type' => 1
            ])->save();
        }
    }
}
