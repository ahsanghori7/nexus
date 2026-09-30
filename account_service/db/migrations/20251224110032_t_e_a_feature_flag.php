<?php
declare(strict_types=1);

use Phinx\Migration\AbstractMigration;

final class TEAFeatureFlag extends AbstractMigration
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
    public function up(): void
    {
        // Insert Tender Recommendation feature entry
        $this->execute("
            INSERT INTO feature (parent_id, name)
            VALUES (NULL, 'TENDER_INQUIRY_APPROVAL')
        ");
    }


    public function down(): void
    {
        // Remove Tender Recommendation feature entry
        $this->execute("
            DELETE FROM feature
            WHERE name = 'TENDER_INQUIRY_APPROVAL'
        ");
    }
}
