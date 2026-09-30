<?php
declare(strict_types=1);

use Phinx\Migration\AbstractMigration;

final class AnzRegions extends AbstractMigration
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
        $this->execute("DELETE FROM region WHERE label = 'New Zealand'");
        $this->execute("DELETE FROM region WHERE label = 'Australia'");
        $this->execute("DELETE FROM mapping_entities WHERE label = 'New Zealand'");
        $this->execute("DELETE FROM mapping_entities WHERE label = 'Australia'");
        $this->execute("ALTER TABLE mapping_entities CONVERT TO CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci");
        $this->execute("ALTER TABLE region CONVERT TO CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci");

        $anz_region_id = 2;
        $new_regions = [
            'Northland (Te Tai Tokerau)'        => $anz_region_id,
            'Auckland (Tāmaki-makau-rau)'       => $anz_region_id,
            'Waikato'                           => $anz_region_id,
            'Bay of Plenty (Te Moana-a-Toi)'    => $anz_region_id,
            'Gisborne (Te Tairāwhiti)'          => $anz_region_id,
            'Hawke’s Bay (Te Matau-a-Māui)'     => $anz_region_id,
            'Taranaki'                          => $anz_region_id,
            'Manawatū-Whanganui'                => $anz_region_id,
            'Wellington (Te Whanga-nui-a-Tara)' => $anz_region_id,
            'Tasmin (Te Tai-o-Aorere)'          => $anz_region_id,
            'Nelson (Whakatū)'                  => $anz_region_id,
            'Marlborough (Te Tauihu-o-te-waka)' => $anz_region_id,
            'West Coast (Te Tai Poutini)'       => $anz_region_id,
            'Canterbury (Waitaha)'              => $anz_region_id,
            'Otago (Ōtākou)'                    => $anz_region_id,
            'Southland (Murihiku)'             => $anz_region_id,
        ];
        foreach($new_regions as $region => $group_id){
            $this->table('mapping_entities')->insert([
                'label'        => $region,
                'mapping_type' => 2
            ])->save();
            $row = $this->fetchRow("SELECT id FROM mapping_entities WHERE label = '".$region."'");
            $this->table('region')->insert([['id' => $row['id'], 'label' => $region,'region_group_id' => $group_id]])->update();
        }
    }
}
