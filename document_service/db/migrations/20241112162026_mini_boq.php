<?php
declare(strict_types=1);

use App\Infrastructure\Environment as Env;
use Phinx\Migration\AbstractMigration;

final class MiniBoq extends AbstractMigration
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
        $table    = $this->table('document_subtype');
        $latestId = $table->getAdapter()
            ->fetchRow('SELECT MAX(id) AS latest_id FROM document_subtype')['latest_id'];
        $environment = Env::getValue("ENVIRONMENT", "production");
        $data = [
            [
                'id'    => $latestId + 1,
                'uid'   => 'miniboq_asset',
                'label' => 'Mini BoQ Asset',
            ],
            [
                'id'    => $latestId + 2,
                'uid'   => 'miniboq_template',
                'label' => 'Mini BoQ Template',
            ]
        ];
        $table->insert($data)->save();

        $subtype_asset    = $this->fetchRow("SELECT `id` FROM document_subtype WHERE uid = 'miniboq_asset'");
        $table       = $this->table('document');
        $type        = 2; //contractual
        $subtype     = $subtype_asset['id']; //custom_boq_order
        $data = [
            [
                'parent_id' => 0,
                'name' => 'Mini BoQ',
                'type' => $type,
                'subtype' => $subtype,
                'status' => 1,
                's3_key' => "$environment/templates/mini_boq/mini-boq.json",
                's3_bucket' => 'document',
                'meta' => '[]',
            ]
        ];
        $table->insert($data)->save();
    }
}
