<?php

declare(strict_types=1);

use Phinx\Migration\AbstractMigration;
use App\Infrastructure\Environment as Env;

final class FixS3UrlMclarenDocument extends AbstractMigration
{

    protected $tableName = 'document';
    protected $currentFileName = "mclaren-jct-hrb";
    protected $correctFileName = "2016-mclaren-jct-hrb.json";
    protected $s3Key = "/templates/orders/mclaren/";
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
        $environment = Env::getValue("ENVIRONMENT", "production");
        $sql = "SELECT * FROM " . $this->tableName . " where s3_key LIKE '%" . $this->currentFileName . "%' AND type = " . $this->type . " AND subtype = " . $this->subtype;
        $allRecords = $this->getAdapter()->fetchAll($sql);
        foreach ($allRecords as $record) {
            $did = $record["id"];
            $newS3Key = $environment . $this->s3Key . $this->correctFileName;
            $this->execute(
                'UPDATE document SET s3_key = ? WHERE id = ?',
                [$newS3Key, $did]
            );
        }
    }
}
