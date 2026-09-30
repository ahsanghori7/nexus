<?php
declare(strict_types=1);

use Phinx\Migration\AbstractMigration;

final class ApprovalLevelAccountRoleMapping extends AbstractMigration
{
    public function up(): void
    {
        $table = $this->table('approval_level_account_role_mapping', [
            'id' => false,
            'primary_key' => 'id'
        ]);

        $table
            ->addColumn('id', 'integer', [
                'signed' => true,
                'identity' => true
            ])
            ->addColumn('approval_level_id', 'integer', [
                'signed' => true
            ])
            ->addColumn('account_role_id', 'integer', [
                'signed' => true
            ])
            ->addForeignKey(
                'approval_level_id',
                'approval_level',
                'id',
                ['delete' => 'CASCADE', 'update' => 'CASCADE']
            )
            ->addIndex(['approval_level_id'])
            ->addIndex(['account_role_id'])
            ->create();
    }

    public function down(): void
    {
        $this->table('approval_level_account_role_mapping')->drop()->save();
    }
}
