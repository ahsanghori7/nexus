<?php

declare(strict_types=1);

use Phinx\Migration\AbstractMigration;
use App\Infrastructure\Environment as Env;

final class EnquiryLetterWording extends AbstractMigration
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
        $table       = $this->table('document');
        $environment = Env::getValue("ENVIRONMENT", "production");
        $type        = 2; // contractual
        $subtype     = 5; // custom tender

        $data = [
            [
                'name'      => 'Enquiry Letter Wording (C-Link Mark-Up)',
                'type'      => $type,
                'subtype'   => $subtype,
                'status'    => 1,
                's3_key'    => "$environment/templates/tenders/mclaren/Enquiry Letter Wording (C-Link Mark-Up).json",
                's3_bucket' => 'document',
                'meta'      => '{"config": {"slug": "mclaren_enquiry_letter","version": "1.0"},"document": {"version": "1.0.0"}}'
            ]
        ];

        $table->insert($data)->save();
    }

    /**
     * Migrate Down.
     */
    public function down(): void
    {
        $environment = Env::getValue("ENVIRONMENT", "production");

        // Delete the specific row
        $this->execute("
            DELETE FROM document
            WHERE name = 'Enquiry Letter Wording (C-Link Mark-Up)'
              AND s3_key = '$environment/templates/tenders/mclaren/Enquiry Letter Wording (C-Link Mark-Up).json'
        ");
    }
}
