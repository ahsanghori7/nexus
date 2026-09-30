<?php

declare(strict_types=1);

use Phinx\Migration\AbstractMigration;

final class UpdateBoqBudgetValues extends AbstractMigration
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
        $this->table('boq_item_mapping')
            ->renameColumn('budget', 'budget_rate')
            ->changeColumn('budget_rate', 'decimal', ['precision' => 12, 'scale' => 2, 'null' => true, 'default' => null])
            ->update();

        $this->table('boq_item_mapping')
            ->addColumn('budget_total', 'decimal', ['precision' => 12, 'scale' => 2, 'null' => true, 'after' => 'budget_rate'])
            ->update();
    }
}
