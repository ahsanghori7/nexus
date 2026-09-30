<?php
declare(strict_types=1);

use Phinx\Migration\AbstractMigration;

final class UpdateApprovalLevelTable extends AbstractMigration
{
    public function up(): void
    {
        if ($this->hasTable('approval_level')) {
            $table = $this->table('approval_level');
            $table->addColumn('label', 'string', ['limit' => 255, 'after' => 'is_threshold'])
                ->update();
        }
    }

    public function down(): void
    {
        if ($this->hasTable('approval_level')) {
            $table = $this->table('approval_level');
            $table->removeColumn('label')
                ->update();
        }
    }
}
