<?php
declare(strict_types=1);

use Phinx\Migration\AbstractMigration;

final class AddNd116AsiteLinkToDocumentProviderFolder extends AbstractMigration
{
    public function up(): void
    {
        $asiteProviderId = 3;

        $this->table('document_provider_folder')
            ->insert([
                [
                    'provider_id' => $asiteProviderId,
                    'identifier' => 'ND116',
                    'folder_name' => 'ND116 - Section 106 Requirements',
                ],
            ])
            ->saveData();
    }

    public function down(): void
    {
        $this->execute(
            "DELETE FROM document_provider_folder WHERE provider_id = 3 AND identifier = 'ND116'"
        );
    }
}
