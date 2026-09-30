<?php
declare(strict_types=1);

use Phinx\Migration\AbstractMigration;

final class AddReviewTokenType extends AbstractMigration
{
    public function up(): void
    {
        $this->execute("
            INSERT IGNORE INTO token_type (`label`, `expiry_hours`)
            VALUES ('review_token', 2160)
        ");
    }

    public function down(): void
    {
        $this->execute("
            DELETE FROM token_type
            WHERE `label` = 'review_token'
        ");
    }
}
