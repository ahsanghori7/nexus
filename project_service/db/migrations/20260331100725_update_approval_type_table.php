<?php
declare(strict_types=1);

use Phinx\Migration\AbstractMigration;

final class UpdateApprovalTypeTable extends AbstractMigration
{
    public function change(): void
    {
        if ($this->hasTable('approval_type')) {
            $table = $this->table('approval_type');
            $table->addColumn('display_label', 'string', ['limit' => 255])
                ->update();

            $table->renameColumn('label', 'type')->save();

            $this->execute("UPDATE approval_type set display_label = 'Tender Recommendation Approval' where type = 'tender_recommendation'");
            $this->execute("UPDATE approval_type set display_label = 'Order Approval' where type = 'order'");

        }
    }
}
