<?php
declare(strict_types=1);

use Phinx\Migration\AbstractMigration;

final class UpdateAutoLoaderTokenExpiry extends AbstractMigration
{
    private const AUTO_LOADER_EXPIRY_HOURS = 720;
    private const PREVIOUS_AUTO_LOADER_EXPIRY_HOURS = 72;

    public function up(): void
    {
        $this->execute(sprintf(
            "UPDATE token_type SET expiry_hours = %d WHERE `label` = 'auto_loader'",
            self::AUTO_LOADER_EXPIRY_HOURS
        ));
    }

    public function down(): void
    {
        $this->execute(sprintf(
            "UPDATE token_type SET expiry_hours = %d WHERE `label` = 'auto_loader'",
            self::PREVIOUS_AUTO_LOADER_EXPIRY_HOURS
        ));
    }
}
