<?php
declare(strict_types=1);

use Phinx\Migration\AbstractMigration;

final class AddNewMilestonesInMilestoneTable extends AbstractMigration
{
    public function up(): void
    {
        // Shift existing milestones to make room for the new sort orders.
        $this->execute('UPDATE milestone SET sort_order = sort_order + 2 WHERE sort_order >= 7');
        $this->execute('UPDATE milestone SET sort_order = sort_order + 1 WHERE sort_order BETWEEN 3 AND 6');

        $this->table('milestone')
            ->insert([
                ['label' => 'Tender design and OPS', 'feature_label' => 'TENDER_DESIGN_AND_OPS', 'is_required' => 0, 'sort_order' => 3, 'type' => 'manual'],
                ['label' => 'Approval of Amendments', 'feature_label' => 'APPROVAL_OF_AMENDMENTS', 'is_required' => 0, 'sort_order' => 8, 'type' => 'manual']
            ])
            ->save();
    }
}
