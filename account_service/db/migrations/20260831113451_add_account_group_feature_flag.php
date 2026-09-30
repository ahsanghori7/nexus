<?php
declare(strict_types=1);

use Phinx\Migration\AbstractMigration;

final class AddAccountGroupFeatureFlag extends AbstractMigration
{
    public function up(): void
    {
        $this->execute("
            INSERT INTO feature (parent_id, name)
            VALUES (NULL, 'ACCOUNT_GROUP')
        ");
    }


    public function down(): void
    {
        $this->execute("
            DELETE FROM feature
            WHERE name = 'ACCOUNT_GROUP'
        ");
    }
}
