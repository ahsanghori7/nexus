<?php

declare(strict_types=1);

use Phinx\Migration\AbstractMigration;

final class PreqStatusesFixes extends AbstractMigration
{

    protected $commonConfig = [
        'engine' => 'InnoDB',
        'collation' => 'latin1_general_ci',
        'id' => false,
        'primary_key' => ['id']
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
        $this->table('account_prequalification_statuses')->drop()->save();

        $this->table('prequalification_section', $this->commonConfig)
            ->addColumn('id', 'integer', ['identity' => true])
            ->addColumn('code', 'string', ['limit' => 255, 'null' => false])
            ->addColumn('name', 'string', ['limit' => 255, 'null' => false])
            ->create();

        $this->table('prequalification_section')
            ->insert([
                ['id' => null, 'code' => 'finance', 'name' => 'Finance'],
                ['id' => null, 'code' => 'documents', 'name' => 'Documents'],
                ['id' => null, 'code' => 'references', 'name' => 'References'],
                ['id' => null, 'code' => 'turnover', 'name' => 'Turnover'],
                ['id' => null, 'code' => 'order_value', 'name' => 'Order value'],
                ['id' => null, 'code' => 'number_employees', 'name' => 'Number of employees'],
                ['id' => null, 'code' => 'current_subcontractors', 'name' => 'Number of current subcontractors'],
                ['id' => null, 'code' => 'insurances', 'name' => 'Insurances'],
                ['id' => null, 'code' => 'accreditations', 'name' => 'Accreditations'],
                ['id' => null, 'code' => 'management_system_procedures', 'name' => 'Management System Procedures'],
            ])
            ->save();

        $this->table('prequalification_section_mapping', $this->commonConfig)
            ->addColumn('id', 'integer', ['identity' => true])
            ->addColumn('parent_id', 'integer', ['null' => false, 'default' => 0])
            ->addColumn('section_id', 'integer', ['null' => false])
            ->addColumn('account_id', 'integer', ['null' => false])
            ->addColumn('status', 'integer', ['limit' => 255, 'null' => false, 'default' => 0, 'comment' => '0: Not finished, 1: Finished'])
            ->addColumn('created_at', 'datetime', ['default' => 'CURRENT_TIMESTAMP'])
            ->addColumn('updated_at', 'datetime', ['default' => 'CURRENT_TIMESTAMP', 'update' => 'CURRENT_TIMESTAMP'])
            ->create();

        $this->table('prequalification_section_mapping')->addForeignKey('account_id', 'account', 'id', [
            'delete' => 'CASCADE',
            'update' => 'CASCADE'
        ])
            ->addForeignKey('section_id', 'prequalification_section', 'id', [
                'delete' => 'CASCADE',
                'update' => 'CASCADE'
            ])
            ->update();
    }
}
