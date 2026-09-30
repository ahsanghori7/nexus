<?php
declare(strict_types=1);

use Phinx\Migration\AbstractMigration;

final class AddOneHourTokenType extends AbstractMigration
{
    public function up(): void
    {
        $this->execute("
            INSERT IGNORE INTO token_type (`label`, `expiry_hours`)
            VALUES ('temp_1h', 1)
        ");
    }

    public function down(): void
    {
        $this->execute("
            DELETE FROM token_type
            WHERE `label` = 'temp_1h'
        ");
    }
}
