<?php
declare(strict_types=1);

use Phinx\Migration\AbstractMigration;

final class SwitchApiClientBusinessUnitMappingToAccountGroup extends AbstractMigration
{
    public function up(): void
    {
        $this->execute('DELETE FROM api_client_business_unit_mapping');

        $this->table('api_client_business_unit_mapping')
            ->dropForeignKey('account_id')
            ->removeColumn('account_id')
            ->save();

        $this->table('api_client_business_unit_mapping')
            ->addColumn('account_group_id', 'integer', ['signed' => false, 'after' => 'api_client_id'])
            ->addForeignKey('account_group_id', 'account_group', 'id', ['delete' => 'CASCADE', 'update' => 'CASCADE'])
            ->save();
    }

    public function down(): void
    {
        $this->execute('DELETE FROM api_client_business_unit_mapping');

        $this->table('api_client_business_unit_mapping')
            ->dropForeignKey('account_group_id')
            ->removeColumn('account_group_id')
            ->save();

        $this->table('api_client_business_unit_mapping')
            ->addColumn('account_id', 'integer', ['signed' => true, 'after' => 'api_client_id'])
            ->addForeignKey('account_id', 'account', 'id', ['delete' => 'CASCADE', 'update' => 'CASCADE'])
            ->save();
    }
}
