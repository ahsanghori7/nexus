<?php
declare(strict_types=1);

use Phinx\Migration\AbstractMigration;
use App\Infrastructure\Environment as Env;

final class CulenaLetterOfIntentDocument extends AbstractMigration
{
    /**
     * Migrate Up.
     */
    public function up(): void
    {
        $table       = $this->table('document');
        $environment = Env::getValue("ENVIRONMENT", "production");
        $type        = 2; // contractual
        $subtype     = 6; // custom tender

        // Insert data
        $data = [
            [
                'name'      => 'Letter of Intent',
                'type'      => $type,
                'subtype'   => $subtype,
                'status'    => 1,
                's3_key'    => "$environment/templates/orders/culena-london-intent-letter.json",
                's3_bucket' => 'document',
                    'meta'      => '{"config": {"slug": "signatory_culena_london_intent_letter","version": "1.0"},"document": {"version": "1.0.0"},"signatory": true}'
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
            WHERE name = 'Letter of Intent'
              AND s3_key = '$environment/templates/orders/culena-london-intent-letter.json'
        ");
    }
}
