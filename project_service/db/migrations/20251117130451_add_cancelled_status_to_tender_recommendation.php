<?php
declare(strict_types=1);

use Phinx\Migration\AbstractMigration;

final class AddCancelledStatusToTenderRecommendation extends AbstractMigration
{
    public function up(): void
    {
        $this->execute("
            ALTER TABLE tender_recommendation
            MODIFY COLUMN status ENUM('Draft', 'Pending', 'Approved', 'Rejected', 'Cancelled')
            NOT NULL DEFAULT 'Draft'
        ");
    }

    public function down(): void
    {
        // revert back to old enum without Cancelled
        $this->execute("
            ALTER TABLE tender_recommendation
            MODIFY COLUMN status ENUM('Draft', 'Pending', 'Approved', 'Rejected')
            NOT NULL DEFAULT 'Draft'
        ");
    }
}
