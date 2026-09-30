<?php

declare(strict_types=1);

use Phinx\Migration\AbstractMigration;

final class AddNewTradesAndCategories extends AbstractMigration
{

    private $trades = [
        "Fascia & Soffit Boarding"                  => "Roofing",
        "Roofline Works"                            => "Roofing",
        "Loft Insulation"                           => "Insulating Materials",
        "Door Undercuts/Modifications"              => "Doors / Windows / Gates",
        "Damp & Moisture surveys"                   => "Consultants / Surveyors / Surveys",
        "Industrial Painting / Heavy-Duty Coatings" => "Surface Finishes / Coatings",
        "Soffit Insulation"                         => "Insulating Materials",
        "Noise, Vibration & Dust (NVD) Monitoring"  => "Consultants / Surveyors / Surveys",
        "Insulated Concrete Formwork (ICF)"         => "Concrete",
        "Modular / Volumetric Construction"         => "Offsite / Modular Construction",
        "Healthcare / Hospital Furniture"           => "Fit-Out and Interiors",
        "Floor Painting & Sealing"                  => "Flooring",
        "Radon Barrier Installation"                => "Waterproofing",
        "Facilities Management (FM)"                => "Facilities Management",
        "Tool & Plant Hire"                         => "General Building",
        "General Builders Merchants"                => "General Building"
    ];

    public function up(): void
    {
        // Get the next safe ID that doesn't exist in either table
        $nextId = (int) $this->fetchRow("
            SELECT GREATEST(
                COALESCE((SELECT MAX(id) FROM trade), 0),
                COALESCE((SELECT MAX(id) FROM attribute), 0)
            ) + 1 AS next_id
        ")['next_id'];

        foreach ($this->trades as $trade_label => $trade_category) {
            // trades
            $tradeCategoryRow = $this->fetchRow("SELECT * FROM trade_category where label = '$trade_category'");
            $tradeCategoryId = $tradeCategoryRow['id'] ?? null;

            if (!$tradeCategoryId) {
                $this->table('trade_category')->insert([
                    'label' => $trade_category
                ])->save();
                $tradeCategoryId = $this->getAdapter()->getConnection()->lastInsertId();
            }

            $this->table('trade')->insert([
                'id'    => $nextId,
                'label' => $trade_label
            ])->save();

            $this->table('trade_category_mapping')->insert([
                'trade_id'    => $nextId,
                'category_id' => $tradeCategoryId
            ])->save();

            // attributes
            $attributeCategoryRow = $this->fetchRow("SELECT * FROM attribute_category where label = '$trade_category'");
            $attributeCategoryId = $attributeCategoryRow['id'] ?? null;

            if (!$attributeCategoryId) {
                $this->table('attribute_category')->insert([
                    'label' => $trade_category,
                    'type'  => 'trade_category'
                ])->save();
                $attributeCategoryId = $this->getAdapter()->getConnection()->lastInsertId();
            }

            $this->table('attribute')->insert([
                'id'                => $nextId,
                'label'             => $trade_label,
                'attribute_type_id' => 1
            ])->save();

            $this->table('attribute_category_mapping')->insert([
                'attribute_id' => $nextId,
                'category_id'  => $attributeCategoryId
            ])->save();

            $nextId++;
        }
    }

    public function down(): void
    {
        $labels = array_keys($this->trades);
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
