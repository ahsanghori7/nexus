<?php
declare(strict_types=1);

use Phinx\Migration\AbstractMigration;

final class AddIsMainContactToAccountUserMapping extends AbstractMigration
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
        $table = $this->table('account_user_mapping');

        // Add the is_main_contact boolean field
        $table->addColumn('is_main_contact', 'boolean', [
            'default' => false,
            'null' => false,
            'comment' => 'Indicates if this user is the main/primary contact for the account'
        ])
        ->update();
    }
}
