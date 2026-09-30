<?php
declare(strict_types=1);

use Phinx\Migration\AbstractMigration;

final class AddTenderApprovalPermission extends AbstractMigration
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
    public function up(): void
    {
        $this->execute("INSERT IGNORE INTO permission (`key`) VALUES ('tender_inquiry_approval')");
    }

    public function down(): void
    {
        // Remove the permission and its mappings
        $this->execute("DELETE FROM permission_mappings WHERE `permission_id` = (SELECT id FROM permission WHERE `key` = 'tender_inquiry_approval')");
        $this->execute("DELETE FROM permission WHERE `key` = 'tender_inquiry_approval'");
    }
}
