<?php
declare(strict_types=1);

use Phinx\Migration\AbstractMigration;

final class AustralianRegions extends AbstractMigration
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
        $row = $this->fetchRow("SELECT * FROM region_group WHERE code = 'AUS'");
        $group_id = $row['id'];
        $new_regions = [
            'New South Wales'              => $group_id,
            'Northern Territory'           => $group_id,
            'Queensland'                   => $group_id,
            'South Australia'              => $group_id,
            'Tasmania'                     => $group_id,
            'Victoria'                     => $group_id,
            'Western Australia'            => $group_id,
            'Australian Capital Territory' => $group_id,
            'External Territories'         => $group_id,
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
