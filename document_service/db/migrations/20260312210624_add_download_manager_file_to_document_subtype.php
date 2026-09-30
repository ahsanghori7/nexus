<?php
declare(strict_types=1);

use Phinx\Migration\AbstractMigration;

final class AddDownloadManagerFileToDocumentSubtype extends AbstractMigration
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
                        'uid'   => 'download_manager_file',
                        'label' => 'Download Manager File',
                    ],
                ])
                ->saveData();
        }
    }

    public function down(): void
    {
        $this->execute(
            "DELETE FROM document_subtype WHERE uid = 'download_manager_file'"
        );
    }
}
