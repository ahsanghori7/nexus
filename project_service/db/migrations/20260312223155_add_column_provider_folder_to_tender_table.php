<?php
declare(strict_types=1);

use Phinx\Migration\AbstractMigration;

final class AddColumnProviderFolderToTenderTable extends AbstractMigration
{
    public function up(): void
    {
        $table = $this->table('tender');

        $table->addColumn('provider_folder', 'string', ['null' => true])->update();
    }

    public function down(): void
    {
        $table = $this->table('tender');

        $table->removeColumn('provider_folder')->update();
    }
}
