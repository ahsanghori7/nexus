<?php

declare(strict_types=1);

use Phinx\Migration\AbstractMigration;

final class AddTenderEnquiryApprovalType extends AbstractMigration
{
    public function up(): void
    {
        $this->execute("
            INSERT INTO approval_type (type, display_label) VALUES ('tender_enquiry', 'Tender Enquiry Approval')
        ");
    }

    public function down(): void
    {
        $this->execute("
            DELETE FROM approval_type WHERE type = 'tender_enquiry'
        ");
    }
}
