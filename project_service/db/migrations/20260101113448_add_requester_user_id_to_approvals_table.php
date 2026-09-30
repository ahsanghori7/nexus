<?php
declare(strict_types=1);

use Phinx\Migration\AbstractMigration;

final class AddRequesterUserIdToApprovalsTable extends AbstractMigration
{
    /**
     * Migrate Up.
     */
    public function up(): void
    {
        $table = $this->table('approvals');

        if (!$table->hasColumn('requester_user_id')) {
            $table->addColumn('requester_user_id', 'integer', [
                'signed' => false,
                'null' => true,
                'after' => 'user_id'
            ]);
        }

        $table->update();
    }

    /**
     * Migrate Down.
     */
    public function down(): void
    {
        $table = $this->table('approvals');

        if ($table->hasColumn('requester_user_id')) {
            $table->removeColumn('requester_user_id');
        }

        $table->update();
    }
}
