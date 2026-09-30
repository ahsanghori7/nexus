<?php
declare(strict_types=1);

use Phinx\Migration\AbstractMigration;

final class QuickTenderRenamed extends AbstractMigration
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
        $this->execute("
            UPDATE document
            SET name = 'Invitation to Tender'
            WHERE name = 'Quick Tender' and parent_id = 0 and subtype = 3
        ");
    }
}
