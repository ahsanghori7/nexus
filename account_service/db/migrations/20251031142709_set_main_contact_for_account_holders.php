<?php
declare(strict_types=1);

use Phinx\Migration\AbstractMigration;

final class SetMainContactForAccountHolders extends AbstractMigration
{
    /**
     * Up method to migrate existing data.
     * Sets is_main_contact = true for users who are currently Account Holders
     */
    public function up(): void
    {
        // Get the account_holder role type ID
        $roleRow = $this->fetchRow("SELECT id FROM role WHERE label = 'account_holder'");

        if (!$roleRow) {
            $this->output->writeln('<error>Account holder role not found. Skipping migration.</error>');
            return;
        }

        $accountHolderTypeId = $roleRow['id'];

        $this->execute("
            UPDATE account_user_mapping aum
            JOIN user u ON u.id = aum.user_id
            SET aum.is_main_contact = true
            WHERE u.type_id = {$accountHolderTypeId}
        ");
    }

    /**
     * Down method to reverse the migration
     */
    public function down(): void
    {
        $this->execute("UPDATE account_user_mapping SET is_main_contact = false");
    }
}
