<?php
declare(strict_types=1);

use Phinx\Migration\AbstractMigration;

final class AddAclEnabledToUser extends AbstractMigration
{
    public function up(): void
    {
        $table = $this->table('user');
        if (!$table->hasColumn('acl_enabled')) {
            $table->addColumn('acl_enabled', 'integer', [
                    'null' => false,
                    'default' => 0,
                    'limit' => 1,
                    'after' => 'meta',
                ])
                ->update();
        }
    }

    public function down(): void
    {
        $table = $this->table('user');
        if ($table->hasColumn('acl_enabled')) {
            $table->removeColumn('acl_enabled')->update();
        }
    }
}
