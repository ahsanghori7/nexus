<?php

declare(strict_types=1);

use Phinx\Migration\AbstractMigration;
use App\Infrastructure\Environment as Env;

final class AddNumberDocumentIntoMetaOrders extends AbstractMigration
{
    protected $production = "production";
    protected $s3Base = "/templates/orders/mclaren/";
    protected $type = 2;
    protected $subtype = 6;
    protected $tableName = "document";
    protected $newMetaProp = "number_document";
    protected $orders = [
        "2016-mclaren-jct-hrb.json",
        "2016-mclaren-jct.json",
        "domestic-short-order.json",
        "long-form-consultant-appointment.json",
        "mcl-com-sc-700-v0-jct-dbsub-2024-hrb.json",
        "mcl-com-sc-700-v0-jct-dbsub-2024.json",
        "mclaren-short-form-consultant-appointment.json"
    ];

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
        $base = $environment . '/templates/orders/mclaren/';
        $values = array_map(
            fn($o) => "'" . $base . $o . "'",
            $this->orders
        );
        $sql = "SELECT * FROM document WHERE s3_key IN (" . implode(',', $values) . ") AND type = " . $this->type . " AND subtype = " . $this->subtype;
        $allRecords = $this->getAdapter()->fetchAll($sql);
        foreach ($allRecords as $record) {
            $meta = json_decode($record['meta'], true);
            if (is_array($meta)) {
                $did = $record['id'];
                $meta[$this->newMetaProp] = true;
                $metaUpdated = json_encode($meta, JSON_UNESCAPED_UNICODE);
                $this->execute("
                    UPDATE {$this->tableName}
                    SET meta = '" . addslashes($metaUpdated) . "'
                    WHERE id = {$did}
                ");
            }
        }
    }
}
