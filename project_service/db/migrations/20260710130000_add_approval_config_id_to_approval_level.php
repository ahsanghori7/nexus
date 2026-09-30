<?php

declare(strict_types=1);

use Phinx\Migration\AbstractMigration;

final class AddApprovalConfigIdToApprovalLevel extends AbstractMigration
{
    public function up(): void
    {
        $table = $this->table('approval_level');

        if (!$table->hasColumn('approval_config_id')) {
            $table
                ->addColumn('approval_config_id', 'integer', [
                    'signed' => true,
                    'null' => true,
                    'after' => 'id',
                ])
                ->update();
        }

        if ($table->hasColumn('account_id') && $table->hasColumn('approval_type_id')) {
            $this->execute(<<<'SQL'
UPDATE approval_level al
INNER JOIN approval_configuration ac
  ON ac.account_id = al.account_id
 AND ac.approval_type_id = al.approval_type_id
SET al.approval_config_id = ac.id
WHERE al.approval_config_id IS NULL
SQL);
        }

        $this->execute('ALTER TABLE approval_level MODIFY COLUMN approval_config_id INT NOT NULL');

        $table = $this->table('approval_level');
        if (!$table->hasForeignKey('approval_config_id')) {
            $table
                ->addForeignKey('approval_config_id', 'approval_configuration', 'id', [
                    'delete' => 'CASCADE',
                    'update' => 'NO_ACTION',
                ])
                ->update();
        }
        if (!$table->hasIndex(['approval_config_id'])) {
            $table
                ->addIndex(['approval_config_id'])
                ->update();
        }

        $table = $this->table('approval_level');
        if ($table->hasForeignKey('approval_type_id')) {
            $table->dropForeignKey('approval_type_id')->update();
        }
        if ($table->hasIndex(['account_id'])) {
            $table->removeIndex(['account_id'])->update();
        }
        foreach (['account_id', 'approval_type_id', 'threshold_type', 'from_value', 'to_value'] as $column) {
            if ($table->hasColumn($column)) {
                $table->removeColumn($column)->update();
            }
        }
    }

    public function down(): void
    {
        $table = $this->table('approval_level');

        if (!$table->hasColumn('account_id')) {
            $table
                ->addColumn('account_id', 'integer', [
                    'signed' => true,
                    'null' => true,
                    'after' => 'id',
                ])
                ->update();
        }
        if (!$table->hasColumn('approval_type_id')) {
            $table
                ->addColumn('approval_type_id', 'integer', [
                    'signed' => true,
                    'null' => true,
                    'after' => 'account_id',
                ])
                ->update();
        }
        if (!$table->hasColumn('threshold_type')) {
            $table
                ->addColumn('threshold_type', 'enum', [
                    'values' => ['less_than_equal', 'greater_than', 'between'],
                    'null' => true,
                ])
                ->update();
        }
        if (!$table->hasColumn('from_value')) {
            $table
                ->addColumn('from_value', 'integer', [
                    'null' => true,
                ])
                ->update();
        }
        if (!$table->hasColumn('to_value')) {
            $table
                ->addColumn('to_value', 'integer', [
                    'null' => true,
                ])
                ->update();
        }

        if ($table->hasColumn('approval_config_id')) {
            $this->execute(<<<'SQL'
UPDATE approval_level al
INNER JOIN approval_configuration ac ON ac.id = al.approval_config_id
SET al.account_id = ac.account_id,
    al.approval_type_id = ac.approval_type_id
WHERE al.account_id IS NULL
   OR al.approval_type_id IS NULL
SQL);
        }

        $this->execute('ALTER TABLE approval_level MODIFY COLUMN account_id INT NOT NULL');
        $this->execute('ALTER TABLE approval_level MODIFY COLUMN approval_type_id INT NOT NULL');

        $table = $this->table('approval_level');
        if (!$table->hasForeignKey('approval_type_id')) {
            $table
                ->addForeignKey('approval_type_id', 'approval_type', 'id', [
                    'delete' => 'CASCADE',
                    'update' => 'NO_ACTION',
                ])
                ->update();
        }
        if (!$table->hasIndex(['account_id'])) {
            $table
                ->addIndex(['account_id'])
                ->update();
        }

        if ($table->hasForeignKey('approval_config_id')) {
            $table->dropForeignKey('approval_config_id')->update();
        }
        if ($table->hasIndex(['approval_config_id'])) {
            $table->removeIndex(['approval_config_id'])->update();
        }
        if ($table->hasColumn('approval_config_id')) {
            $table->removeColumn('approval_config_id')->update();
        }
    }
}
