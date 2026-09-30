<?php

declare(strict_types=1);

use Phinx\Migration\AbstractMigration;

final class UpdateMcLarenTenders extends AbstractMigration
{
    protected $tableName = 'document';
    protected $mclaren = "mclaren";
    protected $goodMclarenWord = "McLaren";
    protected $type = 2;
    protected $subtype = 5;

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
        $sql = "SELECT * FROM " . $this->tableName . " where meta LIKE '%" . $this->mclaren . "%' AND type = " . $this->type . " AND subtype = " . $this->subtype;
        $allRecords = $this->getAdapter()->fetchAll($sql);

        foreach ($allRecords as $record) {

            if (strpos($record["name"], $this->mclaren) !== false) {
                $newName = str_replace($this->mclaren, $this->goodMclarenWord, $record["name"]);
            } else {
                $newName = $this->goodMclarenWord . " - " . $record["name"];
            }

            $did = $record["id"];
            $this->execute(
                'UPDATE document SET name = ? WHERE id = ?',
                [$newName, $did]
            );
        }
    }
}
