<?php


use Phinx\Seed\AbstractSeed;

class ProcurementScheduleOverviewSeeder extends AbstractSeed
{
    public function run(): void
    {
        $data = [
            [
                'name' => 'SUPPLIER_LIST_APPROVAL',
            ],
            [
                'name' => 'ENQUIRY_APPROVAL',
            ],
            [
                'name' => 'ORDER_APPROVAL',
            ],
            [
                'name' => 'ORDER_SIGNED',
            ],
            [
                'name' => 'DESIGN_LEAD_IN',
            ],
            [
                'name' => 'MANUFACTURE_LEAD_IN',
            ],
        ];

        $this->table('feature')->insert($data)->save();
    }
}
