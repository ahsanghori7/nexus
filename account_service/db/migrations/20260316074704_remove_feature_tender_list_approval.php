<?php
declare(strict_types=1);

use Phinx\Migration\AbstractMigration;

final class RemoveFeatureTenderListApproval extends AbstractMigration
{
    public function up(): void
    {
        $this->execute("DELETE from feature WHERE name = 'SUPPLIER_LIST_APPROVAL'");
    }
}
