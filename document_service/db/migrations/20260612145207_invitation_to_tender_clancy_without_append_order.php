<?php

declare(strict_types=1);

use Phinx\Migration\AbstractMigration;
use App\Infrastructure\Environment as Env;

final class InvitationToTenderClancyWithoutAppendOrder extends AbstractMigration
{

    protected $mappingAccounts = [
        'production' => [26542],
        'uat' => [26542],
        'staging' => [26140],
        'development' => [1],
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
        $table         = $this->table('document');
        $environment   = Env::getValue("ENVIRONMENT", "production");
        $type          = 2; // contractual
        $subtype       = 3; // tender asset
        $customSubtype = 5; // custom tender
        $name          = "Invitation to Tender";

        $sql = "SELECT * FROM document WHERE name = '$name' AND type = $type AND subtype = $subtype";
        $normalInvitationToTender = $this->getAdapter()->fetchRow($sql);

        $data = [
            [
                'name'      => $name,
                'type'      => $type,
                'subtype'   => $customSubtype,
                'status'    => 1,
                's3_key'    => "$environment/templates/tenders/clancy/quick-tender.json",
                's3_bucket' => 'document',
                'meta'      => '{"config": {"slug": "clancy_quick_tender","version": "1.0"},"document": {"version": "1.0.0"}}'
            ]
        ];

        $table->insert($data)->save();
        $did = $this->getAdapter()->getConnection()->lastInsertId();

        $accounts = $this->mappingAccounts[$environment] ?? [];
        foreach ($accounts as $aid) {
            if ($did) {
                $this->table('document_owner_mapping')->insert([
                    ['owner_id' => $aid, 'document_id' => $did]
                ])->save();
            }
            if ($normalInvitationToTender) {
                $this->table('document_owner_mapping')->insert([
                    ['owner_id' => $aid, 'document_id' => $normalInvitationToTender['id'], 'hidden' => 1]
                ])->save();
            }
        }
    }
}
