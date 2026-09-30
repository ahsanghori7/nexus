<?php
declare(strict_types=1);

use Phinx\Migration\AbstractMigration;

final class ProjectNewColumns extends AbstractMigration
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
        $added_after_column = 'site_address_postcode';
        $new_columns = [
            "client_address_one" => [
                "type"  => "string",
                "null"  => true,
                "limit" => 255
            ],
            "client_address_two" => [
                "type"  => "string",
                "null"  => true,
                "limit" => 255
            ],
            "client_address_city" => [
                "type"  => "string",
                "null"  => true,
                "limit" => 100
            ],
            "client_address_postcode" => [
                "type"  => "string",
                "null"  => true,
                "limit" => 10
            ],
            "principal_contractor" => [
                "type"  => "string",
                "null"  => true,
                "limit" => 255
            ],
            "notice_period_commence_work_on_site" => [
                "type"    => "integer",
                "null"    => true,
                "default" => 0
            ],
            "comment_period_subcontractor_drawings" => [
                "type"    => "integer",
                "null"    => true,
                "default" => 0
            ],
            "sub_contract_base_date" => [
                "type"  => "string",
                "null"  => true,
                "limit" => 255
            ],
            "does_sectional_completion_apply" => [
                "type"   => "integer",
                "null"   => true,
                "default" => 0
            ],
            "retention_release_date" => [
                "type"   => "integer",
                "null"   => true,
                "default" => 0
            ],
            "prime_cost_addition_for_materials" => [
                "type"   => "integer",
                "null"   => true,
                "default" => 0
            ],
            "prime_cost_addition_for_plant" => [
                "type"   => "integer",
                "null"   => true,
                "default" => 0
            ],
            "nominee_for_disputes" => [
                "type"   => "string",
                "null"   => true,
                "limit"  => 255
            ],
            "main_contract_signed_date" => [
                "type"   => "string",
                "null"   => true,
                "limit"  => 255
            ],
            "rectification_defects_period" => [
                "type"    => "integer",
                "null"    => true,
                "default" => 0
            ],
            "retention" => [
                "type"    => "integer",
                "null"    => true,
                "default" => 0
            ],
            "employers_agent" => [
                "type"  => "string",
                "null"  => true,
                "limit" => 255
            ],
            "principal_designer" => [
                "type"  => "string",
                "null"  => true,
                "limit" => 255
            ],
            "form_of_contract_for_main_contract" => [
                "type"  => "string",
                "null"  => true,
                "limit" => 255
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
}
