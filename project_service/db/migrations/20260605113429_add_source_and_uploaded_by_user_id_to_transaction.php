<?php
declare(strict_types=1);

use Phinx\Migration\AbstractMigration;

final class AddSourceAndUploadedByUserIdToTransaction extends AbstractMigration
{
    public function up(): void
    {
        $table = $this->table('transaction');

        if (!$table->hasColumn('source')) {
            $table->addColumn('source', 'string', [
                'null' => true,
                'default' => null,
                'after' => 'forecast',
            ]);
        }

        if (!$table->hasColumn('uploaded_by_user_id')) {
            $table->addColumn('uploaded_by_user_id', 'integer', [
                'null' => true,
                'default' => null,
                'after' => 'source',
            ]);
        }

        $table->update();
    }

    public function down(): void
    {
        $table = $this->table('transaction');

        if ($table->hasColumn('uploaded_by_user_id')) {
            $table->removeColumn('uploaded_by_user_id');
        }

        if ($table->hasColumn('source')) {
            $table->removeColumn('source');
        }

        $table->update();
    }
}
