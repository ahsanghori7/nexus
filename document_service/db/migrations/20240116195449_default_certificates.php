<?php

declare(strict_types=1);

use Phinx\Migration\AbstractMigration;

final class DefaultCertificates extends AbstractMigration
{

    protected $tableName = 'document_subtype';

    protected $oldSubtypes = [
        'insurances' => 'Insurances',
        'accreditation' => 'Accreditations',
        'management-system' => 'Management System Procedures',
        'custom-certificate' => 'Additional certificate or accreditation',
    ];

    protected $newSubtypes = [
        'health-safety' => 'Health & Safety',
        'health-safety-environmental-qualifications' => 'Health, Safety & Environmental Qualifications',
        'environmental' => 'Environmental',
        'quality' => 'Quality',
        'example-documents' => 'Example Documents',
    ];

    protected $defaultCertificates = [
        'insurances' => [
            ['name' => 'Employers Liability'],
            ['name' => 'Public Liability'],
            ['name' => 'Products Liability'],
            ['name' => 'Professional Indemnity'],
            ['name' => 'Schedule Public Liability'],
            ['parent' => 'Schedule Public Liability', 'name' => 'Statement of Fact'],
            ['parent' => 'Schedule Public Liability', 'name' => 'Policy wording'],
            ['name' => 'Schedule Professional Indemnity'],
            ['parent' => 'Schedule Professional Indemnity', 'name' => 'Statement of Fact'],
            ['parent' => 'Schedule Professional Indemnity', 'name' => 'Policy wording'],
        ],
        'accreditation' => [
            ['name' => 'Constructionline'],
            ['name' => 'SafeContractor'],
            ['name' => 'CHAS'],
            ['name' => 'SMAS'],
            ['name' => 'Considerate constructors'],
            ['name' => 'Acclaim SSiP'],
            ['name' => 'FIRAS'],
            ['name' => 'ASFP'],
            ['name' => 'IFC Certification'],
            ['name' => 'Other'],
        ],
        'custom-certificate' => [],
        'management-system' => [
            ['name' => 'ISO 9001:2015'],
            ['name' => 'ISO 14001:2015'],
            ['name' => 'OHSAS 18001'],
            ['name' => 'Data Protection Policy'],
            ['name' => 'Anti Bribery Policy'],
            ['name' => 'UKAS'],
        ],
        'health-safety' => [
            ['name' => 'Health & safety policy'],
            ['name' => 'Health & safety policy statement'],
            ['name' => 'Health & safety manual'],
        ],
        'health-safety-environmental-qualifications' => [
            ['name' => 'CV for Health and Safety Manager / Consultant'],
            ['name' => 'CMIOSH'],
            ['name' => 'gradIOSH'],
            ['name' => 'NEBOSH'],
            ['name' => 'Other'],
        ],
        'environmental' => [
            ['name' => 'BS EN ISO 14001:2015'],
            ['name' => 'Sustainable Source Evidence'],
            ['name' => 'Environmental policy statement'],
            ['name' => 'Environmental advice'],
            ['name' => 'not ISO Accredited'],
        ],
        'quality' => [
            ['name' => 'Quality policy statement'],
            ['name' => 'Modern Slavery policy statement'],
            ['name' => 'IS0 90001'],
            ['name' => 'not ISO Accredited'],
        ],
        'example-documents' => [
            ['name' => 'Quality assessment evidence'],
            ['name' => 'Sample Method Statement'],
            ['name' => 'Sample Risk Assessment'],
            ['name' => 'Accident Reporting Form'],
        ]
    ];

    private function getLastIdInserted($tableName)
    {
        $lastRecord = $this->getAdapter()->fetchRow("SELECT id FROM $tableName ORDER BY id DESC LIMIT 1");
        return $lastRecord["id"] ?? false;
    }

    private function convertItemsToString($items)
    {
        return array_map(function ($item) {
            return "'" . $item . "'";
        }, $items);
    }

