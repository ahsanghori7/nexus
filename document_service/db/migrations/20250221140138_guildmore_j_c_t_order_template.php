<?php
declare(strict_types=1);

use Phinx\Migration\AbstractMigration;
use App\Infrastructure\Environment as Env;

final class GuildmoreJCTOrderTemplate extends AbstractMigration
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
                'name'      => 'JCT Design and Build Sub-Contract 2024 - NON-HRB',
                'type'      => $type,
                'subtype'   => $subtype,
                'status'    => 1,
                's3_key'    => "$environment/templates/orders/guildmore-jtc-design-build-subcontract.json",
                's3_bucket' => 'document',
                'meta'      => '{"config": {"slug": "guildmore_jct_order_d_&_b_non_hrb","version": "1.0"},"document": {"version": "1.0.0"}}'
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
            WHERE name = 'JCT Design and Build Sub-Contract 2024 - NON-HRB'
              AND s3_key = '$environment/templates/orders/guildmore-jtc-design-build-subcontract.json'
        ");
    }
}
