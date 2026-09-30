<?php

declare(strict_types=1);

use Phinx\Migration\AbstractMigration;

final class WidenProjectNameForIfs extends AbstractMigration
{
    public function up(): void
    {
        $this->execute(
            "ALTER TABLE `project`
                MODIFY `name` VARCHAR(150)
                CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL"
        );

        $this->execute(
            "ALTER TABLE `project`
                MODIFY `reference` VARCHAR(255)
                CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL"
        );
    }

    public function down(): void
    {
        $this->execute(
            "ALTER TABLE `project`
                MODIFY `reference` VARCHAR(255)
                CHARACTER SET latin1 COLLATE latin1_general_ci NULL"
        );

        $this->execute(
            "ALTER TABLE `project`
                MODIFY `name` VARCHAR(100)
                CHARACTER SET latin1 COLLATE latin1_general_ci NOT NULL"
        );
    }
}
