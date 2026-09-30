<?php
declare(strict_types=1);

use Phinx\Migration\AbstractMigration;
use App\Infrastructure\Environment as Env;

final class AnzSa2017TenderDocument extends AbstractMigration
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
        // Inserting document
        $table       = $this->table('document');
        $environment = Env::getValue("ENVIRONMENT", "production");
        $type        = 2; //contractual
        $subtype     = 5; //custom tender
        $data = [
            [
                'name'      => 'SA2017 Tender',
                'type'      => $type,
                'subtype'   => $subtype,
                'status'    => 1,
                's3_key'    => "$environment/templates/tenders/anz/anz-sa-2017-tender.json",
                's3_bucket' => 'document',
                'meta'      => '{"config": {"slug": "anz_sa_2017_tender","version": "1.0"},"document": {"version": "1.0.0"}}'
            ]
        ];
        $table->insert($data)->save();
    }
}
