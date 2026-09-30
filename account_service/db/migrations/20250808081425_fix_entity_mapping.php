<?php
declare(strict_types=1);

use Phinx\Migration\AbstractMigration;

final class FixEntityMapping extends AbstractMigration
{
    public function up()
    {
        // 1) Drop old FKs and indexes on `mapping`
        $this->table('mapping')
             ->dropForeignKey('account_id')
             ->dropForeignKey('group_id')
             ->dropForeignKey('mapping_type_id')
             ->removeIndexByName('account_group_type')
             ->save();

        // Drop FK on `mapping_entities`
        $this->table('mapping_entities')
             ->dropForeignKey('mapping_type')
             ->save();

        // 2) Rename tables
        $this->table('mapping_type')
             ->rename('attribute_type')
             ->save();

        $this->table('mapping_entities')
             ->rename('attribute')
             ->save();

        $this->table('mapping')
             ->rename('account_attribute_mapping')
             ->save();

        // 3) Rename columns
        $this->table('attribute')
             ->renameColumn('mapping_type', 'attribute_type_id')
             ->save();

        $this->table('account_attribute_mapping')
             ->renameColumn('mapping_type_id', 'attribute_id')
             ->save();

        // 5) Re-add foreign keys
        $this->table('attribute')
             ->addForeignKey(
                 'attribute_type_id',
                 'attribute_type',
                 'id',
                 ['delete'=>'CASCADE','update'=>'CASCADE']
             )
             ->save();

        $this->table('account_attribute_mapping')
             ->addForeignKey(
                 'account_id',
                 'account',
                 'id',
                 ['delete'=>'CASCADE','update'=>'CASCADE']
             )
             ->addForeignKey(
                 'group_id',
                 'account',
                 'id',
                 ['delete'=>'CASCADE','update'=>'CASCADE']
             )
             ->addForeignKey(
                 'attribute_id',
                 'attribute',
                 'id',
                 ['delete'=>'CASCADE','update'=>'CASCADE']
             )
             ->save();
    }

    public function down()
    {
        // Reverse: drop new FKs and index
        $this->table('account_attribute_mapping')
             ->dropForeignKey('attribute_id')
             ->dropForeignKey('overriding_account_id')
             ->dropForeignKey('account_id')
             ->removeIndexByName('ux_aam_account_override_attribute')
             ->save();

        $this->table('attribute')
             ->dropForeignKey('attribute_type_id')
             ->save();

        // Rename columns back
        $this->table('attribute')
             ->renameColumn('attribute_type_id', 'mapping_type')
             ->save();

        $this->table('account_attribute_mapping')
             ->renameColumn('attribute_id', 'mapping_type_id')
             ->renameColumn('overriding_account_id', 'group_id')
             ->save();

        // Rename tables back
        $this->table('attribute_type')
             ->rename('mapping_type')
             ->save();

        $this->table('attribute')
             ->rename('mapping_entities')
             ->save();

        $this->table('account_attribute_mapping')
             ->rename('mapping')
             ->save();

        // Recreate original unique index and FKs
        $this->table('mapping')
             ->addIndex(
                 ['account_id','group_id','mapping_type_id'],
                 ['unique'=>true, 'name'=>'account_group_type']
             )
             ->addForeignKey(
                 'account_id','account','id',
                 ['delete'=>'CASCADE','update'=>'CASCADE']
             )
             ->addForeignKey(
                 'group_id','account','id',
                 ['delete'=>'CASCADE','update'=>'CASCADE']
             )
             ->addForeignKey(
                 'mapping_type_id','mapping_entities','id',
                 ['delete'=>'CASCADE','update'=>'CASCADE']
             )
             ->save();

        $this->table('mapping_entities')
             ->addForeignKey(
                 'mapping_type','mapping_type','id',
                 ['delete'=>'CASCADE','update'=>'CASCADE']
             )
             ->save();
    }
}
