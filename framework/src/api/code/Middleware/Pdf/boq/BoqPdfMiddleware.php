<?php

namespace Api\Middleware\Pdf\boq;

use Core\Config;
use Core\Middleware\ServiceMiddleware;
use Core\Service\Manager;

class BoqPdfMiddleware extends ServiceMiddleware
{

    public const SERVICE = 'pdf';

    /**
     * @param string $pdfDataKey
     * @return \Closure
     */
    public static function outputPDF(string $pdfDataKey = "pdf")
    {
        return function ($action) use ($pdfDataKey) {
            self::getService()->outputPDF($action->get($pdfDataKey));
        };
    }

    /**
     * @param string $pdfName
     * @param string $saveKey
     * @param string $pdf_type
     * @return callable
     */
    public static function generateAddendumPDF(string $pdfName = 'Tender Addendum', string $saveKey = "pdf", string $pdf_type = "addendum"): callable
    {
        return function ($action) use ($pdfName, $saveKey, $pdf_type){
            self::getService()->setPdfOptions([
                'files_location' => __DIR__ . "/files/$pdf_type.php",
                'save_location'  => Config::get('boq.pdf.save.tmp'),
            ]);
            $action->set($saveKey, self::getService()->generatePDF($action->get("pdf_data"), $pdfName));
        };
    }

    /**
     * @param string $tmpDataKey
     * @return Callable
     */
    public static function cleanTmpFile(string $tmpDataKey): Callable
    {
        return function ($action) use ($tmpDataKey) {
            $path = $action->get($tmpDataKey)['path'] ?? null;
            if(file_exists($path)){
                unlink($path);
                gc_collect_cycles();
            }
        };
    }

    /**
     * @param string $save_path
     * @return Callable
     */
    public static function uploadToS3(string $save_path): Callable
    {
        return function($action) use ($save_path) {
            Manager::getService("s3")->upload([
                'tmp_name' => $action->get("pdf.path"),
                'name'     => $action->get("pdf.name"),
                'type'     => "pdf",
                'size'     => filesize($action->get("pdf.path"))
            ], 'document', $save_path);
        };
    }

    /**
     * @param string $document_path
     * @param string $saveKey
     * @return Callable
     */
    public static function getS3UploadedKey(string $document_path, string $saveKey = 'uploaded_key'): Callable
    {
        return function($action) use ($document_path, $saveKey) {
            $action->set($saveKey, Manager::getService("s3")->getKey($action->get("pdf.name"), $document_path));
        };
    }


}
