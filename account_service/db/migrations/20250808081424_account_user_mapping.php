<?php
declare(strict_types=1);

use Phinx\Migration\AbstractMigration;

final class AccountUserMapping extends AbstractMigration
{
    public function up(): void
    {
        // Drop old tables if they exist
        if ($this->hasTable('account_user_mapping')) {
            $this->table('account_user_mapping')->drop()->save();
        }
        if ($this->hasTable('account_user_mapping_type')) {
            $this->table('account_user_mapping_type')->drop()->save();
        }

        //
        // 1) Create the mapping-type lookup table (disable default id)
        //
        $this->table('account_user_mapping_type', [
                'id'          => false,
                'primary_key' => ['id'],
        ])
            ->addColumn('id',   'integer', ['identity' => true])
            ->addColumn('label', 'string',  ['limit' => 100, 'null' => false])
            ->addIndex(['label'], ['unique' => true])
            ->create();

        // Seed our one mapping type
        $this->table('account_user_mapping_type')
             ->insert([ ['label' => 'supply_chain'] ])
             ->saveData();

        //
        // 2) Create the normalized mapping table (disable default id)
        //
        $this->table('account_user_mapping', [
                'id'          => false,
                'primary_key' => ['id'],
        ])
            ->addColumn('id',              'integer', ['identity' => true])
            ->addColumn('user_id',         'integer', ['null' => true])
            ->addColumn('account_id',      'integer', ['null' => false])
            ->addColumn('mapping_type_id', 'integer', ['null' => false])
            ->addIndex(['user_id'])
            ->addIndex(['account_id'])
            ->addIndex(['mapping_type_id'])
            ->addForeignKey('user_id',          'user',                       'id', ['delete'=>'SET_NULL','update'=>'NO_ACTION'])
            ->addForeignKey('account_id',       'account',                    'id', ['delete'=>'CASCADE',   'update'=>'NO_ACTION'])
            ->addForeignKey('mapping_type_id',  'account_user_mapping_type', 'id', ['delete'=>'RESTRICT',  'update'=>'NO_ACTION'])
            ->create();

        //
        // 3) Seed from supply_chain → user
        //
        $this->execute(<<<'SQL'
            INSERT INTO account_user_mapping (user_id, account_id, mapping_type_id)
                SELECT
                    umin.user_id, -- first user (lowest id) per child account
                    sc.parent_id,
                    mut.id
                FROM supply_chain AS sc
                JOIN (
                    SELECT account_id, MIN(id) AS user_id
                    FROM `user`
                    GROUP BY account_id
                ) AS umin
                ON umin.account_id = sc.child_id
                JOIN account_user_mapping_type AS mut
                ON mut.label = 'supply_chain';
        SQL
        );
    }

    public function down(): void
    {
        if ($this->hasTable('account_user_mapping')) {
            $this->table('account_user_mapping')->drop()->save();
        }
        if ($this->hasTable('account_user_mapping_type')) {
            $this->table('account_user_mapping_type')->drop()->save();
        }
    }
}
