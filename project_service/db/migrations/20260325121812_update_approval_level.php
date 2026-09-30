<?php
declare(strict_types=1);

use Phinx\Migration\AbstractMigration;

final class UpdateApprovalLevel extends AbstractMigration
{
    public function up(): void
    {
        $table = $this->table('approval_type', [
            'id' => false,
            'primary_key' => 'id'
        ]);

        $table->addColumn('id', 'integer', [
                'signed' => true,
                'identity' => true
            ])
            ->addColumn('label', 'string', [
                'null' => false,
                'limit' => 255
            ])
            ->create();

        $table = $this->table('approval_level');

        $table->removeColumn('approval_type')
            ->removeColumn('threshold_value')
            ->renameColumn("min_value", "from_value")
            ->renameColumn("max_value", "to_value")
            ->addColumn('approval_type_id', 'integer', [
                'signed' => true,
                'after' => 'account_id'
            ])
            ->addColumn('sort_order', 'integer', [
                'after' => 'min_required',
            ])
            ->addForeignKey('approval_type_id', 'approval_type', 'id', [
                'delete' => 'CASCADE',
                'update' => 'NO_ACTION'
            ])
            ->update();

        $approvalTypes = [
            ['label' => 'order'],
            ['label' => 'tender_recommendation']
        ];
        $this->table('approval_type')->insert($approvalTypes)->saveData();
    }

    public function down(): void
    {
        $table = $this->table('approval_level');

        $table->dropForeignKey('approval_type_id')
            ->renameColumn("from_value", "min_value")
            ->renameColumn("to_value", "max_value")
            ->removeColumn('approval_type_id')
            ->removeColumn('sort_order')
            ->addColumn('approval_type', 'enum', [
                'values' => ['order', 'tender_recommendation', 'supplier_list'],
                'null' => false,
                'after' => 'account_id'
            ])
            ->update();

        $this->table('approval_type')->drop()->save();
    }
}
