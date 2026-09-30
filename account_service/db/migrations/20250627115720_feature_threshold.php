<?php
declare(strict_types=1);

use Phinx\Migration\AbstractMigration;

final class FeatureThreshold extends AbstractMigration
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
        $thresholdTable = $this->table('approval_thresholds', ['id' => false, 'primary_key' => 'id']);
        $thresholdTable->addColumn('id', 'integer', ['signed' => true, 'identity' => true])
            ->addColumn('account_id', 'integer', ['signed' => true])
            ->addColumn('from_value', 'decimal', ['precision' => 10, 'scale' => 2])
            ->addColumn('to_value', 'decimal', ['precision' => 10, 'scale' => 2])
            ->addColumn('created_at', 'timestamp', ['default' => 'CURRENT_TIMESTAMP'])
            ->addColumn('updated_at', 'timestamp', ['default' => 'CURRENT_TIMESTAMP'])
            ->addForeignKey('account_id', 'account', 'id', ['delete' => 'CASCADE', 'update' => 'CASCADE'])
            ->create();

        $userThresholdTable = $this->table('approval_thresholds_user_mapping', ['id' => false, 'primary_key' => 'id']);
        $userThresholdTable->addColumn('id', 'integer', ['signed' => true, 'identity' => true])
            ->addColumn('user_id', 'integer', ['signed' => true])
            ->addColumn('approval_threshold_id', 'integer', ['signed' => true])
            ->addColumn('can_approve_all', 'boolean', ['default' => 0, 'null' => false])
            ->addColumn('is_restricted', 'boolean', ['default' => 0, 'null' => false])
            ->addColumn('created_at', 'timestamp', ['default' => 'CURRENT_TIMESTAMP'])
            ->addColumn('updated_at', 'timestamp', ['default' => 'CURRENT_TIMESTAMP'])
            ->addForeignKey('user_id', 'user', 'id', ['delete' => 'CASCADE', 'update' => 'CASCADE'])
            ->addForeignKey('approval_threshold_id', 'approval_thresholds', 'id', ['delete' => 'CASCADE', 'update' => 'CASCADE'])
            ->addindex(['user_id'], ['unique' => false, 'name' => 'idx_user_thresholds_user_id'])
            ->create();
    }
}
