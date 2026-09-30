<?php
declare(strict_types=1);

use Phinx\Migration\AbstractMigration;
use Phinx\Db\Adapter\MysqlAdapter;

final class AddNewColumnsToProject extends AbstractMigration
{
    /**
     * Migrate Up.
     */
    public function up()
    {
        $added_after_column = 'form_of_contract_for_main_contract';
        $new_columns = [
            "performance_bond" => [
                "type"      => "boolean",
                "null"      => true,
                "default"   => null,
                "limit"     => MysqlAdapter::INT_TINY
            ],
            "design_responsibility" => [
                "type"      => "boolean",
                "null"      => true,
                "default"   => null,
                "limit"     => MysqlAdapter::INT_TINY
            ],
            "design_responsibility_period" => [
                "type"      => "text",
                "null"      => true,
                "limit"     => MysqlAdapter::TEXT_TINY
            ],
            "collateral_warranties_required" => [
                "type"      => "boolean",
                "null"      => true,
                "default"   => null,
                "limit"     => MysqlAdapter::INT_TINY
            ],
            "warranties_provided_to" => [
                "type"      => "text",
                "null"      => true,
                "limit"     => MysqlAdapter::TEXT_TINY
            ],
            "liquidated_damages_applicable" => [
                "type"      => "boolean",
                "null"      => true,
                "default"   => null,
                "limit"     => MysqlAdapter::INT_TINY
            ],
            "liquidated_damages_rate" => [
                "type"      => "text",
                "null"      => true,
                "limit"     => MysqlAdapter::TEXT_TINY
            ],
            "cap_on_liquidated_damages" => [
                "type"      => "text",
                "null"      => true,
                "limit"     => MysqlAdapter::TEXT_TINY
            ],
            "amendments_relevant_events_matters" => [
                "type"      => "boolean",
                "null"      => true,
                "default"   => null,
                "limit"     => MysqlAdapter::INT_TINY
            ],
            "governing_law" => [
                "type"      => "text",
                "null"      => true,
                "limit"     => MysqlAdapter::TEXT_TINY,
                "default"   => "English Law"
            ],
            "interim_valuation_frequency" => [
                "type"      => "text",
                "null"      => true,
                "limit"     => MysqlAdapter::TEXT_TINY
            ],
            "payment_due_date" => [
                "type"      => "text",
                "null"      => true,
                "limit"     => MysqlAdapter::TEXT_TINY
            ],
            "final_date_for_payment" => [
                "type"      => "date",
                "null"      => true,
                "default"   => null
            ],
            "deadline_for_pay_less_notices" => [
                "type"      => "date",
                "null"      => true,
                "default"   => null
            ],
            "schedule_of_payments_provided" => [
                "type"      => "boolean",
                "null"      => true,
                "default"   => null,
                "limit"     => MysqlAdapter::INT_TINY
            ],
            "advance_payment_provision" => [
                "type"      => "boolean",
                "null"      => true,
                "default"   => null,
                "limit"     => MysqlAdapter::INT_TINY
            ],
            "main_contractor_postal_address_for_notices" => [
                "type"      => "text",
                "null"      => true,
                "limit"     => MysqlAdapter::TEXT_TINY
            ],
            "main_contractor_email_address_for_notices" => [
                "type"      => "text",
                "null"      => true,
                "limit"     => MysqlAdapter::TEXT_TINY
            ],
            "subcontractor_postal_address_for_notices" => [
                "type"      => "text",
                "null"      => true,
                "limit"     => MysqlAdapter::TEXT_TINY
            ],
            "subcontractor_email_address_for_notices" => [
                "type"      => "text",
                "null"      => true,
                "limit"     => MysqlAdapter::TEXT_TINY
            ],
            "date_for_possession_of_site" => [
                "type"      => "text",
                "null"      => true,
                "limit"     => MysqlAdapter::TEXT_TINY
            ],
            "sectional_completion_dates" => [
                "type"      => "text",
                "null"      => true,
                "limit"     => MysqlAdapter::TEXT_TINY
            ],
            "review_period_for_drawings" => [
                "type"      => "text",
                "null"      => true,
                "limit"     => MysqlAdapter::TEXT_TINY
            ],
            "advance_warning_period" => [
                "type"      => "text",
                "null"      => true
            ],
            "public_product_insurance_responsible" => [
                "type"      => "text",
                "null"      => true,
                "limit"     => MysqlAdapter::TEXT_TINY
            ],
            "employer_liabilty_insurance_responsible" => [
                "type"      => "text",
                "null"      => true,
                "limit"     => MysqlAdapter::TEXT_TINY
            ],
            "professional_indemnity_insurance_responsible" => [
                "type"      => "text",
                "null"      => true,
                "limit"     => MysqlAdapter::TEXT_TINY
            ],
            "edition_of_jct_contract" => [
                "type"      => "text",
                "null"      => true,
                "limit"     => MysqlAdapter::TEXT_TINY
            ],
            "schedule_of_amendments_reference" => [
                "type"      => "text",
                "null"      => true,
                "limit"     => MysqlAdapter::TEXT_TINY
            ],
            "client_contact_name" => [
                "type"      => "text",
                "null"      => true,
                "limit"     => MysqlAdapter::TEXT_TINY
            ],
            "client_contact_email" => [
                "type"      => "text",
                "null"      => true,
                "limit"     => MysqlAdapter::TEXT_TINY
            ],
            "client_contact_postal_code" => [
                "type"      => "text",
                "null"      => true,
                "limit"     => MysqlAdapter::TEXT_TINY
            ],
            "site_constrains" => [
                "type"      => "text",
                "null"      => true
            ],
        ];

        foreach ($new_columns as $column_key => $column) {
            if (!$this->table('project')->hasColumn($column_key)) {
                $options = ['null' => $column['null'], 'after' => $added_after_column];

                if (isset($column['limit'])) {
                    $options['limit'] = $column['limit'];
                }

                if (isset($column['default'])) {
                    $options['default'] = $column['default'];
                }

                $this->table('project')
                    ->addColumn($column_key, $column['type'], $options)
                    ->update();

                // update the after pointer to the newly added column
                $added_after_column = $column_key;
            }
        }
    }

