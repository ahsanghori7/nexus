<?php
declare(strict_types=1);

use Phinx\Migration\AbstractMigration;

final class MclarenNewTrades extends AbstractMigration
{
    public function up(): void
    {
        $trades = [
            "Road Markings / White Lining" => 30,
            "Sub-White Lining"             => 30,
        ];

        foreach ($trades as $label => $categoryId) {
            // trade table
            $this->table('trade')->insert([
                'label' => $label
            ])->save();
            $tradeId = $this->getAdapter()->getConnection()->lastInsertId();

            $this->table('trade_category_mapping')->insert([
                'trade_id'    => $tradeId,
                'category_id' => $categoryId
            ])->save();

            // attribute table
            $this->table('attribute')->insert([
                'label'             => $label,
                'attribute_type_id' => 1
            ])->save();
            $attributeId = $this->getAdapter()->getConnection()->lastInsertId();

            $this->table('attribute_category_mapping')->insert([
                'attribute_id' => $attributeId,
                'category_id'  => $categoryId
            ])->save();
        }
    }

    public function down(): void
    {
        $labels = ["Road Markings / White Lining", "Sub-White Lining"];
        $in = "'" . implode("','", $labels) . "'";

        // Delete attribute mappings
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
