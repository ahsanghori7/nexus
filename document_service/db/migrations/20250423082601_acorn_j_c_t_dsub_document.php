<?php
declare(strict_types=1);

use Phinx\Migration\AbstractMigration;
use App\Infrastructure\Environment as Env;

final class AcornJCTDsubDocument extends AbstractMigration
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
                'name'      => 'JCT DSub 2016 Amendments',
                'type'      => $type,
                'subtype'   => $subtype,
                'status'    => 1,
                's3_key'    => "$environment/templates/orders/acorn-jct-dsub.json",
                's3_bucket' => 'document',
                'meta'      => '{"config": {"slug": "acorn_jct_dsub","version": "1.0"},"document": {"version": "1.0.0"}}'
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
            WHERE name = 'JCT DSub 2016 Amendments'
              AND s3_key = '$environment/templates/orders/acorn-jct-dsub.json'
        ");
    }
}
