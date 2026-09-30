<?php
declare(strict_types=1);

use Phinx\Migration\AbstractMigration;

final class UpdateMilestoneType extends AbstractMigration
{
    public function up(): void
    {
        $this->execute("UPDATE milestone set type = 'automatic' where feature_label = 'SUBCONTRACTOR_LIST_APPROVAL' and type = 'manual'");
    }

    public function down(): void
    {
        $this->execute("UPDATE milestone set type = 'manual' where feature_label = 'SUBCONTRACTOR_LIST_APPROVAL' and type = 'automatic'");
    }
}
