<?php
declare(strict_types=1);

use Phinx\Migration\AbstractMigration;

final class BackfillTenderStatusColumn extends AbstractMigration
{
    public function up(): void
    {
        $this->execute("
            UPDATE tender t
            SET status = CASE
                WHEN (t.service IS NOT NULL)
                 AND (t.start_on_site IS NOT NULL AND t.start_on_site <> '')
                 AND EXISTS (SELECT 1 FROM package_mapping pm WHERE pm.tender_id = t.id)
                THEN 'ready'
                WHEN (t.service IS NOT NULL)
                  OR (t.start_on_site IS NOT NULL AND t.start_on_site <> '')
                  OR EXISTS (SELECT 1 FROM package_mapping pm WHERE pm.tender_id = t.id)
                THEN 'in_progress'
                ELSE 'needs_setup'
            END
        ");
    }

    public function down(): void
    {
        $this->execute("UPDATE tender SET status = 'needs_setup'");
    }
}
