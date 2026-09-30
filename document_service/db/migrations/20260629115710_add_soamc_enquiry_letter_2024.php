<?php

declare(strict_types=1);

use Phinx\Migration\AbstractMigration;
use App\Infrastructure\Environment as Env;

final class AddSoamcEnquiryLetter2024 extends AbstractMigration
{
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

        $s3Key = "/templates/tenders/mclaren/mcLaren-enquiry-letter-2024.json";
        $subtype = 5;
        $type = 2;

        $sql = "SELECT * FROM document WHERE s3_key = '" . $environment . $s3Key . "' AND type = " . $type . " AND subtype = " . $subtype;
        $record = $this->getAdapter()->fetchRow($sql);
        $meta = json_decode($record['meta'], true);
        if ($meta && is_array($meta)) {
            $did = $record['id'];
            $meta["soamc"] = true;
            $metaUpdated = json_encode($meta, JSON_UNESCAPED_UNICODE);
            $this->execute("
                UPDATE document
                SET meta = '" . addslashes($metaUpdated) . "'
                WHERE id = {$did}
            ");
        }
    }
}
