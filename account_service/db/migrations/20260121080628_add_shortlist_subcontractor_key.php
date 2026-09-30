<?php
declare(strict_types=1);

use Phinx\Migration\AbstractMigration;

final class AddShortlistSubcontractorKey extends AbstractMigration
{
    public function up(): void
    {
        $this->execute("
            INSERT IGNORE INTO permission (`key`)
            VALUES ('subcontractor_list_approval')
        ");
    }

    public function down(): void
    {
        $this->execute("
            DELETE FROM permission
            WHERE `key` = 'subcontractor_list_approval'
        ");
    }
}
