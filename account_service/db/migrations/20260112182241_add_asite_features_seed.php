<?php
declare(strict_types=1);

use Phinx\Migration\AbstractMigration;

final class AddAsiteFeaturesSeed extends AbstractMigration
{
    public function up(): void
    {
        // Insert parent feature
        $this->execute("INSERT INTO feature (name) VALUES ('ASITE');");

        // Capture the inserted parent id
        $parentIdRow = $this->fetchRow("SELECT LAST_INSERT_ID() AS id");
        $parentId = (int) ($parentIdRow['id'] ?? 0);

        // Insert child feature with parent id
        $this->execute(sprintf(
            "INSERT INTO feature (parent_id, name) VALUES (%d, 'ASITE_FOLDERS');",
            $parentId
        ));
    }

    public function down(): void
    {
        $this->execute("DELETE FROM feature WHERE name = 'ASITE_FOLDERS'");
        $this->execute("DELETE FROM feature WHERE name = 'ASITE'");
    }
}
