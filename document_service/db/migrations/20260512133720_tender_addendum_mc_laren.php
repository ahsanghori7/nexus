<?php

declare(strict_types=1);

use Phinx\Migration\AbstractMigration;
use App\Infrastructure\Environment as Env;

final class TenderAddendumMcLaren extends AbstractMigration
{
    protected $mappingAccounts = [
        'production' => [1, 166, 23438, 24297, 26086],
        'uat' => [1, 166, 24297, 26086],
        'staging' => [1, 26089],
        'development' => [1, 166],
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
        $table       = $this->table('document');
        $environment = Env::getValue("ENVIRONMENT", "production");
        $type        = 2; // contractual
        $subtype     = 3; // tender asset
        $customSubtype     = 5; // custom tender
        $name        = "Tender Addendum";

        $sql = "SELECT * FROM document WHERE name = '$name' AND type = $type AND subtype = $subtype";
        $normalTenderAddendum = $this->getAdapter()->fetchRow($sql);

        $data = [
            [
                'name'      => $name,
                'type'      => $type,
                'subtype'   => $customSubtype,
                'status'    => 1,
                's3_key'    => "$environment/templates/tenders/mclaren/tender-addendum.json",
                's3_bucket' => 'document',
                'meta'      => '{"config": {"slug": "mclaren_tender_addendum","version": "1.0"},"document": {"version": "1.0.0"}}'
            ]
        ];

        $table->insert($data)->save();
        $did = $this->getAdapter()->getConnection()->lastInsertId();

        $accounts = $this->mappingAccounts[$environment] ?? [];
        foreach ($accounts as $aid) {
            $this->table('document_owner_mapping')->insert([
                ['owner_id' => $aid, 'document_id' => $did]
            ])->save();
            $this->table('document_owner_mapping')->insert([
                ['owner_id' => $aid, 'document_id' => $normalTenderAddendum['id'], 'hidden' => 1]
            ])->save();
        }
    }
}
