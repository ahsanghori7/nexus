<?php

declare(strict_types=1);

use Phinx\Migration\AbstractMigration;

final class ApprovalType extends AbstractMigration
{

    public function up(): void
    {
        $this->execute("
            INSERT INTO approval_type (type, display_label) VALUES ('supplier_list', 'Supplier List Approval')
        ");
    }

    public function down(): void
    {
        $this->execute("
            DELETE FROM approval_type WHERE type IN ('supplier_list')
        ");
    }
}
