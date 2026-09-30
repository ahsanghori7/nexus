<?php
declare(strict_types=1);

use Phinx\Migration\AbstractMigration;

final class UpdateForecastTypeAndValueInTransaction extends AbstractMigration
{
    public function up(): void
    {
        $this->table('transaction')
            ->changeColumn('forecast', 'integer', [
                'null' => true,
            ])
            ->update();

        $this->execute("
            UPDATE `transaction`
            SET `forecast` = `price`
            WHERE `forecast` IS NULL
        ");
    }

    public function down(): void
    {
        $this->table('transaction')
            ->changeColumn('forecast', 'decimal', [
                'precision' => 15,
                'scale' => 2,
                'null' => true,
                'after' => 'price',
            ])
            ->update();
    }
}
