<?php

declare(strict_types=1);

use Phinx\Migration\AbstractMigration;

final class AddSignatoryToDomesticShortOrderMinorWorks extends AbstractMigration
{
    protected $type = 2;
    protected $subtype = 6;
    protected $tableName = "document";
    protected $orderName = "Domestic Short Order for Minor Works";

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
        $sql = "SELECT * FROM document WHERE name LIKE '" . $this->orderName . "' AND type = " . $this->type . " AND subtype = " . $this->subtype;
        $record = $this->getAdapter()->fetchRow($sql);
        if ($record) {
            $meta = json_decode($record['meta'], true);
            if ($meta && is_array($meta)) {
                $meta['signatory'] = true;
                $did = $record['id'];
                $metaUpdated = json_encode($meta, JSON_UNESCAPED_UNICODE);
                $this->execute("
                    UPDATE {$this->tableName}
                    SET meta = '" . $metaUpdated . "'
                    WHERE id = {$did}
                ");
            }
        }
    }
}
