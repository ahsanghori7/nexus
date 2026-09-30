<?php
declare(strict_types=1);

use Phinx\Migration\AbstractMigration;

final class AccountRegionLocalisation extends AbstractMigration
{

    protected $commonConfig = [
        'engine' => 'InnoDB',
        'collation' => 'latin1_general_ci',
        'id' => false,
        'primary_key' => ['id']
    ];

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
        $this->table('region_group', $this->commonConfig)
            ->addColumn('id', 'integer', ['signed' => true, 'identity' => true])
            ->addColumn('label', 'string', ['limit' => 50, 'collation' => 'latin1_general_ci'])
            ->addColumn('code', 'string', ['limit' => 10, 'collation' => 'latin1_general_ci'])
            ->create();
        $this->table('region_group')->insert([['label' => 'United Kingdom','code' => 'UK']])->update();
        $this->table('region_group')->insert([['label' => 'ANZ', 'code' => 'ANZ']])->update();
        $this->table('region_group')->insert([['label' => 'EU', 'code' => 'EU']])->update();

        $this->table('account', $this->commonConfig)
            ->addColumn('region_group_id', 'integer', ['null' => false, 'default' => 1, 'after' => 'type_id'])
            ->addForeignKey('region_group_id', 'region_group', 'id', ['delete' => 'CASCADE', 'update' => 'CASCADE'])
            ->update();

        $this->table('region', $this->commonConfig)
            ->addColumn('region_group_id', 'integer', ['null' => false, 'default' => 1, 'after' => 'label'])
            ->addForeignKey('region_group_id', 'region_group', 'id', ['delete' => 'CASCADE', 'update' => 'CASCADE'])
            ->update();

        $new_regions = [
            'New Zealand' => 2,
            'Australia'   => 2,
            'Denmark'     => 3,
            'Germany'     => 3,
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
