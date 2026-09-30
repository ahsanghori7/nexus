<?php
declare(strict_types=1);

use Phinx\Migration\AbstractMigration;

final class NewRegionRepublicIreland extends AbstractMigration
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
        $region = "Republic of Ireland";
        $this->table('mapping_entities')->insert([
            'label'        => $region,
            'mapping_type' => 2
        ])->save();
        $id = $this->getAdapter()->getConnection()->lastInsertId();
        $this->table('region')->insert([['id' => $id, 'label' => $region,'region_group_id' => 1]])->update();
    }
}
