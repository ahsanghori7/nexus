<?php


namespace App\Cron;

use App\Api\Aws\Sns;
use App\Api\Document;
use App\core\Environment as Env;

class DocumentUnmapped
{

    /**
     * @param int $deleted
     * @throws \Exception
     */
    public static function sendDeletedInformation(int $deleted = 0) {

        $message = "Deleted unmapped structural documents: " . $deleted;
        $message .= "\nEnvironment: " . Env::getValue("ENVIRONMENT");
        Sns::send("info_documents_unmapped", $message);
    }

    public function process()
    {
        if($total = Document::deleteUnMapped(Document::DOCUMENT_STRUCTURAL_TYPE)){
            self::sendDeletedInformation($total);
        }
    }

}
