<?php
declare(strict_types=1);

use Phinx\Migration\AbstractMigration;

final class AddApprovalThresholdPermission extends AbstractMigration
{
    public function up(): void
    {
        $this->execute("
            INSERT IGNORE INTO permission (`key`)
            VALUES ('approval_threshold')
        ");
    }

    public function down(): void
    {
        $this->execute("
            DELETE FROM permission
            WHERE `key` = 'approval_threshold'
        ");
    }
}
