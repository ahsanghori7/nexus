<?php
declare(strict_types=1);

use Phinx\Seed\AbstractSeed;

class TenderRecommendationSeeder extends AbstractSeed
{
    public function run(): void
    {
        // Reset table (safe for development re-seeding)
        $this->execute('SET FOREIGN_KEY_CHECKS = 0;');
        $this->execute('TRUNCATE TABLE tender_recommendation;');
        $this->execute('SET FOREIGN_KEY_CHECKS = 1;');

        $now = date('Y-m-d H:i:s');

        $data = [
            [
                'tender_id'      => 26914,   // must exist in tender table
                'transaction_id' => 3,       // must exist & belong to tender 26914
                'author_id'      => 101,     // soft FK -> user.id (other DB)
                'status'         => 'Draft',
                'created_at'     => $now,
                'updated_at'     => $now,
            ],
            [
                'tender_id'      => 26916,
                'transaction_id' => 2,
                'author_id'      => 102,
                'status'         => 'Shared',
                'created_at'     => $now,
                'updated_at'     => $now,
            ],
            [
                'tender_id'      => 26920,
                'transaction_id' => 1,
                'author_id'      => 103,
                'status'         => 'Approved',
                'created_at'     => $now,
                'updated_at'     => $now,
            ],
            [
                'tender_id'      => 26919,
                'transaction_id' => 9,
                'author_id'      => 104,
                'status'         => 'Rejected',
                'created_at'     => $now,
                'updated_at'     => $now,
            ],
        ];

        $this->table('tender_recommendation')->insert($data)->save();
    }
}
