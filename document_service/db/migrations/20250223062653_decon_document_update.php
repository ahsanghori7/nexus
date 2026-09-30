<?php

declare(strict_types=1);

use Phinx\Migration\AbstractMigration;
use App\Infrastructure\Environment as Env;

final class DeconDocumentUpdate extends AbstractMigration
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
        $table       = $this->table('document');
        $environment = Env::getValue("ENVIRONMENT", "production");
        $documentName = 'Decon - Purchase Order (Dynamic)';
        $type        = 2; // contractual
        $subtype     = 6; // custom order
        // Insert data
        $data = [
            [
                'name'      => $documentName,
                'type'      => $type,
                'subtype'   => $subtype,
                'status'    => 1,
                's3_key'    => "$environment/templates/orders/decon-pm-purchase-dynamic.json",
                's3_bucket' => 'document',
                'meta'      => '{"config":{"slug":"defcon_po_dynamic","version":"1.0"},"document":{"version":"1.0.0"},"simpleRowQuotePrice":true}'
            ]
        ];

        $table->insert($data)->save();

        $searchDocumentName = "decon";
        $docs = $this->fetchAll('SELECT * FROM document where name LIKE "%' . $searchDocumentName . '%" AND subtype = ' . $subtype);
        $lastId = 0;
        $docs = array_filter($docs, function ($doc) use ($documentName, &$lastId) {
            if ($doc["name"] === $documentName) {
                $lastId = $doc["id"];
            }
            return $doc["name"] !== $documentName;
        });
        if ($docs) {
            $doc = array_shift($docs);
            if ($doc) {
                $results = $this->fetchAll('SELECT * FROM document_owner_mapping where document_id = ' . $doc["id"]);
                foreach ($results as $result) {
                    $ownerData = [
                        "owner_id" => $result["owner_id"],
                        "document_id" => $lastId,
                    ];
                    $this->table('document_owner_mapping')->insert($ownerData)->save();
                }
            }
        }
    }
}
