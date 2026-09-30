<?php
declare(strict_types=1);

use Phinx\Migration\AbstractMigration;

final class AttributesCategories extends AbstractMigration
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

       $this->table('website_region', [
           'id'          => false,
           'primary_key' => ['id'],
       ])
           ->addColumn('id', 'integer', ['identity' => true])
           ->addColumn('region_code', 'string', [
               'limit'     => 10,
               'null'      => false,
               'collation' => 'latin1_general_ci'
           ])
           ->addIndex(['region_code'], ['unique' => true])
           ->create();

       $rows = [
           ['region_code' => 'UK'],
           ['region_code' => 'NZ'],
           ['region_code' => 'EU'],
           ['region_code' => 'AUS']
       ];
       $this->table('website_region')->insert($rows)->save();

       $this->table('website')
           ->addColumn('region_code', 'string', ['limit' => 10, 'null' => false])
           ->update();

       $this->execute("UPDATE website SET region_code = 'UK'");

       $this->table('website')
           ->addForeignKey('region_code', 'website_region', 'region_code')
           ->update();


        $this->table('attribute_category', [
            'id'          => false,
            'primary_key' => ['id'],
        ])
            ->addColumn('id', 'integer', ['identity' => true])
            ->addColumn('label', 'string', [
                'limit'     => 255,
                'null'      => true,
                'collation' => 'latin1_general_ci'
            ])
            ->addColumn('type', 'string', [
                'limit'     => 255,
                'null'      => false,
                'collation' => 'latin1_general_ci'
            ])
            ->addColumn('group_id', 'integer', [
                'null'      => true,
                'collation' => 'latin1_general_ci'
            ])
            ->addColumn('region_code', 'string', [
                'limit'     => 10,
                'null'      => false,
                'collation' => 'latin1_general_ci'
            ])
            ->addForeignKey('region_code', 'website_region', 'region_code')
            ->addForeignKey('group_id',    'account', 'id')
            ->create();


        $this->table('attribute_category_mapping')
            ->addColumn('category_id', 'integer')
            ->addColumn('attribute_id', 'integer')
            ->addForeignKey('category_id', 'attribute_category', 'id')
            ->addForeignKey('attribute_id','attribute', 'id')
            ->create();

    }
}
