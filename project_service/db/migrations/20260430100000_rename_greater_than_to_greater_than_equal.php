<?php
declare(strict_types=1);

use Phinx\Migration\AbstractMigration;

final class RenameGreaterThanToGreaterThanEqual extends AbstractMigration
{
    public function up(): void
    {
        if ($this->hasTable('approval_level_condition')) {
            $table = $this->table('approval_level_condition');
            $table->changeColumn('threshold_type', 'enum', [
                'values' => ['less_than_equal', 'greater_than_equal', 'between'],
                'null' => false
            ])->update();
        }
    }

    public function down(): void
    {
        if ($this->hasTable('approval_level_condition')) {
            $table = $this->table('approval_level_condition');
            $table->changeColumn('threshold_type', 'enum', [
                'values' => ['less_than_equal', 'greater_than', 'between'],
                'null' => false
            ])->update();
        }
    }
}
