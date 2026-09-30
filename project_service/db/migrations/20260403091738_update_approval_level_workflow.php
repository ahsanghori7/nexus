<?php
declare(strict_types=1);

use Phinx\Migration\AbstractMigration;

final class UpdateApprovalLevelWorkflow extends AbstractMigration
{
    public function up(): void
    {
        if ($this->hasTable('approval_level_workflow')) {

            $table = $this->table('approval_level_workflow');
            $table->changeColumn('status', 'enum', [
                    'values' => ['pending', 'in_progress', 'completed'],
                    'default' => 'pending',
                    'null' => false
                ])
                ->addColumn('sort_order', 'integer', ['null' => false, 'after' => 'status'])
                ->addColumn('meta', 'json', ['null' => true, 'after' => 'sort_order'])
                ->update();
        }

    }

    public function down(): void
    {
        $table = $this->table('approval_level_workflow');
        $table->removeColumn('meta')
            ->removeColumn('sort_order')
            ->changeColumn('status', 'enum', [
                'values' => ['in_progress', 'completed'],
                'default' => 'in_progress',
                'null' => false
            ])
            ->update();
    }
}
