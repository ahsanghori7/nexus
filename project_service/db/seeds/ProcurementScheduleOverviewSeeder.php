<?php


use Phinx\Seed\AbstractSeed;

class ProcurementScheduleOverviewSeeder extends AbstractSeed
{
    public function run(): void
    {
        $data = [
            [
                'label' => 'Supplier List Approval',
                'feature_label' => 'SUPPLIER_LIST_APPROVAL',
                'is_required' => 0,
                'sort_order' => 1,
                'type' => 'manual',
            ],
            [
                'label' => 'Enquiry Approval',
                'feature_label' => 'ENQUIRY_APPROVAL',
                'is_required' => 0,
                'sort_order' => 2,
                'type' => 'manual',
            ],
            [
                'label' => 'Enquiry Issue Date',
                'feature_label' => 'ENQUIRY_ISSUE_DATE',
                'is_required' => 1,
                'sort_order' => 3,
                'type' => 'automatic',
            ],
            [
                'label' => 'Quote Due',
                'feature_label' => 'QUOTE_DUE',
                'is_required' => 1,
                'sort_order' => 4,
                'type' => 'automatic',
            ],
            [
                'label' => 'Tender Analysis Completed',
                'feature_label' => 'TENDER_ANALYSIS_COMPLETED',
                'is_required' => 1,
                'sort_order' => 5,
                'type' => 'manual',
            ],
            [
                'label' => 'Tender Recommendation Approval',
                'feature_label' => 'TENDER_RECOMMENDATION',
                'is_required' => 0,
                'sort_order' => 6,
                'type' => 'automatic',
            ],
            [
                'label' => 'Order Approval',
                'feature_label' => 'ORDER_APPROVAL',
                'is_required' => 0,
                'sort_order' => 7,
                'type' => 'automatic',
            ],
            [
                'label' => 'Order Issued',
                'feature_label' => 'ORDER_ISSUED',
                'is_required' => 1,
                'sort_order' => 8,
                'type' => 'automatic',
            ],
            [
                'label' => 'Order Signed',
                'feature_label' => 'ORDER_SIGNED',
                'is_required' => 0,
                'sort_order' => 9,
                'type' => 'manual',
            ],
            [
                'label' => 'Design Lead-In',
                'feature_label' => 'DESIGN_LEAD_IN',
                'is_required' => 0,
                'sort_order' => 10,
                'type' => 'manual',
            ],
            [
                'label' => 'Manufacture Lead-In',
                'feature_label' => 'MANUFACTURE_LEAD_IN',
                'is_required' => 0,
                'sort_order' => 11,
                'type' => 'manual',
            ],
            [
                'label' => 'Start on Site',
                'feature_label' => 'START_ON_SITE',
                'is_required' => 1,
                'sort_order' => 12,
                'type' => 'manual',
            ],
        ];

        $this->table('milestone')->insert($data)->save();


        $statusData = [
            ['label' => 'Not Started'],
            ['label' => 'In Progress'],
            ['label' => 'Completed'],
        ];
        $this->table('package_milestone_status')->insert($statusData)->save();
    }
}
