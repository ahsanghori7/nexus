<?php
declare(strict_types=1);

use Phinx\Migration\AbstractMigration;

final class UpdateBoqTransactionNote extends AbstractMigration
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
        $this->table('boq_quote_item')
            ->removeColumn('note_id')
            ->dropForeignKey(['note_id', 'boq_note', 'id'])
            ->update();

        $this->table('transaction')
            ->addColumn('note', 'text', ['null' => true, 'after' => 'meta'])
            ->update();
    }
}
