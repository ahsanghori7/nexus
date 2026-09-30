<?php

declare(strict_types=1);

use Phinx\Migration\AbstractMigration;

final class AddNumberDocumentIntoMeta extends AbstractMigration
{
    protected $tableName = 'document';
    protected $documentName = 'McLaren - Enquiry Letter';
    protected $type = 2;
    protected $subtype = 5;
    protected $newMetaProp = "number_document";

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
    public function up()
    {
        $row = $this->fetchRow("
            SELECT id, meta
            FROM {$this->tableName}
            WHERE name = '{$this->documentName}'
            AND type = '{$this->type}'
            AND subtype = '{$this->subtype}'
            LIMIT 1
        ");

        if ($row) {
            $meta = json_decode($row['meta'], true);

            if (is_array($meta)) {
                $meta[$this->newMetaProp] = true;
                $metaUpdated = json_encode($meta, JSON_UNESCAPED_UNICODE);
                $this->execute("
                    UPDATE {$this->tableName}
                    SET meta = '" . addslashes($metaUpdated) . "'
                    WHERE id = {$row['id']}
                ");
            }
        }
    }

    public function down()
    {
        $row = $this->fetchRow("
            SELECT id, meta
            FROM {$this->tableName}
            WHERE name = '{$this->documentName}'
            AND type = '{$this->type}'
            AND subtype = '{$this->subtype}'
            LIMIT 1
        ");

        if ($row) {
            $meta = json_decode($row['meta'], true);

            if (isset($meta[$this->newMetaProp])) {
                unset($meta[$this->newMetaProp]);
            }

            $metaUpdated = json_encode($meta, JSON_UNESCAPED_UNICODE);

            $this->execute("
            UPDATE {$this->tableName}
            SET meta = '" . addslashes($metaUpdated) . "'
            WHERE id = {$row['id']}
        ");
        }
    }
}
