<?php
declare(strict_types=1);

use Phinx\Migration\AbstractMigration;
use App\Infrastructure\Environment as Env;

final class LeoLyncIrishLaw extends AbstractMigration
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
        $type        = 2; // contractual
        $subtype     = 6; // custom order

        // Insert data
        $data = [
            [
                'name'      => 'LEO LYNCH - SUB CONTRACT - IRISH LAW',
                'type'      => $type,
                'subtype'   => $subtype,
                'status'    => 1,
                's3_key'    => "$environment/templates/orders/leo-sub-contract-irish-law.json",
                's3_bucket' => 'document',
                'meta'      => '{"config": {"slug": "leo_subcontract_irish_law","version": "1.0"},"document": {"version": "1.0.0"}}'
            ]
        ];

        $table->insert($data)->save();
    }

    /**
     * Migrate Down.
     */
    public function down(): void
    {
        $environment = Env::getValue("ENVIRONMENT", "production");

        // Delete the specific row
        $this->execute("
            DELETE FROM document
            WHERE name = 'LEO LYNCH - SUB CONTRACT - IRISH LAW'
              AND s3_key = '$environment/templates/orders/leo-sub-contract-irish-law.json'
        ");
    }
}
