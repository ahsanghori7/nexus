<?php
declare(strict_types=1);

use Phinx\Migration\AbstractMigration;
use App\Infrastructure\Environment as Env;

final class InvitationToTenderV2 extends AbstractMigration
{
    /**
     * Migrate Up.
     */
    public function up(): void
    {
        $environment = Env::getValue("ENVIRONMENT", "production");

        $this->execute("
            UPDATE document
            SET meta = JSON_SET(
                COALESCE(meta, '{}'),
                '$.config.version', '1.2',
                '$.append_order', TRUE
            )
            WHERE name = 'Invitation to Tender'
            AND type = 2
            AND subtype = 3
            AND s3_key = '{$environment}/templates/tenders/quick-tender.json'
            AND s3_bucket = 'document'
            AND status = 1
        ");
    }

    /**
     * Migrate Down.
     */
    public function down(): void
    {
        $environment = Env::getValue("ENVIRONMENT", "production");

        $this->execute("
            UPDATE document
            SET meta = JSON_SET(
                COALESCE(meta, '{}'),
                '$.config.version', '1.1',
                '$.append_order', FALSE
            )
            WHERE name = 'Invitation to Tender'
            AND type = 2
            AND subtype = 3
            AND s3_key = '{$environment}/templates/tenders/quick-tender.json'
            AND s3_bucket = 'document'
            AND status = 1
        ");
    }
}
