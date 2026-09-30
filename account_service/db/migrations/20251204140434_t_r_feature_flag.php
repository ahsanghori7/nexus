<?php
declare(strict_types=1);

use Phinx\Migration\AbstractMigration;

final class TRFeatureFlag extends AbstractMigration
{
    public function up(): void
    {
        // Insert Tender Recommendation feature entry
        $this->execute("
            INSERT INTO feature (parent_id, name)
            VALUES (NULL, 'TENDER_RECOMMENDATION')
        ");
    }


    public function down(): void
    {
        // Remove Tender Recommendation feature entry
        $this->execute("
            DELETE FROM feature
            WHERE name = 'TENDER_RECOMMENDATION'
        ");
    }
}
