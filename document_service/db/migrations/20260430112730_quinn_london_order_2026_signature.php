<?php

declare(strict_types=1);

use Phinx\Migration\AbstractMigration;
use App\Infrastructure\Environment as Env;

final class QuinnLondonOrder2026Signature extends AbstractMigration
{
    protected $production = "production";
    protected $paulAccountId = 157;
    protected $s3Base = "/templates/orders/quinn-london-july-2025-revision.json";
    protected $type = 2;
    protected $subtype = 6;
    protected $tableName = "document";
    protected $newMetaProp = "signatory";
    protected $order = "quinn_london_february_2026_revision.json";

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
        $base = $environment . $this->s3Base;
        $s3Key = $base . $this->order;
        $sql = "SELECT * FROM document WHERE s3_key = '" . addslashes($s3Key) . "' AND type = " . $this->type . " AND subtype = " . $this->subtype;
        $records = $this->getAdapter()->fetchAll($sql);
        foreach ($records as $record) {
            $meta = json_decode($record['meta'], true);
            if ($meta && is_array($meta)) {
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
