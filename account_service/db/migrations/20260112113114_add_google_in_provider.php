<?php
declare(strict_types=1);

use Phinx\Migration\AbstractMigration;

final class AddGoogleInProvider extends AbstractMigration
{
    public function up(): void
    {
        $this->execute("
            INSERT INTO provider (label, type_id, created_at)
            VALUES (
                'google',
                (SELECT id FROM provider_type WHERE label = 'login' LIMIT 1),
                NOW()
            )
        ");
    }

    public function down(): void
    {
        $this->execute("DELETE FROM provider WHERE label = 'google'");
    }
}
