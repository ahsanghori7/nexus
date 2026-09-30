<?php
declare(strict_types=1);

use Phinx\Migration\AbstractMigration;

final class CreateNotifications extends AbstractMigration
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
        $table = $this->table('notifications', ['id' => false, 'primary_key' => 'id']);
        $table->addColumn('id', 'biginteger', ['identity' => true, 'signed' => false])
              ->addColumn('account_id', 'biginteger', ['signed' => false])
              ->addColumn('project_id', 'biginteger', ['signed' => false, 'null' => true])
              ->addColumn('receiver_user_id', 'biginteger', ['signed' => false])
              ->addColumn('type', 'string', ['limit' => 255])
              ->addColumn('title', 'string', ['limit' => 255])
              ->addColumn('message', 'text', ['null' => true])
              ->addColumn('target_type', 'string', ['limit' => 255, 'null' => true])
              ->addColumn('target_id', 'biginteger', ['signed' => false, 'null' => true])
              ->addColumn('target_url', 'string', ['limit' => 255, 'null' => true])
              ->addColumn('read_at', 'timestamp', ['null' => true])
              ->addColumn('created_at', 'timestamp', ['default' => 'CURRENT_TIMESTAMP'])
              ->addIndex(['receiver_user_id', 'created_at'])
              ->create();
    }
}
