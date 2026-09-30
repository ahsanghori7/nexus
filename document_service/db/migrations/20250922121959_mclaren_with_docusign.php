<?php

declare(strict_types=1);

use Phinx\Migration\AbstractMigration;
use App\Infrastructure\Environment as Env;

final class MclarenWithDocusign extends AbstractMigration
{
    protected $production = 'production';
    protected $tableName = 'document';
    protected $prefix = 'Mclaren';
    protected $documentName = 'Short Form Consultant Appointment';
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
        $sql = "SELECT * FROM " . $this->tableName . " where name LIKE '%" . $this->documentName . "%' AND subtype = " . $this->subtype . " AND type = " . $this->type;
        $allRecords = $this->getAdapter()->fetchAll($sql);

        $environment = Env::getValue("ENVIRONMENT", $this->production);

        foreach ($allRecords as $record) {
            $did = $record["id"];
            $name = $environment !== $this->production ? $this->prefix . " - " . $record["name"] : $record["name"];
            $s3Key = "$environment/templates/orders/mclaren/mclaren-short-form-consultant-appointment.json";
            $json = $record["meta"];
            $meta = json_decode($json, true);
            $meta["signatory"] = true;
            $newMeta = json_encode($meta);

            $this->execute(
                'UPDATE document SET meta = ?, name = ?, s3_key = ? WHERE id = ?',
                [$newMeta, $name, $s3Key, $did]
            );
        }
    }
}
