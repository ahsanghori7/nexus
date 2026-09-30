<?php

namespace Core\Service;

use Core\Data\Shape;
use Core\Middleware\Exception as MiddlewareException;
use Mpdf\Config\ConfigVariables;
use Mpdf\Mpdf;

class PdfService extends RestService
{

    /**
     * @var Mpdf
     */
    protected Mpdf $client;

    /**
     * @var array
     */
    protected array $pdf_options = [];

    /**
     * @return Mpdf
     * @throws \Mpdf\MpdfException
     */
    public function getClient(): Mpdf
    {
        return $this->client = new Mpdf($this->getPdfOptions());
    }

    /**
     * @return array
     */
    public function getDefaultPdfOptions(): array
    {
        return [
            'fontDir' => (new ConfigVariables())->getDefaults()['fontDir'],
            'default_font_size' => 8,
            'default_font'      => 'Arial',
            'mode'              => 'utf-8',
            'format'            => 'A4',
        ];
    }

    /**
     * @param array $options
     * @return void
     */
    public function setPdfOptions(array $options): void
    {
        $this->pdf_options = array_merge($this->getDefaultPdfOptions(), $options);
    }

    /**
     * @return array
     */
    public function getPdfOptions(): array
    {
        if(!$this->pdf_options){
            $this->pdf_options = $this->getDefaultPdfOptions();
        }
        return $this->pdf_options;
    }

    /**
     * @param string $optionKey
     * @return mixed|null
     */
    public function getPdfOption(string $optionKey): mixed
    {
        return $this->pdf_options[$optionKey] ?? null;
    }

    /**
     * @param string $pdfName
     * @param Shape $pdfData
     * @return array
     * @throws MiddlewareException
     * @throws \Mpdf\MpdfException
     */
    public function generatePDF(Shape $pdfData, string $pdfName): array
    {
        $mpdf = $this->getClient();
        $files = glob($this->getPdfOption('files_location'));
        foreach ($files as $file) {
            ob_start();
            include $file;
            $output = ob_get_clean();
            if ($output) {
                $mpdf->AddPage('P', '', '', '', '', 18, 18, 15, 20, 8, 10);
                if (!empty($this->getPdfOption('parse_head_css'))) {
                    $css = '';
                    if (preg_match_all('#<style[^>]*>(.*?)</style>#is', strval($output), $matches) && isset($matches[1])) {
                        $css = implode("\n", $matches[1]);
                    }
                    if ($css) {
                        $mpdf->WriteHTML($css, 1);
                    }
                    $bodyHtml = $output;
                    if (preg_match('#<body[^>]*>(.*?)</body>#is', strval($output), $bm) && isset($bm[1])) {
                        $bodyHtml = $bm[1];
                    }
                    $mpdf->WriteHTML($bodyHtml, 2);
                } else {
                    $mpdf->WriteHTML($output, 2);
                }
            }
        }
        $file_save = sprintf("%s/%s.pdf",$this->getPdfOption('save_location'), $pdfName);
        try {
            $mpdf->Output($file_save, 'F');
        } catch (\Exception $e) {
            throw new MiddlewareException("pdfGenerateError", $e->getMessage());
        }

        return [
            'path' => $file_save,
            'name' => "$pdfName.pdf",
            'type' => 'application/pdf',
            'size' => filesize($file_save)
        ];
    }


    /**
     * This functionality is intended solely for debugging the PDF, enabling direct output to the browser.
     */
    public function outputPDF(array $pdf_data)
    {
        if ($pdf_data && file_exists($pdf_data['path'])) {
            header('Content-Type: application/pdf');
            header(sprintf("Content-disposition: inline;filename=%s", basename($pdf_data['name'])));
            echo file_get_contents($pdf_data['path']);
            exit;
        }
    }

}
