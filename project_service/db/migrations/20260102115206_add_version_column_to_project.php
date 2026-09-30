<?php
declare(strict_types=1);

use Phinx\Migration\AbstractMigration;

final class AddVersionColumnToProject extends AbstractMigration
{
    public function up(): void
    {
        $this->table('project')->addColumn('version', 'integer', [
                'limit' => 5,
                'null' => false,
                'default' => 2,
            ])
            ->update();

        $this->execute("
            UPDATE `project`
            SET `version` = 1
        ");
    }

    public function down(): void
    {
        $this->table('project')->removeColumn('version')
            ->update();
    }
}