    /**
     * Migrate Down.
     */
    public function down(): void
    {
        $this->table('project')
            ->removeColumn('performance_bond')
            ->removeColumn('design_responsibility')
            ->removeColumn('design_responsibility_period')
            ->removeColumn('collateral_warranties_required')
            ->removeColumn('warranties_provided_to')
            ->removeColumn('liquidated_damages_applicable')
            ->removeColumn('liquidated_damages_rate')
            ->removeColumn('cap_on_liquidated_damages')
            ->removeColumn('amendments_relevant_events_matters')
            ->removeColumn('governing_law')
            ->removeColumn('interim_valuation_frequency')
            ->removeColumn('payment_due_date')
            ->removeColumn('final_date_for_payment')
            ->removeColumn('deadline_for_pay_less_notices')
            ->removeColumn('schedule_of_payments_provided')
            ->removeColumn('advance_payment_provision')
            ->removeColumn('main_contractor_postal_address_for_notices')
            ->removeColumn('main_contractor_email_address_for_notices')
            ->removeColumn('subcontractor_postal_address_for_notices')
            ->removeColumn('subcontractor_email_address_for_notices')
            ->removeColumn('date_for_possession_of_site')
            ->removeColumn('sectional_completion_dates')
            ->removeColumn('review_period_for_drawings')
            ->removeColumn('advance_warning_period')
            ->removeColumn('public_product_insurance_responsible')
            ->removeColumn('employer_liabilty_insurance_responsible')
            ->removeColumn('professional_indemnity_insurance_responsible')
            ->removeColumn('edition_of_jct_contract')
            ->removeColumn('schedule_of_amendments_reference')
            ->removeColumn('client_contact_name')
            ->removeColumn('client_contact_email')
            ->removeColumn('client_contact_postal_code')
            ->removeColumn('site_constrains')
            ->update();
    }
}
