<?php

declare(strict_types=1);

use Phinx\Migration\AbstractMigration;
use App\Infrastructure\Environment as Env;

final class EasyTenderTemplate extends AbstractMigration
{
    public function change(): void
    {
        $table       = $this->table('document');
        $environment = Env::getValue('ENVIRONMENT', 'production');
        $type        = 2; // contractual
        $subtype     = 3; // tender asset - available to all users

        $data = [
            [
                'parent_id' => 0,
                'name'      => 'Easy Tender Template',
                'type'      => $type,
                'subtype'   => $subtype,
                'status'    => 1,
                's3_key'    => "$environment/templates/tenders/easy-tender-template.json",
                's3_bucket' => 'document',
                'meta'      => '{"config": {"slug": "easy_tender_template", "version": "1.0"}, "document": {"version": "1.0.0"}}',
            ],
        ];

        $table->insert($data)->save();
    }
}
