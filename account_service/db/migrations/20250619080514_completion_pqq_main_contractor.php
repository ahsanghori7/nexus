<?php
declare(strict_types=1);

use Phinx\Migration\AbstractMigration;

final class CompletionPqqMainContractor extends AbstractMigration
{
    /**
     * Change Method.
     *
     * Write your reversible migrations using this method.
     *
     * More information on writing migrations is available here:
     * https://book.cakephp.org/phinx/0/en/migrations.html#the-change-method
     *
     * Remember to call "create()" or "update()" and NOT "save()" when working
     * with the Table class.
     */
    public function change(): void
    {
        // Create table 'user_action_types'
        // This table will store different types of user actions related to PQQ completion requests.
        // It will include an ID and a label for the action type.
        // The ID will be used to reference this table in the user_action_notifications table.
        $userActionType = $this->table('user_action_types', ['id' => false, 'primary_key' => 'id']);
        $userActionType->addColumn('id', 'integer', ['signed' => true, 'identity' => true])
            ->addColumn('label', 'string', ['limit' => 255])
            ->create();

        // Insert initial data into 'user_action_types'
        // This will include a single action type for PQQ requests.
        // The ID is set to 1, and the label is 'PQQ Request'.
        $this->table('user_action_types')
            ->insert([
                ['id' => 1, 'label' => 'PQQ Request'],
            ])
            ->save();

        // Create table 'user_action_notifications'
        // This table will store notifications for user actions related to PQQ completion requests
        // and reminders for main contractors.
        // It will include fields for action ID, requester ID, receiver ID, status, and timestamps.
        // The action ID will reference the user_action_types table, and requester_id and receiver_id will reference the account table.
        $userActionNotify = $this->table('user_action_notifications', ['id' => false, 'primary_key' => 'id']);
        $userActionNotify->addColumn('id', 'integer', ['signed' => true, 'identity' => true])
            ->addColumn('action_id', 'integer', ['signed' => true])
            ->addColumn('requester_id', 'integer', ['signed' => true])
            ->addColumn('receiver_id', 'integer', ['signed' => true])
            ->addColumn('status', 'boolean', ['default' => 0, 'null' => false])
            ->addColumn('created_at', 'timestamp', ['default' => 'CURRENT_TIMESTAMP'])
            ->addColumn('updated_at', 'timestamp', ['default' => 'CURRENT_TIMESTAMP'])
            ->addForeignKey('action_id', 'user_action_types', 'id', ['delete' => 'CASCADE', 'update' => 'CASCADE'])
            ->addForeignKey('requester_id', 'user', 'id', ['delete' => 'CASCADE', 'update' => 'CASCADE'])
            ->addForeignKey('receiver_id', 'user', 'id', ['delete' => 'CASCADE', 'update' => 'CASCADE'])
            ->create();
    }
}
