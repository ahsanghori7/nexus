<?php
declare(strict_types=1);

use Phinx\Migration\AbstractMigration;

final class AddOrderDraftTenderHistoryStatusTable extends AbstractMigration
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
        $lastId = $this->fetchRow('SELECT id FROM `tender_history_status` ORDER BY id DESC LIMIT 1');
        $data = [
            [
                'id' => intval($lastId['id']) + 1,
                'uid' => 'order_draft',
                'label' => 'Draft',
                'clink_label' => 'Draft',
                'prosper_label' => 'Draft'
            ]
        ];
        $this->table('tender_history_status')->insert($data)->save();
    }
}
