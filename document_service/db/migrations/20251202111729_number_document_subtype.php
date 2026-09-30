<?php

declare(strict_types=1);

use Phinx\Migration\AbstractMigration;

final class NumberDocumentSubtype extends AbstractMigration
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
        $tableName = 'document_subtype';
        $lastRecord = $this->getAdapter()->fetchRow("SELECT id FROM $tableName ORDER BY id DESC LIMIT 1");
        $id = $lastRecord["id"] ?? false;

        if ($id) {
            $data = [
                [
                    'id'    => intval($id) + 1,
                    'uid'   => 'number_document',
                    'label' => 'Number Document',
                ]
            ];

            $this->table('document_subtype')->insert($data)->saveData();
        }
    }
}
