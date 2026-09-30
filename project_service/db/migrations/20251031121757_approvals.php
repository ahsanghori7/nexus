<?php
declare(strict_types=1);

use Phinx\Migration\AbstractMigration;

final class Approvals extends AbstractMigration
{
    public function up(): void
    {
        $table = $this->table('approval_statuses', ['id' => false, 'primary_key' => 'id']);
        $table->addColumn('id', 'integer', ['signed' => true, 'identity' => true])
            ->addColumn('label', 'string', ['limit' => 100, 'null' => false])
            ->create();

        $this->table('approval_statuses')
        ->insert([
            ['id' => 1, 'label' => 'Rejected'],
            ['id' => 2, 'label' => 'Approved'],
            ['id' => 3, 'label' => 'Pending']
        ])
        ->save();

        $table = $this->table('approvals', ['id' => false, 'primary_key' => 'id']);
        $table->addColumn('id', 'integer', ['signed' => true, 'identity' => true])
            ->addColumn('user_id', 'integer', ['signed' => true])
            ->addColumn('entity_type', 'string', ['limit' => 100])
            ->addColumn('entity_id', 'integer')
            ->addColumn('status_id', 'integer', ['signed' => true])
            ->addColumn('comment', 'text', ['null' => true, 'limit' => 65535])
            ->addColumn('created_at', 'timestamp', ['default' => 'CURRENT_TIMESTAMP'])
            ->addColumn('updated_at', 'timestamp', ['default' => 'CURRENT_TIMESTAMP'])
            ->addForeignKey('status_id', 'approval_statuses', 'id', ['delete' => 'CASCADE', 'update' => 'CASCADE'])
            ->create();
    }

    public function down(): void
    {
        $this->table('approval_statuses')->drop()->save();
        $this->table('approvals')->drop()->save();
    }
}
