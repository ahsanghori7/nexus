<?php
declare(strict_types=1);

use Phinx\Migration\AbstractMigration;

final class DeconAdditionalTrades extends AbstractMigration
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
            "Air Conditioning",
            "Appliances",
            "Bar",
            "Building Control",
            "Building Surveyor",
            "CCTV Survey",
            "CDM Services and Planning",
            "Crane Hire",
            "Data",
            "Fire Consultant",
            "Fire Detection / Alarm",
            "Fire Proofing / Passive Fire Protection",
            "Games",
            "Garden Furniture",
            "HVAC - Heat Recovery Systems",
            "Illuminated Signs",
            "Joinery",
            "Kitchen Supplies",
            "Lighting",
            "Locksmith",
            "Mechanical and Electrical Engineer",
            "Mechanical Contractor",
            "Outdoor Kitchen",
            "Planning and Programming",
            "Planters",
            "Plumbing and Heating",
            "Principle Designer",
            "Security / CCTV",
            "Shop fitting",
            "Shop Furniture",
            "Shopfronts",
            "Signage",
            "Specialist Cleaners",
            "Sprinkler System",
            "Street Furniture",
            "Structural Engineer",
            "Utility Mapping",
            "Ventilation"
        ];
        $newProjectType = "28";

        $tradesData = $this->fetchAll("SELECT * FROM trade where label in ('"  . implode("', '", $trades) . "')");
        $existingTrades = array_column($tradesData, "label");
        foreach ($trades as $trade) {
            if (!in_array($trade, $existingTrades)) {
                $this->table('trade')->insert(["label" => $trade])->save();
                $id = $this->getAdapter()->getConnection()->lastInsertId();
            } else {
                $id = $tradesData[array_search($trade, $existingTrades)]["id"];
            }
            $this->table('trade_group')->insert(["type_id" => $newProjectType, "trade_id" => $id])->save();
        }
    }
}
