<?php

declare(strict_types=1);

use Phinx\Migration\AbstractMigration;
use App\Infrastructure\Environment as Env;

final class AddSoaMclarenDocs extends AbstractMigration
{
    // IDs checked in databases for each environment
    protected $accounts = [
        "development" => [1, 166],
        "staging" => [1, 26089],
        "uat" => [1, 166, 24297, 26086],
        "production" => [1, 166, 23438, 24297, 26086]
    ];

    // Key => subtype | Value => s3_key
    protected $documents = [
        5 => "/templates/tenders/mclaren/enquiry-letter-wording-clink-mark-up.json",
        6 => "/templates/orders/mclaren/2016-mclaren-jct.json"
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
        $environment = Env::getValue("ENVIRONMENT", "production");

        $tableName = 'document_subtype';
        $lastRecord = $this->getAdapter()->fetchRow("SELECT id FROM $tableName ORDER BY id DESC LIMIT 1");
        $subtype = $lastRecord["id"] ?? false;

        if ($subtype) {
            $data = [
                [
                    'id'    => intval($subtype) + 1,
                    'uid'   => 'soamc_asset',
                    'label' => 'Soa McLaren Assets',
                ],
            ];
            $this->table($tableName)->insert($data)->saveData();
        }

        $type = 2;
        $tableName = 'document';
        $data = [
            [
                'parent_id' => 0,
                'name'      => 'McLaren - Schedule of Attendances',
                'type'      => $type,
                'subtype'   => $subtype,
                'status'    => 1,
                's3_key'    => "$environment/templates/soa/mclaren-schedule-of-attendances.json",
                's3_bucket' => 'document',
                'meta'      => '[]'
            ]
        ];
        $this->table($tableName)->insert($data)->save();
        $did = $this->getAdapter()->getConnection()->lastInsertId();

        foreach ($this->accounts[$environment] as $aid) {
            $this->table('document_owner_mapping')->insert([
                ['owner_id' => $aid, 'document_id' => $did]
            ])->save();
        }

        foreach ($this->documents as $subtype => $s3Key) {
            $sql = "SELECT * FROM document WHERE s3_key = '" . $environment . $s3Key . "' AND type = " . $type . " AND subtype = " . $subtype;
            $record = $this->getAdapter()->fetchRow($sql);
            if ($record) {
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
    }
}
