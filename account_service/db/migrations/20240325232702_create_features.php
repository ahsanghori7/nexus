<?php

declare(strict_types=1);

use Phinx\Migration\AbstractMigration;

final class CreateFeatures extends AbstractMigration
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
        $this->table('feature', $this->commonConfig)
            ->addColumn('id', 'integer', ['identity' => true])
            ->addColumn('parent_id', 'integer', ['null' => true])
            ->addColumn('name', 'string', ['limit' => 255, 'null' => false])
            ->create();

        $this->table('feature')->insert([['name' => 'Docusign']])->update();
        $this->table('feature')->insert([['parent_id' => 1, 'name' => 'Envelopes']])->update();

        $this->table('account_features', $this->commonConfig)
            ->addColumn('id', 'integer', ['identity' => true])
            ->addColumn('account_id', 'integer', ['signed' => true, 'null' => false])
            ->create();

        $this->table('account_features_mapping', $this->commonConfig)
            ->addColumn('id', 'integer', ['identity' => true])
            ->addColumn('account_features_id', 'integer', ['signed' => true, 'null' => false])
            ->addColumn('feature_id', 'integer', ['signed' => true, 'null' => false])
            ->addForeignKey('account_features_id', 'account_features', 'id', ['delete' => 'CASCADE', 'update' => 'CASCADE'])
            ->addForeignKey('feature_id', 'feature', 'id', ['delete' => 'CASCADE', 'update' => 'CASCADE'])
            ->create();

        $this->table('envelope', $this->commonConfig)
            ->addColumn('id', 'integer', ['identity' => true])
            ->addColumn('account_id', 'integer', ['signed' => true])
            ->addColumn('current', 'integer', ['signed' => true, 'default' => 5])
            ->addColumn('envelopes', 'integer', ['signed' => true, 'default' => 5])
            ->addColumn('period', 'string', ['null' => false])
            ->addForeignKey('account_id', 'account', 'id', ['delete' => 'CASCADE', 'update' => 'CASCADE'])
            ->create();
    }
}
