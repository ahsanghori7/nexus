<?php
declare(strict_types=1);

use Phinx\Migration\AbstractMigration;
use App\Infrastructure\Environment as Env;

final class EsdV3Document extends AbstractMigration
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
        // Inserting data
        $table       = $this->table('document');
        $environment = Env::getValue("ENVIRONMENT", "production");
        $type        = 2; //contractual
        $subtype     = 6; //custom order
        $data = [
            [
                'name'      => 'ESD NEC3 Terms and Conditions Option A',
                'type'      => $type,
                'subtype'   => $subtype,
                'status'    => 1,
                's3_key'    => "$environment/templates/orders/esd-bespoke/esd-third-document.json",
                's3_bucket' => 'document',
                'meta'      => '{"config": {"slug": "esd_v3", "version": "1.0"}, "document": {"version": "1.0.0"}, "attachments": true, "soa": true}'
            ]
        ];
        $table->insert($data)->save();
    }
}
