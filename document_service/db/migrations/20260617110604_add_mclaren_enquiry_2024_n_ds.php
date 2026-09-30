<?php
declare(strict_types=1);

use Phinx\Migration\AbstractMigration;

final class AddMclarenEnquiry2024NDs extends AbstractMigration
{
    public function up(): void
    {
        $asiteProviderId = 3;

        $this->table('document_provider_folder')
            ->insert([
                [
                    'provider_id' => $asiteProviderId,
                    'identifier' => 'ND292024',
                    'folder_name' => 'ND29 - McLaren SHEQ',
                ],
                [
                    'provider_id' => $asiteProviderId,
                    'identifier' => 'ND362024',
                    'folder_name' => 'ND36 - Sustainability Minimum Requirements',
                ],
                [
                    'provider_id' => $asiteProviderId,
                    'identifier' => 'ND372024',
                    'folder_name' => 'ND37 - Materials Vesting Certificate',
                ],
            ])
            ->saveData();
    }

    public function down(): void
    {
        $this->execute(
            "DELETE FROM document_provider_folder
             WHERE provider_id = 3
             AND identifier IN ('ND292024', 'ND362024', 'ND372024')"
        );
    }
}
