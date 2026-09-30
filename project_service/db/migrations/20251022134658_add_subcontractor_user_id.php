<?php
declare(strict_types=1);

use Phinx\Migration\AbstractMigration;

final class AddSubcontractorUserId extends AbstractMigration
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
    public function up(): void
    {
        $table = $this->table('tender_recommendation');

        if (!$table->hasColumn('subcontractor_user_id')) {
            $table->addColumn('subcontractor_user_id', 'integer', [
                'null' => true,
                'after' => 'author_id'
            ]);
        }

        $table->update();
    }

    public function down(): void
    {
        $table = $this->table('tender_recommendation');

        if ($table->hasColumn('subcontractor_user_id')) {
            $table->removeColumn('subcontractor_user_id');
        }

        $table->update();
    }
}
