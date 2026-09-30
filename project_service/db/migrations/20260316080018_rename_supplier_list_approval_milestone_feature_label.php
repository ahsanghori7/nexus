<?php
declare(strict_types=1);

use Phinx\Migration\AbstractMigration;

final class RenameSupplierListApprovalMilestoneFeatureLabel extends AbstractMigration
{
    public function up(): void
    {
        $this->execute(
            "UPDATE milestone SET feature_label = 'SUBCONTRACTOR_LIST_APPROVAL' WHERE feature_label = 'SUPPLIER_LIST_APPROVAL'"
        );
    }
}
