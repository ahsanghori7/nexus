<?php

declare(strict_types=1);

use Phinx\Migration\AbstractMigration;
use App\Infrastructure\Environment as Env;

final class MclarenTenderRemoveWording extends AbstractMigration
{
    protected $production = 'production';
    protected $tableName = "document";
    protected $fileName = "Enquiry Letter Wording";
    protected $newFileName = "Enquiry Letter";
    protected $prefix = "McLaren";
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
        $environment = Env::getValue("ENVIRONMENT", $this->production);
        $sql = "SELECT * FROM " . $this->tableName . " where name LIKE '%" . $this->fileName . "%' AND type = " . $this->type . " AND subtype = " . $this->subtype;
        $allRecords = $this->getAdapter()->fetchAll($sql);
        foreach ($allRecords as $record) {
            $did = $record["id"];
            $name = $environment !== $this->production ? $this->prefix . " - " . $this->newFileName : $this->newFileName;
            $this->execute(
                'UPDATE document SET name = ? WHERE id = ?',
                [$name, $did]
            );
        }
    }
}
