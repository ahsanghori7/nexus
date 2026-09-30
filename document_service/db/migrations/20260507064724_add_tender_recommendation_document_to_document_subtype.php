<?php
declare(strict_types=1);

use Phinx\Migration\AbstractMigration;

final class AddTenderRecommendationDocumentToDocumentSubtype extends AbstractMigration
{
    public function up(): void
    {
        $tableName = 'document_subtype';
        $lastRecord = $this->getAdapter()->fetchRow("SELECT id FROM $tableName ORDER BY id DESC LIMIT 1");
        $id = $lastRecord["id"] ?? false;

        if ($id) {
            $this->table($tableName)
                ->insert([
                    [
                        'id'    => intval($id) + 1,
                        'uid'   => 'tender_recommendation_document',
                        'label' => 'Tender Recommendation Document',
                    ],
                ])
                ->saveData();
        }
    }

    public function down(): void
    {
        $this->execute(
            "DELETE FROM document_subtype WHERE uid = 'tender_recommendation_document'"
        );
    }
}
