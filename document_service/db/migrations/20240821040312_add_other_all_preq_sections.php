<?php

declare(strict_types=1);

use Phinx\Migration\AbstractMigration;

final class AddOtherAllPreqSections extends AbstractMigration
{
    protected $tableName = 'document_default_certificates';
    protected $otherOption = 'Other';

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
    public function change(): void
    {
        $sql = sprintf("SELECT * FROM %s", $this->tableName);
        $allRecords = $this->getAdapter()->fetchAll($sql);

        $sectionsAlreadyWithOtherOption = [];
        foreach ($allRecords as $record) {
            if ($record['name'] === $this->otherOption) {
                $sectionsAlreadyWithOtherOption[] = $record['subtype'];
            }
        }

        $sections = array_filter($allRecords, function ($section) use ($sectionsAlreadyWithOtherOption) {
            return !in_array($section['subtype'], $sectionsAlreadyWithOtherOption);
        });

        $sections = array_map(function ($section) {
            return $section['subtype'];
        }, $sections);

        $sections = array_unique($sections);

        foreach ($sections as $section) {
            $result["id"] = null;
            $result["subtype"] = intval($section);
            $result["parent_id"] = null;
            $result["name"] = $this->otherOption;
            $this->table($this->tableName)->insert([$result])->update();
        }
    }
}
