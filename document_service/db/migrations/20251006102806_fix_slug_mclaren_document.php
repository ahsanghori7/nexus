<?php

declare(strict_types=1);

use Phinx\Migration\AbstractMigration;

final class FixSlugMclarenDocument extends AbstractMigration
{

    protected $tableName = 'document';
    protected $fileName = "MCL-COM-SC-700-V0 - JCT DBSub 2024 - HRB";
    protected $slug = 'mcl-com-sc-700-v0-jct-dbsub-2024-hrb';
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
        $sql = "SELECT * FROM " . $this->tableName . " where name LIKE '%" . $this->fileName . "%' AND type = " . $this->type . " AND subtype = " . $this->subtype;
        $allRecords = $this->getAdapter()->fetchAll($sql);
        foreach ($allRecords as $record) {
            $did = $record["id"];
            $meta = json_decode($record["meta"] ?? "", true);
            $meta["config"]["slug"] = $this->slug;
            $this->execute(
                'UPDATE document SET meta = ? WHERE id = ?',
                [json_encode($meta), $did]
            );
        }
    }
}
