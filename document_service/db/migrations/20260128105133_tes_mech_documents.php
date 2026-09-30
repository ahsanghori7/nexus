<?php

declare(strict_types=1);

use Phinx\Migration\AbstractMigration;
use App\Infrastructure\Environment as Env;

final class TesMechDocuments extends AbstractMigration
{
    protected $aidForTesting = 1;
    protected $production = "production";
    protected $group = "tes_mech";
    protected $documents = [
        "purchase_order" => "Purchase Order",
        "small_form_subcontract" => "Small Works Order",
        "long_form_subcontract" => "Long Form Subcontract"
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
        $environment = Env::getValue("ENVIRONMENT", $this->production);
        $type        = 2; // contractual
        $subtype     = 6; // custom order
        $prefix = $environment !== $this->production ? $this->group . " - " : "";
        $prefix = strtoupper(str_replace("_", " ", $prefix));

        foreach ($this->documents as $slug => $document) {
            $s3KeyDocument = str_replace("_", "-", $slug);
            $data = [
                [
                    'name'      => $prefix . $document,
                    'type'      => $type,
                    'subtype'   => $subtype,
                    'status'    => 1,
                    's3_key'    => "$environment/templates/orders/$this->group/$s3KeyDocument.json",
                    's3_bucket' => 'document',
                    'meta'      => '{"config": {"slug": "' . $this->group . "_" . $slug . '","version": "1.0"},"document": {"version": "1.0.0"}}'
                ]
            ];

            $table->insert($data)->save();
            $did = $this->getAdapter()->getConnection()->lastInsertId();

            if ($environment !== $this->production) {
                $this->table('document_owner_mapping')->insert([
                    ['owner_id' => $this->aidForTesting, 'document_id' => $did]
                ])->save();
            }
        }
    }
}
