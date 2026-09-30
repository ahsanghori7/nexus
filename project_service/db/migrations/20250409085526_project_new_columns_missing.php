<?php
declare(strict_types=1);

use Phinx\Migration\AbstractMigration;

final class ProjectNewColumnsMissing extends AbstractMigration
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
        $new_columns = [
            "opening_hours_weekdays" => [
                "type"  => "string",
                "null"  => true,
                "limit" => 255
            ],
            "opening_hours_weekends" => [
                "type"  => "string",
                "null"  => true,
                "limit" => 255
            ],
            "client_name" => [
                "type"  => "string",
                "null"  => true,
                "limit" => 255
            ],
            "client_reg_number" => [
                "type"  => "string",
                "null"  => true,
                "limit" => 255
            ]
        ];

        $added_after_column = 'site_address_postcode';

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
