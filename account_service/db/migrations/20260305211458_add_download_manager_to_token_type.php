<?php
declare(strict_types=1);

use Phinx\Migration\AbstractMigration;

final class AddDownloadManagerToTokenType extends AbstractMigration
{
    public function up(): void
    {
        $this->execute("
            INSERT INTO token_type (`label`, `expiry_hours`)
            VALUES ('download_manager', 720)
        ");
    }

    public function down(): void
    {
        $this->execute("
            DELETE FROM token_type
            WHERE `label` = 'download_manager'
        ");
    }
}
