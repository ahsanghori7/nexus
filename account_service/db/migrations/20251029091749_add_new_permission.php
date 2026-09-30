<?php
declare(strict_types=1);

use Phinx\Migration\AbstractMigration;

final class AddNewPermission extends AbstractMigration
{
    public function up(): void
    {
        $this->execute("INSERT IGNORE INTO permission (`key`) VALUES ('tender_recommendation')");
    }

    public function down(): void
    {
        // Remove the permission and its mappings
        $this->execute("DELETE FROM permission_mappings WHERE `permission_id` = (SELECT id FROM permission WHERE `key` = 'tender_recommendation')");
        $this->execute("DELETE FROM permission WHERE `key` = 'tender_recommendation'");
    }
}
