<?php

declare(strict_types=1);

use Phinx\Migration\AbstractMigration;
use App\Infrastructure\Environment as Env;

final class RemoveMcHrbTemplates extends AbstractMigration
{

    protected $production = "production";
    protected $s3Base = "/templates/orders/mclaren/";
    protected $type = 2;
    protected $subtype = 6;
    protected $orders = [
        "2016-mclaren-jct-hrb.json",
        "mcl-com-sc-700-v0-jct-dbsub-2024-hrb.json",
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

        $sql = "SELECT * FROM document
            WHERE s3_key IN (" . implode(',', $values) . ")
            AND type = " . $this->type . "
            AND subtype = " . $this->subtype;

        $allRecords = $this->getAdapter()->fetchAll($sql);

        foreach ($allRecords as $record) {
            $did = $record['id'];
            if ($did) {
                // Remove the document owner mapping for this document
                $this->execute("
                    DELETE FROM document_owner_mapping
                    WHERE document_id = {$did}
                ");

                // Update the document record to
                $status = 3; // 3 => Archived
                $this->execute("
                    UPDATE document
                    SET status = '" . $status . "'
                    WHERE id = {$did}
                ");
            }
        }
    }
}