    private function checkOldSubtypesExists()
    {
        $uids = array_keys($this->oldSubtypes);
        $uidsText = $this->convertItemsToString($uids);
        $sql = sprintf("SELECT * FROM %s WHERE uid IN (%s)", $this->tableName, implode(",", $uidsText));
        $documentSubtypeAlreadyExists = $this->getAdapter()->fetchAll($sql);

        $table = $this->table($this->tableName);
        if (count($documentSubtypeAlreadyExists)) {
            foreach ($documentSubtypeAlreadyExists as $documentSubtype) {
                if (array_search($documentSubtype["uid"], $uids) === false) {
                    // Get last row inserted
                    $lastRecord = $this->getLastIdInserted($this->tableName);
                    if ($lastRecord) {
                        // Insert next row like this (Auto Increment does not available on this table)
                        $id = intval($lastRecord) + 1;
                        $uid = $documentSubtype["uid"];
                        $label = $this->oldSubtypes[$documentSubtype["uid"]];
                        $table->insert([['id' => $id, 'uid' => $uid, 'label' => $label]])->update();
                    }
                }
            }
        }
    }

    private function insertNewSubTypeData()
    {
        // Get last row inserted
        $lastRecord = $this->getLastIdInserted($this->tableName);

        $data = array_map(function ($value, $key) use (&$lastRecord) {
            // Insert next row like this (Auto Increment does not available on this table)
            if ($lastRecord) {
                $lastRecord++;
            } else {
                $lastRecord = 1;
            }
            $result = [
                "id" => $lastRecord,
                "uid" => $key,
                "label" => $value
            ];
            return $result;
        }, $this->newSubtypes, array_keys($this->newSubtypes));

        $table = $this->table($this->tableName);
        $table->insert($data)->update();
    }

    private function insertDefaultCertificates()
    {
        $uids = array_keys($this->oldSubtypes);
        $allUids = array_merge($uids, array_keys($this->newSubtypes));
        $allUidsText = $this->convertItemsToString($allUids);
        $sql = sprintf("SELECT * FROM %s WHERE uid IN (%s)", $this->tableName, implode(",", $allUidsText));
        $allDocumentSubtypes = $this->getAdapter()->fetchAll($sql);

        $tableDefaultCertificates = "document_default_certificates";
        foreach ($allDocumentSubtypes as $item) {
            if (isset($this->defaultCertificates[$item["uid"]])) {
                $certificatesInSection = $this->defaultCertificates[$item["uid"]];
                $lastParent = 0;
                foreach ($certificatesInSection as $certificate) {
                    $result["id"] = null; // Use it Auto Increment
                    $result["subtype"] = intval($item["id"]);
                    $result["parent_id"] = null;
                    $result["name"] = $certificate["name"];
                    $lastRecord = $lastParent ? $lastParent : $this->getLastIdInserted($tableDefaultCertificates);
                    if (isset($certificate["parent"])) {
                        $lastParent = $lastRecord;
                        $result["parent_id"] = intval($lastParent);
                    } else {
                        $lastParent = 0;
                    }
                    $this->table($tableDefaultCertificates)->insert([$result])->update();
                }
            }
        }
    }

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

        $documentSubtypeExists = $this->getAdapter()->hasTable($this->tableName);
        if (!$documentSubtypeExists) {
            die("Table $this->tableName does not exists\n");
        }

        //Create old subtypes for prequalification if they do not exist
        $this->checkOldSubtypesExists();

        //Set correct name for management-system subtype in case there is an old value for label
        $this->execute(
            'UPDATE document_subtype SET label = ? WHERE uid = ?',
            ['Management System Procedures', 'management-system']
        );

        // Insert new subtype records
        $this->insertNewSubTypeData();

        // Create table document_default_certificates
        $this->table('document_default_certificates', ['id' => false, 'primary_key' => ['id']])
            ->addColumn('id', 'integer', ['identity' => true])
            ->addColumn('subtype', 'integer', ['null' => false])
            ->addColumn('parent_id', 'integer', ['null' => true])
            ->addColumn('name', 'string', ['limit' => 100, 'null' => false])
            ->addForeignKey('subtype', $this->tableName, 'id', ['delete' => 'CASCADE', 'update' => 'CASCADE'])
            ->addForeignKey('parent_id', 'document_default_certificates', 'id', ['delete' => 'CASCADE', 'update' => 'CASCADE'])
            ->create();

        // Insert default certificates
        $this->insertDefaultCertificates();
    }
}
