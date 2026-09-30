<?php

declare(strict_types=1);

use Phinx\Migration\AbstractMigration;

final class AddIfsFeature extends AbstractMigration
{
    public function up(): void
    {
        $this->execute("
            INSERT INTO feature (parent_id, name)
            VALUES (NULL, 'IFS')
        ");
    }

    public function down(): void
    {
        $this->execute("
            DELETE FROM feature
            WHERE name = 'IFS'
        ");
    }
}
