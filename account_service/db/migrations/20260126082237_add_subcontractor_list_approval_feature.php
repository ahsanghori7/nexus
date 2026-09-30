<?php
declare(strict_types=1);

use Phinx\Migration\AbstractMigration;

final class AddSubcontractorListApprovalFeature extends AbstractMigration
{
    public function up(): void
    {
        $this->execute("
            INSERT INTO feature (parent_id, name)
            VALUES (NULL, 'SUBCONTRACTOR_LIST_APPROVAL')
        ");
    }

    public function down(): void
    {
        $this->execute("
            DELETE FROM feature
            WHERE name = 'SUBCONTRACTOR_LIST_APPROVAL'
        ");
    }
}
