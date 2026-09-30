<?php

declare(strict_types=1);

use Phinx\Migration\AbstractMigration;

final class RemoveAccountAndApprovalTypeFromApprovalLevel extends AbstractMigration
{
    public function up(): void
    {
        $table = $this->table('approval_level');
        if (!$table->hasColumn('account_id') || !$table->hasColumn('approval_type_id')) {
            return;
        }

        $this->execute(<<<'SQL'
INSERT INTO approval_configuration (
  account_id,
  approval_type_id,
  allow_requester_self_approval,
  consolidate_duplicate_approver_notifications,
  auto_complete_lower_approvals
)
SELECT DISTINCT
  al.account_id,
  al.approval_type_id,
  0,
  0,
  0
FROM approval_level al
INNER JOIN approval_type at ON at.id = al.approval_type_id
WHERE al.account_id IS NOT NULL
  AND NOT EXISTS (
    SELECT 1
    FROM approval_configuration ac
    WHERE ac.account_id = al.account_id
      AND ac.approval_type_id = al.approval_type_id
  )
SQL);
    }

    public function down(): void
    {
        if (!$this->hasTable('approval_configuration')) {
            return;
        }

        $table = $this->table('approval_level');
        if ($table->hasColumn('approval_config_id')) {
            return;
        }

        $this->execute('DELETE FROM approval_configuration');
    }
}
