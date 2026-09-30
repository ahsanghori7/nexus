<?php

declare(strict_types=1);

use Phinx\Migration\AbstractMigration;

final class MclarenNamesUpdate extends AbstractMigration
{

    protected $production = 'production';
    protected $tableName = 'document';
    protected $documentName = 'Domestic Short Order for Minor Works';
    protected $mclarenMeta1 = 'mclaren';
    protected $mclarenMeta2 = 'mlc';
    protected $newDocumentName = 'Mclaren - Domestic Short Order for Minor Works';
    protected $type = 2;
    protected $subtype = 6;
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
        $sql = "SELECT * FROM " . $this->tableName . " where name LIKE '%" . $this->documentName . "%' AND subtype = " . $this->subtype . " AND type = " . $this->type . ' AND meta LIKE "%' . $this->mclarenMeta1 . '%" OR meta LIKE "%' . $this->mclarenMeta2 . '%"';
        $allRecords = $this->getAdapter()->fetchAll($sql);

        foreach ($allRecords as $record) {
            $did = $record["id"];
            $this->execute(
                'UPDATE document SET name = ? WHERE id = ?',
                [$this->newDocumentName, $did]
            );
        }
    }
}
