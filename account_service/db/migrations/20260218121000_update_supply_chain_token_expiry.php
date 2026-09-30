<?php
declare(strict_types=1);

use Phinx\Migration\AbstractMigration;

final class UpdateSupplyChainTokenExpiry extends AbstractMigration
{
    private const SUPPLY_CHAIN_EXPIRY_HOURS = 4320;
    private const PREVIOUS_SUPPLY_CHAIN_EXPIRY_HOURS = 720;

    public function up(): void
    {
        $this->execute(sprintf(
            "UPDATE token_type SET expiry_hours = %d WHERE `label` = 'supply_chain'",
            self::SUPPLY_CHAIN_EXPIRY_HOURS
        ));
    }

    public function down(): void
    {
        $this->execute(sprintf(
            "UPDATE token_type SET expiry_hours = %d WHERE `label` = 'supply_chain'",
            self::PREVIOUS_SUPPLY_CHAIN_EXPIRY_HOURS
        ));
    }
}
