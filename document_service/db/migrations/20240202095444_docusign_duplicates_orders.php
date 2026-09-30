<?php
declare(strict_types=1);

use Phinx\Migration\AbstractMigration;
use App\Infrastructure\Environment as Env;

final class DocusignDuplicatesOrders extends AbstractMigration
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
                'name'      => 'JCT Design and Build Subcontract 2016 with Amendments Order',
                'type'      => $type,
                'subtype'   => $subtype,
                'status'    => 1,
                's3_key'    => "$environment/templates/orders/signatory/jtc-design.json",
                's3_bucket' => 'document',
                'meta'      => '{"config": {"slug": "signatory_jct_order_d_&_b","version": "1.0"},"document": {"version": "1.0.0"},"signatory": true}'
            ],
            [
                'name'      => 'JCT Standard Building Subcontract 2016 with Amendments Order',
                'type'      => $type,
                'subtype'   => $subtype,
                'status'    => 1,
                's3_key'    => "$environment/templates/orders/signatory/jtc-standard.json",
                's3_bucket' => 'document',
                'meta'      => '{"config": {"slug": "signatory_jct_order_s_&_b","version": "1.0"},"document": {"version": "1.0.0"}, "signatory": true}'
            ],
            [
                'name'      => 'Small Works Order Template Monthly',
                'type'      => $type,
                'subtype'   => $subtype,
                'status'    => 1,
                's3_key'    => "$environment/templates/orders/signatory/small-works-monthly.json",
                's3_bucket' => 'document',
                'meta'      => '{"config": {"slug": "signatory_small_works_monthly", "version": "1.2"}, "document": {"version": "1.0.1"},"signatory": true}'
            ],
            [
                'name'      => 'Small Works Order Template Stage Payments',
                'type'      => $type,
                'subtype'   => $subtype,
                'status'    => 1,
                's3_key'    => "$environment/templates/orders/signatory/small-works-stage-payments.json",
                's3_bucket' => 'document',
                'meta'      => '{"config": {"slug": "signatory_small_works_template_state_payments", "version": "1.2"}, "document": {"version": "1.0.1"}}'
            ],
            [
                'name'      => 'Quinn London Standard Subcontract',
                'type'      => $type,
                'subtype'   => $subtype,
                'status'    => 1,
                's3_key'    => "$environment/templates/orders/signatory/quinn-london-standard-subcontract.json",
                's3_bucket' => 'document',
                'meta'      => '{"config": {"slug": "signatory_quinn_london", "version": "1.0"}, "document": {"version": "1.0.0"},"signatory": true}'
            ],
            [
                'name'      => 'Nomad Subcontract Agreement - V3 For Chelsea',
                'type'      => $type,
                'subtype'   => $subtype,
                'status'    => 1,
                's3_key'    => "$environment/templates/orders/signatory/nomad-chelsea.json",
                's3_bucket' => 'document',
                'meta'      => '{"config": {"slug": "signatory_nomad_chelsea", "version": "1.0"}, "document": {"version": "1.0.0"},"signatory": true}'
            ],
            [
                'name'      => 'Nomad Subcontract Agreement - V4 For Farnham',
                'type'      => $type,
                'subtype'   => $subtype,
                'status'    => 1,
                's3_key'    => "$environment/templates/orders/signatory/nomad-farnham.json",
                's3_bucket' => 'document',
                'meta'      => '{"config": {"slug": "signatory_nomad_farnham", "version": "1.0"}, "document": {"version": "1.0.0"}, "signatory": true}'
            ],
        ];
        $table->insert($data)->save();
    }
}
