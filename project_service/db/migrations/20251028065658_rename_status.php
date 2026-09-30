<?php
declare(strict_types=1);

use Phinx\Migration\AbstractMigration;

final class RenameStatus extends AbstractMigration
{
    public function up(): void
    {
        $this->execute("
            ALTER TABLE tender_recommendation
            MODIFY COLUMN status ENUM('Draft', 'Pending', 'Approved', 'Rejected') NOT NULL DEFAULT 'Draft'
        ");
    }

    public function down(): void
    {
        $this->execute("
            ALTER TABLE tender_recommendation
            MODIFY COLUMN status ENUM('Draft', 'Shared', 'Approved', 'Rejected') NOT NULL DEFAULT 'Draft'
        ");
    }
}
