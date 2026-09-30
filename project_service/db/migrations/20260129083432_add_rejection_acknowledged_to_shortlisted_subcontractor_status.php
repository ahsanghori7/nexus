<?php
declare(strict_types=1);

use Phinx\Migration\AbstractMigration;

final class AddRejectionAcknowledgedToShortlistedSubcontractorStatus extends AbstractMigration
{
    public function up(): void
    {
        $this->table('shortlisted_subcontractor')
            ->changeColumn('status', 'enum', [
                'values'  => [
                    'Draft',
                    'Pending',
                    'Approved',
                    'Rejected',
                    'Rejection Acknowledged'
                ],
                'default' => 'Draft',
                'null'    => false
            ])
            ->save();
    }

    public function down(): void
    {
        $this->table('shortlisted_subcontractor')
            ->changeColumn('status', 'enum', [
                'values'  => [
                    'Draft',
                    'Pending',
                    'Approved',
                    'Rejected'
                ],
                'default' => 'Draft',
                'null'    => false
            ])
            ->save();
    }
}
