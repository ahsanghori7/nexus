<?php

declare(strict_types=1);

use App\Infrastructure\Environment as Env;
use Phinx\Migration\AbstractMigration;

final class FLCDocument extends AbstractMigration
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
        $subtype     = 5; //custom_tender_asset

        $data = [
            [
                'parent_id' => 0,
                'name' => 'S1-22 - TPR Minor Works Agreement',
                'type' => $type,
                'subtype' => $subtype,
                'status' => 1,
                's3_key' => "$environment/templates/tenders/flc-contractors.json",
                's3_bucket' => 'document',
                'meta' => '{"config": {"slug": "flc_contractors", "version": "1.0"}, "document": {"version": "1.0.0"}}',
            ]
        ];
        $table->insert($data)->save();
    }
}
