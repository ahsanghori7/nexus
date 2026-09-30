<?php
declare(strict_types=1);

use Phinx\Migration\AbstractMigration;

final class AddExpansionJointsToTradeTable extends AbstractMigration
{
    private $trade          = "Expansion Joints (Highways + Buildings)";
    private $trade_category = "Highways & Buildings";

    public function up(): void
    {
        // Get the next safe ID that doesn't exist in either table
        $nextId = (int) $this->fetchRow("
            SELECT GREATEST(
                COALESCE((SELECT MAX(id) FROM trade), 0),
                COALESCE((SELECT MAX(id) FROM attribute), 0)
            ) + 1 AS next_id
        ")['next_id'];

        // trades
        $tradeCategoryRow = $this->fetchRow("SELECT * FROM trade_category where label = '$this->trade_category'");
        $tradeCategoryId = $tradeCategoryRow['id'] ?? null;

        if (!$tradeCategoryId) {
            $this->table('trade_category')->insert([
                'label' => $this->trade_category
            ])->save();
            $tradeCategoryId = $this->getAdapter()->getConnection()->lastInsertId();
        }

        $this->table('trade')->insert([
            'id'    => $nextId,
            'label' => $this->trade
        ])->save();

        $this->table('trade_category_mapping')->insert([
            'trade_id'    => $nextId,
            'category_id' => $tradeCategoryId
        ])->save();

        // attributes
        $attributeCategoryRow = $this->fetchRow("SELECT * FROM attribute_category where label = '$this->trade_category'");
        $attributeCategoryId = $attributeCategoryRow['id'] ?? null;

        if (!$attributeCategoryId) {
            $this->table('attribute_category')->insert([
                'label' => $this->trade_category,
                'type'  => 'trade_category'
            ])->save();
            $attributeCategoryId = $this->getAdapter()->getConnection()->lastInsertId();
        }

        $this->table('attribute')->insert([
            'id'                => $nextId,
            'label'             => $this->trade,
            'attribute_type_id' => 1
        ])->save();

        $this->table('attribute_category_mapping')->insert([
            'attribute_id' => $nextId,
            'category_id'  => $attributeCategoryId
        ])->save();
    }

    public function down(): void
    {
        // Delete attribute mappings
        $this->execute("
            DELETE acm
            FROM attribute_category_mapping acm
            JOIN attribute a ON acm.attribute_id = a.id
            WHERE a.label = '$this->trade'
        ");

        // Delete trade mappings
        $this->execute("
            DELETE tcm
            FROM trade_category_mapping tcm
            JOIN trade t ON tcm.trade_id = t.id
            WHERE t.label = '$this->trade'
        ");

        // Delete attributes
        $this->execute("
            DELETE FROM attribute
            WHERE label = '$this->trade'
        ");

        // Delete trades
        $this->execute("
            DELETE FROM trade
            WHERE label = '$this->trade'
        ");
    }
}
