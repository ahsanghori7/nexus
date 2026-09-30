<?php
declare(strict_types=1);

use Phinx\Migration\AbstractMigration;

final class CreateDocumentProviderFolder extends AbstractMigration
{
    public function up(): void
    {
        $table = $this->table('document_provider_folder');
        $table->addColumn('provider_id', 'integer', ['signed' => false])
            ->addColumn('identifier', 'string', ['limit' => 64])
            ->addColumn('folder_name', 'string', ['limit' => 255])
            ->addColumn('created_at', 'timestamp', ['default' => 'CURRENT_TIMESTAMP'])
            ->addColumn('updated_at', 'timestamp', ['default' => 'CURRENT_TIMESTAMP'])
            ->addIndex(['provider_id', 'identifier'], ['unique' => true])
            ->create();

        $asiteProviderId = 3; // Asite provider id

        $defaults = [
            ['provider_id' => $asiteProviderId, 'identifier' => 'ND01', 'folder_name' => "ND01 - Schedule of Employer's Requirements"],
            ['provider_id' => $asiteProviderId, 'identifier' => 'ND02', 'folder_name' => "ND02 - Contractor's Proposals"],
            ['provider_id' => $asiteProviderId, 'identifier' => 'ND03', 'folder_name' => "ND03 - Main Contract Modifications Schedule"],
            ['provider_id' => $asiteProviderId, 'identifier' => 'ND04', 'folder_name' => "ND04 - Main Contract Particulars"],
            ['provider_id' => $asiteProviderId, 'identifier' => 'ND05', 'folder_name' => "ND05 - Main Contract Preliminaries"],
            ['provider_id' => $asiteProviderId, 'identifier' => 'ND06', 'folder_name' => "ND06 - Main Contract Preambles"],
            ['provider_id' => $asiteProviderId, 'identifier' => 'ND07', 'folder_name' => "ND07 - Planning Conditions and Reserved Matters"],
            ['provider_id' => $asiteProviderId, 'identifier' => 'ND08', 'folder_name' => "ND08 - Local Authority Restrictions"],
            ['provider_id' => $asiteProviderId, 'identifier' => 'ND09', 'folder_name' => "ND09 - Extracts from the Construction Phase Plan"],
            ['provider_id' => $asiteProviderId, 'identifier' => 'ND10', 'folder_name' => "ND10 - Form(s) of Collateral Warranty from Subcontractor"],
            ['provider_id' => $asiteProviderId, 'identifier' => 'ND11', 'folder_name' => "ND11 - Third Party Rights Schedule from Sub-Contractor"],
            ['provider_id' => $asiteProviderId, 'identifier' => 'ND18', 'folder_name' => 'ND18 - Site Plan'],
            ['provider_id' => $asiteProviderId, 'identifier' => 'ND19', 'folder_name' => 'ND19 - Logistics Plan'],
            ['provider_id' => $asiteProviderId, 'identifier' => 'ND20', 'folder_name' => 'ND20 - Craneage Plan (If provided by MCL)'],
            ['provider_id' => $asiteProviderId, 'identifier' => 'ND21', 'folder_name' => 'ND21 - Craneage Conditions'],
            ['provider_id' => $asiteProviderId, 'identifier' => 'ND22', 'folder_name' => 'ND22 - Scaffold by Contractor (Schedule and Plan)'],
            ['provider_id' => $asiteProviderId, 'identifier' => 'ND23', 'folder_name' => 'ND23 - Scaffold Conditions'],
            ['provider_id' => $asiteProviderId, 'identifier' => 'ND24', 'folder_name' => 'ND24 - Hoist(s) by Contractor (Schedule and Plan)'],
            ['provider_id' => $asiteProviderId, 'identifier' => 'ND25', 'folder_name' => 'ND25 - Hoist Conditions'],
            ['provider_id' => $asiteProviderId, 'identifier' => 'ND26', 'folder_name' => "ND26 - Employer's Site Specific Procedures and Rules"],
            ['provider_id' => $asiteProviderId, 'identifier' => 'ND27', 'folder_name' => 'ND27 - Temporary Services by Contractor (Schedule and Plan'],
            ['provider_id' => $asiteProviderId, 'identifier' => 'ND28', 'folder_name' => 'ND28 - Information Protocol'],
            ['provider_id' => $asiteProviderId, 'identifier' => 'ND29', 'folder_name' => 'ND29 - McLaren SHWE Requirements for Subcontractors'],
            ['provider_id' => $asiteProviderId, 'identifier' => 'ND30', 'folder_name' => 'ND30 - Defects Protocol'],
            ['provider_id' => $asiteProviderId, 'identifier' => 'ND31', 'folder_name' => 'ND31 - BIM Responsibility Matrix'],
            ['provider_id' => $asiteProviderId, 'identifier' => 'ND32', 'folder_name' => 'ND32 - Snagging Clearance Protocol'],
            ['provider_id' => $asiteProviderId, 'identifier' => 'ND33', 'folder_name' => 'ND33 - Materials and Personnel Management System Requirements'],
            ['provider_id' => $asiteProviderId, 'identifier' => 'ND34', 'folder_name' => 'ND34 - Site Clearance Protocol'],
            ['provider_id' => $asiteProviderId, 'identifier' => 'ND35', 'folder_name' => 'ND35 - Daywork Protocol'],
            ['provider_id' => $asiteProviderId, 'identifier' => 'ND36', 'folder_name' => 'ND36 - Materials Vesting Certificate'],
        ];

        $table->insert($defaults)->save();
    }

    public function down(): void
    {
        if ($this->hasTable('document_provider_folder')) {
            $table = $this->table('document_provider_folder');
            $table->drop()->save();
        }
    }
}
