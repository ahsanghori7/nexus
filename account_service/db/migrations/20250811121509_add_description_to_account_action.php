<?php
declare(strict_types=1);

use Phinx\Migration\AbstractMigration;

final class AddDescriptionToAccountAction extends AbstractMigration
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
        $table = $this->table('account_action');
        if (!$table->hasColumn('description')) {
            $table->addColumn('description', 'text', [
                'null' => true,
                'default' => null,
                'after' => 'action_type'
            ])->update();
        }

    }

    public function down(): void
    {
        // Remove description column
        $table = $this->table('account_action');
        $table->removeColumn('description')
        ->update();
    }
}
