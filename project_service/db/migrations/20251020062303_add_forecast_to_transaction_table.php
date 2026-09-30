<?php
declare(strict_types=1);

use Phinx\Migration\AbstractMigration;

final class AddForecastToTransactionTable extends AbstractMigration
{
    /**
     * Change Method.
     *
     * Use up() and down() for better control over reversible actions.
     */
    public function up(): void
    {
        $table = $this->table('transaction');

        if (!$table->hasColumn('forecast')) {
            $table->addColumn('forecast', 'decimal', [
                'precision' => 15,
                'scale' => 2,
                'null' => true,
                'after' => 'meta',
            ]);
        }

        $table->update();
    }

    public function down(): void
    {
        $table = $this->table('transaction');

        if ($table->hasColumn('forecast')) {
            $table->removeColumn('forecast');
        }

        $table->update();
    }
}
