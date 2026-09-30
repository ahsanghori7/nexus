<?php
declare(strict_types=1);

use Phinx\Migration\AbstractMigration;

final class GuildmoreNewTrades extends AbstractMigration
{
    public function up(): void
    {
        $trades = [
            "Design Coordinator" => 5,
            "BSR Advisor"        => 5,
        ];
        foreach($trades as $label => $key)
        {
            //trade table
            $this->table('trade')->insert([
                'label' => $label
            ])->save();
            $tradeId = $this->getAdapter()->getConnection()->lastInsertId();
            $this->table('trade_category_mapping')->insert([
                'trade_id'    => $tradeId,
                'category_id' => $key
            ])->save();

            //attribute table
            $this->table('attribute')->insert([
                'label'             => $label,
                'attribute_type_id' => 1
            ])->save();
            $attributeId = $this->getAdapter()->getConnection()->lastInsertId();
            $this->table('attribute_category_mapping')->insert([
                'attribute_id' => $attributeId,
                'category_id'  => $key
            ])->save();
        }
    }

    public function down(): void
    {
        // Roll back trades and attributes
        $labels = ["Design Coordinator", "BSR Advisor"];

        // Delete attribute mappings
        $in = "'" . implode("','", $labels) . "'";
        $this->execute("
            DELETE acm
            FROM attribute_category_mapping acm
            JOIN attribute a ON acm.attribute_id = a.id
            WHERE a.label IN ($in)
        ");

        // Delete trade mappings
        $this->execute("
            DELETE tcm
            FROM trade_category_mapping tcm
            JOIN trade t ON tcm.trade_id = t.id
            WHERE t.label IN ($in)
        ");

        // Delete attributes
        $this->execute("
            DELETE FROM attribute
            WHERE label IN ($in)
        ");

        // Delete trades
        $this->execute("
            DELETE FROM trade
            WHERE label IN ($in)
        ");
    }
}
