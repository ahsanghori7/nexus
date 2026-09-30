<?php
declare(strict_types=1);

use Phinx\Migration\AbstractMigration;
use App\Infrastructure\Environment as Env;

final class MclarenEnquiryLetter2024 extends AbstractMigration
{
    // IDs checked in databases for each environment
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
        $type        = 2;
        $subtype     = 5;
        $name        = "McLaren Enquiry Letter 2024";

        $data = [
            [
                'name'      => $name,
                'type'      => $type,
                'subtype'   => $subtype,
                'status'    => 1,
                's3_key'    => "$environment/templates/tenders/mclaren/mcLaren-enquiry-letter-2024.json",
                's3_bucket' => 'document',
                'meta'      => '{"config": {"slug": "mclaren_enquiry_letter","version": "1.1"},"document": {"version": "1.0.0"}, "number_document":true}'            ]
        ];

        $table->insert($data)->save();
        $did = $this->getAdapter()->getConnection()->lastInsertId();

        $accounts = $this->mappingAccounts[$environment] ?? [];
        foreach ($accounts as $aid) {
            $this->table('document_owner_mapping')->insert([
                ['owner_id' => $aid, 'document_id' => $did]
            ])->save();
        }
    }
}
