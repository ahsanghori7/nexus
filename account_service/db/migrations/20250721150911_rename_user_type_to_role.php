<?php
declare(strict_types=1);

use Phinx\Migration\AbstractMigration;

final class RenameUserTypeToRole extends AbstractMigration
{
    public function up(): void
    {
        $this->table('user_type')->rename('role')->update();

        $this->table('role')
            ->changeColumn('id', 'integer', [
                'signed' => true,
                'identity' => true
            ])
            ->addColumn('level', 'integer', [
                'null' => false,
                'default' => 0,
                'after' => 'label'
            ])
            ->update();
    }

    public function down(): void
    {
        $this->table('role')
            ->removeColumn('level')
            ->changeColumn('id', 'integer', [
                'signed' => true,
                'identity' => true
            ])
            ->update();

        // Rename table back
        $this->table('role')->rename('user_type')->update();
    }
}
