<?php
declare(strict_types=1);

use Phinx\Migration\AbstractMigration;
use App\Infrastructure\Environment as Env;

final class JctIntermediateBuildingContractDocusign extends AbstractMigration
{
    /**
     * Migrate Up.
     */
    public function up(): void
    {
        $table       = $this->table('document');
        $environment = Env::getValue("ENVIRONMENT", "production");
        $type        = 2; // contractual
        $subtype     = 6; // custom order

        // Insert data
        $data = [
            [
                'name'      => 'JCT Intermediate Building Contract 2016 with Amendments Order',
                'type'      => $type,
                'subtype'   => $subtype,
                'status'    => 1,
                's3_key'    => "$environment/templates/orders/signatory/jct-intermediate-building-contract-2016-with-amendments-order.json",
                's3_bucket' => 'document',
                'meta'      => '{"config": {"slug": "signatory_jct_order_s_&_b","version": "1.0"},"document": {"version": "1.0.0"}}'
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
            WHERE name = 'JCT Intermediate Building Contract 2016 with Amendments Order'
              AND s3_key = '$environment/templates/orders/signatory/jct-intermediate-building-contract-2016-with-amendments-order.json'
        ");
    }
}
