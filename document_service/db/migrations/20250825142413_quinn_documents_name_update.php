<?php

declare(strict_types=1);

use Phinx\Migration\AbstractMigration;
use App\Infrastructure\Environment as Env;

final class QuinnDocumentsNameUpdate extends AbstractMigration
{

    protected $nameDocument = "Standard Subcontract Order - July 2025 Revision";
    protected $prefix = "QUINN - ";
    protected $slug = "quinn_london_july_2025_revision";

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
        $prefix = $environment === "development" ? $this->prefix : "";
        $s3KeyDocument = str_replace("_", "-", $this->slug);

        // Insert data
        $data = [
            [
                'name'      => $prefix . $this->nameDocument,
                'type'      => $type,
                'subtype'   => $subtype,
                'status'    => 1,
                's3_key'    => "$environment/templates/orders/$s3KeyDocument.json",
                's3_bucket' => 'document',
                'meta'      => '{"config": {"slug": "' . $this->slug . '","version": "1.0"},"document": {"version": "1.0.0"}}'
            ]
        ];

        $table->insert($data)->save();
        $did = $this->getAdapter()->getConnection()->lastInsertId();

        if ($environment === "development") {
            $this->table('document_owner_mapping')->insert([
                ['owner_id' => 1, 'document_id' => $did],
                ['owner_id' => 166, 'document_id' => $did]
            ])->save();
        }
    }

    /**
     * Migrate Down.
     */
    public function down(): void
    {
        $environment = Env::getValue("ENVIRONMENT", "production");
        $prefix = $environment === "development" ? $this->prefix : "";
        $s3KeyDocument = str_replace("_", "-", $this->slug);

        // Delete the specific row
        $this->execute("
            DELETE FROM document
            WHERE name = '$prefix . $this->nameDocument'
              AND s3_key = '$environment/templates/orders/$s3KeyDocument.json'
        ");
    }
}
