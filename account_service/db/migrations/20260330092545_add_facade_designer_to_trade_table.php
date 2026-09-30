<?php
declare(strict_types=1);

use Phinx\Migration\AbstractMigration;

final class AddFacadeDesignerToTradeTable extends AbstractMigration
{
    public function up(): void
    {
        $trades = [
            "Façade Designer" => 5
        ];

        foreach ($trades as $label => $categoryId) {
            // Get the next safe ID that doesn't exist in either table
            $maxId = (int) $this->fetchRow("
                SELECT GREATEST(
                    COALESCE((SELECT MAX(id) FROM trade), 0),
                    COALESCE((SELECT MAX(id) FROM attribute), 0)
                ) + 1 AS next_id
            ")['next_id'];

            // trade table
            $this->table('trade')->insert([
                'id'    => $maxId,
                'label' => $label
            ])->save();

            $this->table('trade_category_mapping')->insert([
                'trade_id'    => $maxId,
                'category_id' => $categoryId
            ])->save();

            // attribute table
            $this->table('attribute')->insert([
                'id'                => $maxId,
                'label'             => $label,
                'attribute_type_id' => 1
            ])->save();

            $this->table('attribute_category_mapping')->insert([
                'attribute_id' => $maxId,
                'category_id'  => $categoryId
            ])->save();
        }
    }

    public function down(): void
    {
        $labels = ["Façade Designer"];
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
