<?php
declare(strict_types=1);

use Phinx\Migration\AbstractMigration;

final class AddLtsRefurbishmentTrades extends AbstractMigration
{
    private $trades = [
        "Joinery (1)"                 => "Fit-Out and Interiors",
        "Joinery (2)"                 => "Fit-Out and Interiors",
        "Joinery (3)"                 => "Fit-Out and Interiors",
        "Joinery (4)"                 => "Fit-Out and Interiors",
        "Lift Car Fit Out"            => "Lifts / Escalators",
        "Ice Baths"                   => "Mechanical, Electrical and Services",
        "Wine Cellars"                => "Fit-Out and Interiors",
        "Sauna and Steam Rooms"       => "Mechanical, Electrical and Services",
        "General Small Builders’"     => "General Building",
        "Bathroom Waterproofing"      => "Waterproofing"
    ];

    public function up(): void
    {
        foreach ($this->trades as $tradeLabel => $tradeCategory) {
            $tradeRow = $this->fetchRow("SELECT id FROM trade WHERE label = '$tradeLabel'");

            if ($tradeRow) {
                continue;
            }

            $tradeCategoryRow = $this->fetchRow(
                "SELECT id FROM trade_category WHERE label = '$tradeCategory'"
            );
            $tradeCategoryId = $tradeCategoryRow['id'] ?? null;

            if (!$tradeCategoryId) {
                $this->table('trade_category')->insert([
                    'label' => $tradeCategory
                ])->save();
                $tradeCategoryId = $this->getAdapter()->getConnection()->lastInsertId();
            }

            $this->table('trade')->insert([
                'label' => $tradeLabel
            ])->save();
            $tradeId = $this->getAdapter()->getConnection()->lastInsertId();

            $this->table('trade_category_mapping')->insert([
                'trade_id'    => $tradeId,
                'category_id' => $tradeCategoryId
            ])->save();

            $attributeCategoryRow = $this->fetchRow(
                "SELECT id FROM attribute_category WHERE label = '$tradeCategory'"
            );
            $attributeCategoryId = $attributeCategoryRow['id'] ?? null;

            if (!$attributeCategoryId) {
                $this->table('attribute_category')->insert([
                    'label' => $tradeCategory,
                    'type'  => 'trade_category'
                ])->save();
                $attributeCategoryId = $this->getAdapter()->getConnection()->lastInsertId();
            }

            $this->table('attribute')->insert([
                'label'             => $tradeLabel,
                'attribute_type_id' => 1
            ])->save();
            $attributeId = $this->getAdapter()->getConnection()->lastInsertId();

            $this->table('attribute_category_mapping')->insert([
                'attribute_id' => $attributeId,
                'category_id'  => $attributeCategoryId
            ])->save();
        }
    }

    public function down(): void
    {
        $labels = array_keys($this->trades);
        $in = "'" . implode("','", $labels) . "'";

        $this->execute("
            DELETE acm
            FROM attribute_category_mapping acm
            JOIN attribute a ON acm.attribute_id = a.id
            WHERE a.label IN ($in)
        ");

        $this->execute("
            DELETE tcm
            FROM trade_category_mapping tcm
            JOIN trade t ON tcm.trade_id = t.id
            WHERE t.label IN ($in)
        ");

        $this->execute("
            DELETE FROM attribute
            WHERE label IN ($in)
        ");

        $this->execute("
            DELETE FROM trade
            WHERE label IN ($in)
        ");
    }
}
