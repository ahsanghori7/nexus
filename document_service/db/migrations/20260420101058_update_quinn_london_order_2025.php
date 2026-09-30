<?php

declare(strict_types=1);

use Phinx\Migration\AbstractMigration;
use App\Infrastructure\Environment as Env;

final class UpdateQuinnLondonOrder2025 extends AbstractMigration
{
    protected $production = "production";
    protected $uat = "uat";
    protected $type = 2;
    protected $subtype = 6;
    protected $tableName = "document";
    protected $newS3Key = "templates/orders/quinn/quinn_london_february_2026_revision.json";
    protected $newVersion = "2.0";
    protected $orderName = "Quinn - Standard Subcontract Order - July 2025 Revision";
    protected $newOrderName = "Quinn - Standard Subcontract Order - February 2026 Revision";

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
        $sql = "SELECT * FROM document WHERE name LIKE '" . $this->orderName . "' AND type = " . $this->type . " AND subtype = " . $this->subtype;
        $record = $this->getAdapter()->fetchRow($sql);
        if ($record) {
            $meta = json_decode($record['meta'], true);
            if ($meta && is_array($meta)) {
                $config = $meta['config'] ?? [];
                $config['version'] = $this->newVersion;
                $meta['config'] = $config;
                $did = $record['id'];
                $metaUpdated = json_encode($meta, JSON_UNESCAPED_UNICODE);
                $this->execute("
                    UPDATE {$this->tableName}
                    SET meta = '" . $metaUpdated . "', name = '" . $this->newOrderName . "', s3_key = '" . $environment . "/" . $this->newS3Key . "'
                    WHERE id = {$did}
                ");
            }
        }
    }
}
