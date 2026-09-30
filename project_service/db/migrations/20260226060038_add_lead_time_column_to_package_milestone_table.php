<?php
declare(strict_types=1);

use Phinx\Migration\AbstractMigration;

final class AddLeadTimeColumnToPackageMilestoneTable extends AbstractMigration
{
    public function change(): void
    {
        $table = $this->table('package_milestone');

        $table
            ->addColumn('lead_time', 'integer', [
                'limit' => 5,
                'null' => true
            ])
            ->update();
    }
}
