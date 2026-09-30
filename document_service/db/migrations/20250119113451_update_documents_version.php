<?php

declare(strict_types=1);

use Phinx\Migration\AbstractMigration;

final class UpdateDocumentsVersion extends AbstractMigration
{
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
        $customOrderAsset = 6;
        $documents = [
            [
                "name" => "Culena Sub-Contract Order",
                "version" => "1.1",
            ],
            [
                "name" => "CJOS",
                "version" => "1.3",
            ],
        ];
        foreach ($documents as $document) {
            $docs = $this->fetchAll('SELECT * FROM document where name LIKE "%' . $document["name"] . '%" AND subtype = ' . $customOrderAsset);
            foreach ($docs as $doc) {
                if (isset($doc["meta"])) {
                    $did = $doc["id"];
                    $meta = json_decode($doc["meta"] ?? "", true);
                    $config = $meta["config"] ?? [];
                    $config["version"] = $document["version"];
                    $meta["config"] = $config;
                    $this->execute("UPDATE `document` SET meta = '" . json_encode($meta) . "' WHERE id = " . $did);
                }
            }
        }
    }
}
