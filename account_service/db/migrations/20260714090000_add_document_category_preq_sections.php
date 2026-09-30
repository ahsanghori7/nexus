<?php

declare(strict_types=1);

use Phinx\Migration\AbstractMigration;

final class AddDocumentCategoryPreqSections extends AbstractMigration
{
    protected $documentsParentCode = 'documents';

    protected $newSections = [
        ['code' => 'accreditation', 'name' => 'Accreditations'],
        ['code' => 'management-system', 'name' => 'Management System Procedures'],
        ['code' => 'health-safety', 'name' => 'Health & Safety'],
        ['code' => 'health-safety-environmental-qualifications', 'name' => 'Health, Safety & Environmental Qualifications'],
        ['code' => 'environmental', 'name' => 'Environmental'],
        ['code' => 'quality', 'name' => 'Quality'],
        ['code' => 'example-documents', 'name' => 'Example Documents'],
    ];

    public function up(): void
    {
        $documentsParent = $this->getAdapter()->fetchRow(
            "SELECT id FROM prequalification_section WHERE code = '{$this->documentsParentCode}'"
        );
        if (!$documentsParent) {
            die("prequalification_section has no '{$this->documentsParentCode}' row - cannot attach new sections to it\n");
        }
        $documentsParentId = (int) $documentsParent['id'];

        $existingCodes = array_column(
            $this->getAdapter()->fetchAll("SELECT code FROM prequalification_section"),
            'code'
        );

        $toInsert = array_values(array_filter($this->newSections, function ($section) use ($existingCodes) {
            return !in_array($section['code'], $existingCodes, true);
        }));

        if ($toInsert) {
            $this->table('prequalification_section')
                ->insert($toInsert)
                ->save();
        }

        $codes = array_column($this->newSections, 'code');
        $codesText = "'" . implode("','", $codes) . "'";

        $this->execute("INSERT INTO prequalification_section_mapping
                (parent_id, section_id, account_id, status, created_at, updated_at)
            SELECT $documentsParentId, ps.id, accounts.account_id, 0, NOW(), NOW()
            FROM prequalification_section ps
            CROSS JOIN (
                SELECT DISTINCT account_id
                FROM prequalification_section_mapping
                WHERE section_id = $documentsParentId
            ) accounts
            WHERE ps.code IN ($codesText)
            AND NOT EXISTS (
                SELECT 1 FROM prequalification_section_mapping psm
                WHERE psm.account_id = accounts.account_id
                AND psm.section_id = ps.id
            )"
        );
    }

    public function down(): void
    {
        $codes = array_column($this->newSections, 'code');
        $codesText = "'" . implode("','", $codes) . "'";

        $this->execute("DELETE psm FROM prequalification_section_mapping psm
            JOIN prequalification_section ps ON ps.id = psm.section_id
            WHERE ps.code IN ($codesText)"
        );

        $this->execute("DELETE FROM prequalification_section WHERE code IN ($codesText)");
    }
}
