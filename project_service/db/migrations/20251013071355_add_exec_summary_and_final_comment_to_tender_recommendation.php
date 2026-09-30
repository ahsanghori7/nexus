<?php
declare(strict_types=1);

use Phinx\Migration\AbstractMigration;

final class AddExecSummaryAndFinalCommentToTenderRecommendation extends AbstractMigration
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

        if (!$table->hasColumn('exec_summary')) {
            $table->addColumn('exec_summary', 'text', [
                'null' => true,
                'after' => 'author_id'
            ]);
        }

        if (!$table->hasColumn('final_comment')) {
            $table->addColumn('final_comment', 'text', [
                'null' => true,
                'after' => 'exec_summary'
            ]);
        }

        $table->update();
    }

    public function down(): void
    {
        $table = $this->table('tender_recommendation');

        if ($table->hasColumn('exec_summary')) {
            $table->removeColumn('exec_summary');
        }

        if ($table->hasColumn('final_comment')) {
            $table->removeColumn('final_comment');
        }

        $table->update();
    }
}
