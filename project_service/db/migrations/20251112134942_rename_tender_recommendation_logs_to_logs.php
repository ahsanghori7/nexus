<?php
declare(strict_types=1);

use Phinx\Migration\AbstractMigration;

final class RenameTenderRecommendationLogsToLogs extends AbstractMigration
{
    public function up(): void
    {
        if ($this->hasTable('tender_recommendation_logs') && !$this->hasTable('logs')) {
            $this->table('tender_recommendation_logs')->rename('logs')->save();
        }
    }

    public function down(): void
    {
        if ($this->hasTable('logs') && !$this->hasTable('tender_recommendation_logs')) {
            $this->table('logs')->rename('tender_recommendation_logs')->save();
        }
    }
}
