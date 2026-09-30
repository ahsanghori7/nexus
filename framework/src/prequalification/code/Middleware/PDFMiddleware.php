<?php

namespace Prequalification\Middleware;

use Core\Data\Shape;
use Core\Service\Manager;
use Mpdf\Config\ConfigVariables;
use Core\Config;
use Core\System\Environment;
use setasign\Fpdi\Fpdi as FPDI;

class PDFMiddleware
{

    const MAIN_SECTION_ACCREDITATION = "accreditation";
    const MAIN_SECTION_ACCREDITATION_LABEL = "Accreditations";
    const CUSTOM_ACCREDITATION_SECTION = "custom-certificate";

    const SECTIONS_WITH_NOT_ISO_ACCREDITED = ["environmental", "quality"];

    const EXTENSION_PDF = "pdf";
    const EXTENSION_PNG = "png";
    const EXTENSION_JPG = "jpg";
    const INTERNAL_IMAGE_SCHEME = "var:";

    /**
     * @return callable
     */
    public static function setHeader(string $type = 'prequalification'): callable
    {
        return function ($action) use ($type) {
            ob_start();
            include __DIR__ . "/files/$type/header.php";
            $header = ob_get_clean();
            $action->set("header", self::sanitizeHtml($action, $header, 'prequalification_pdf_header'));
        };
    }

    /**
     * @param string $type
     * @return callable
     */
    public static function setFooter(string $type = 'prequalification'): callable
    {
        return function ($action) use ($type) {
            ob_start();
            include __DIR__ . "/files/$type/footer.php";
            $footer = ob_get_clean();
            $action->set("footer", self::sanitizeHtml($action, $footer, 'prequalification_pdf_footer'));
        };
    }

    /**
     * @return callable
     */
    public static function loadSectionCertificates(): callable
    {
        return function ($action) {
            $prequal = $action->get("prequalification");
            $documentSections = $action->get("document_sections");
            $certificates = [];
            if ($documentSections->count()) {
                foreach ($documentSections->getItemsAsArray() as $docSection) {
                    if ($docSection["uid"] === self::CUSTOM_ACCREDITATION_SECTION) {
                        $customDocuments = $prequal[$docSection["uid"]] ?? [];
                        if (isset($certificates[self::MAIN_SECTION_ACCREDITATION])) {
                            $accreditation = $certificates[self::MAIN_SECTION_ACCREDITATION];
                            $accreditation["files"] = array_merge($accreditation["files"], $customDocuments);
                            $accreditation["files"] = array_map(function ($file) {
                                $file["section"] = self::MAIN_SECTION_ACCREDITATION;
                                return $file;
                            }, $accreditation["files"]);
                            $certificates[self::MAIN_SECTION_ACCREDITATION] = $accreditation;
                        } else {
                            $certificates[self::MAIN_SECTION_ACCREDITATION] = [
                                'label' => SELF::MAIN_SECTION_ACCREDITATION_LABEL,
                                'files' => $customDocuments
                            ];
                        }
                    } else {
                        $certificates[$docSection["uid"]] = [
                            'label' => $docSection["label"],
                            'files' => $prequal[$docSection["uid"]] ?? []
                        ];
                    }
                }
            }
            $action->set("certificates", $certificates);
        };
    }

    /**
     * @return callable
     */
    public static function loadSectionCertificatesFiles(): callable
    {
        return function ($action) {
            /*
             * First section is the content summary
             * Client sections start from index 2
             */
            $section_number = 2;
            $certificates = $action->get("certificates");

            $aid = (int)$action->get("uriArgs.aid");
            $save_path = Config::getUrl('document.save.temp', strval($aid));

            $newCertificates = array_map(function ($cert) {
                $cert["files"] = [];
                return $cert;
            }, $certificates);

            foreach ($certificates as $certificate_key => &$certificate_data) {
                $has_valid_pdfs = false;
                /*
                 * Sections files and append them to the section
                 */
                if (!empty($certificate_data['files'])) {
                    foreach ($certificate_data['files'] as $key => &$value) {
                        if (is_array($value) && $value['file']) {
                            $value['file'] = str_replace($value['original_file'], urlencode($value['original_file']), $value['file']);
                            $save_to = $save_path . "/" . $value['original_file'];
                            try {
                                S3Middleware::downloadFile('document', $value['s3_key'], $save_to)($value['s3_key'], $save_to);
                                $path_info = pathinfo($value['file']);
                                if (isset($path_info['extension']) && in_array($path_info['extension'], [self::EXTENSION_PDF, self::EXTENSION_PNG, self::EXTENSION_JPG])) {
                                    $newCertificates[$certificate_key]['index'] = $section_number;
                                    $newCertificates[$certificate_key]['title'] = $newCertificates[$certificate_key]['label'];
                                    $newCertificates[$certificate_key]['section_label'] = "Section $section_number - " . $newCertificates[$certificate_key]['label'];
                                    $has_valid_pdfs = true;
                                }

                                if (isset($value["extra"])) {
                                    $extraOptional = $value["extra"];
                                    unset($value["extra"]);
                                    $newCertificates[$certificate_key]['files'][] = $value;

                                    foreach ($extraOptional as $optional) {
                                        $save_to = $save_path . "/" . $optional['original_file'];
                                        S3Middleware::downloadFile('document', $optional['s3_key'], $save_to)($optional['s3_key'], $save_to);
                                        $path_info = pathinfo($optional['file']);
                                        if (isset($path_info['extension']) && in_array($path_info['extension'], [self::EXTENSION_PDF, self::EXTENSION_PNG, self::EXTENSION_JPG])) {
                                            $newCertificates[$certificate_key]['files'][] = $optional;
                                            $has_valid_pdfs = true;
                                        }
                                    }
                                } else {
                                    $newCertificates[$certificate_key]['files'][] = $value;
                                }

                                if (!$has_valid_pdfs) {
                                    //remove invalid certificates
                                    unset($certificate_data['files'][$key]);
                                }
                            } catch (\Exception $e) {
                                $error = json_encode($optional);
                                error_log("Error for file $error with the message".$e->getMessage());
                            }
                        } elseif (in_array($certificate_key, self::SECTIONS_WITH_NOT_ISO_ACCREDITED)) {
                            $newCertificates[$certificate_key]['not_iso_docs'][] = $value;
                            $newCertificates[$certificate_key]['index'] = $section_number;
                            $newCertificates[$certificate_key]['title'] = $newCertificates[$certificate_key]['label'];
                            $newCertificates[$certificate_key]['section_label'] = "Section $section_number - " . $newCertificates[$certificate_key]['label'];
                            $has_valid_pdfs = true;
                        }
                    }
                } else {
                    unset($newCertificates[$certificate_key]);
                }
                if ($has_valid_pdfs) {
                    $section_number++;
                }
            }
            $action->set("sections", $newCertificates);
        };
    }

    /**
     * @return callable
     */
    public static function loadPDFLibrary(): callable
    {
        return function ($action) {
            $baseTempDir = rtrim(Config::get("document.save.tmp") ?: '/var/tmp', '/');
            $tempDir = $baseTempDir . '/mpdf';
            if (!is_dir($tempDir) && !mkdir($tempDir, 0755, true) && !is_dir($tempDir)) {
                throw new \RuntimeException("Unable to create mPDF temp directory: $tempDir");
            }
            if (!is_writable($tempDir)) {
                throw new \RuntimeException("mPDF temp directory is not writable: $tempDir");
            }
            $defaultConfig = (new ConfigVariables())->getDefaults();
            $fontDirs = $defaultConfig['fontDir'];
            $options = [
                'fontDir' => array_merge($fontDirs, [
                    __DIR__ . '/fonts/',
                ]),
                'tempDir' => $tempDir,
                'default_font_size' => 8,
                'default_font' => 'Arial',
                'mode' => 'utf-8',
                'format' => 'A4',
            ];
            $action->setItems([
                'mpdf' => [
                    'options' => $options,
                    'css'     => file_get_contents(__DIR__ . "/files/prequalification/css.css"),
                    'mpdf'  => new \Mpdf\Mpdf($options)
                ],
                'merger' => new \Jurosh\PDFMerge\PDFMerger
            ]);
        };
    }

    /**
     * @return callable
     */
    public static function loadPDFPages(): callable
    {
        return function ($action) {
            $mpdf_lib = $action->get("mpdf");
            $mpdf     = $mpdf_lib['mpdf'] ?? null;

            $path = __DIR__ . "/files/prequalification/pages";
            $files = glob($path . "/*.php");
            if (is_array($files)) {
                foreach ($files as $file) {
                    ob_start();
                    include $file;
                    $output = ob_get_clean();
                    if ($output) {
                        $mpdf->AddPage('P', '', '', '', '', 18, 18, 15, 20, 8, 10);
                        $mpdf->WriteHTML($action->get("header"));
                        $mpdf->SetHTMLFooter($action->get("footer"));
                        $mpdf->WriteHTML($mpdf_lib['css'], 1);
                        $mpdf->WriteHTML(self::sanitizeHtml($action, $output, 'prequalification_pdf_page'), 2);
                    }
                }
            }
            $action->set("mpdf", ['mpdf' => $mpdf], true);
        };
    }

    /**
     * @return callable
     */
    public static function loadReferencePDFPages(): callable
    {
        return function ($action) {
            $mpdf_lib = $action->get("mpdf");
            $mpdf     = $mpdf_lib['mpdf'] ?? null;
            $path  = sprintf("%s/files/%s/pages", __DIR__, 'reference');
            $files = glob($path . "/*.php");

            $logos = [
                'logo'   => file_get_contents($action->get("logo.prosper")),
                'header' => file_get_contents(Config::get("pdf.header")),
                'footer' => file_get_contents(Config::get("pdf.footer")),
            ];

            if ($logo = file_get_contents($action->get("logo.account"))) {
                $logos['prosper_company_logo'] = $logo;
            }

            $mpdf->imageVars = $logos;

            if (is_array($files)) {
                foreach ($files as $file) {
                    ob_start();
                    include $file;
                    $output = ob_get_clean();
                    if ($output) {
                        $mpdf->setHTMLHeader($action->get("header"));
                        $mpdf->AddPage('P', '', '', '', '', 0, 0, 50, 20, 8, 0);
                        $mpdf->SetHTMLFooter($action->get("footer"));
                        $mpdf->WriteHTML($mpdf_lib['css'], 1);
                        $mpdf->WriteHTML(self::sanitizeHtml($action, $output, 'reference_pdf_page'), 2);
                    }
                }
            }
            $action->set("mpdf", ['mpdf' => $mpdf], true);
        };
    }

    /**
     * @return callable
     */
    public static function loadLogos(): callable
    {
        return function ($action) {
            $aid = md5(strval($action->get("aid")));
            $action->set('logo', [
                'clink'   => Config::get("logo.clink"),
                'company' => Config::getUrl("logo.account", "/$aid/logo.png"),
                'account' => Config::getUrl("logo.account", "/$aid/company.png"),
            ]);
        };
    }

    /**
     * @return callable
     */
    public static function generateReferencePDF(): callable
    {
        return function ($action) {
            $aid = (int)$action->get("uriArgs.aid");
            $save_path = Config::getUrl('document.save.temp', strval($aid));
            $mpdf_lib = $action->get("mpdf");
            $mpdf = $mpdf_lib['mpdf'] ?? null;
            $reference = $save_path . "/" . $action->get("pdf.name");
            $mpdf->SetMargins(0, 0, 0);
            try {
                $mpdf->Output($reference, 'F');
            } catch (\Exception $e) {
                $error[] = [
                    'message' => $e->getMessage(),
                    'file'    => $reference
                ];
            }
            $action->set("export", [
                'path' => $reference,
                'name' => $action->get("pdf.name"),
                'type' => 'application/pdf',
                'size' => filesize($reference)
            ]);
        };
    }

    public static function generateMainSectionPage($key, $data, &$clean_files, &$section_added): callable
    {
        return function ($action) use ($key, $data, &$clean_files, &$section_added) {

            /*
                * Add the section template before the client files only if the client have files in that section
                * Example: Section 2 - Insurances
            */

            if (!$section_added) {

                if (!isset($data['section_label']) || !$data['section_label']) {
                    return;
                }

                $aid = (int)$action->get("uriArgs.aid");
                $save_path = Config::getUrl('document.save.temp', strval($aid));
                $merger   = $action->get("merger");
                $mpdf_lib = $action->get("mpdf");
                $certificateFile = $save_path . "/" . $key . ".pdf";

                $mpdf_section = new \Mpdf\Mpdf($mpdf_lib['options'] ?? []);
                $mpdf_section->AddPage('P', '', '', '', '', 18, 18, 15, 20, 8, 10);
                $mpdf_section->WriteHTML($action->get("header"));
                $mpdf_section->SetHTMLFooter($action->get("footer"));
                $mpdf_section->WriteHTML($mpdf_lib['css'], 1);
                $mpdf_section->WriteHTML(
                    '<div style="margin-top:450px;"><span style="font-size: 40pt;"><strong>'
                        . htmlspecialchars($data['section_label'], ENT_QUOTES, 'UTF-8')
                        . '</strong></div>',
                    2
                );
                $mpdf_section->Output($certificateFile, 'F');

                if (file_exists($certificateFile)) {
                    $merger->addPDF($certificateFile);
                    $clean_files[] = $certificateFile;
                    $section_added = true;
                }
            }
        };
    }

    /**
     * @return callable
     */
    public static function generatePDF(): callable
    {
        return function ($action) {
            $aid = (int)$action->get("uriArgs.aid");

            $save_path = Config::getUrl('document.save.temp', strval($aid));

            $merger   = $action->get("merger");
            $mpdf_lib = $action->get("mpdf");
            $mpdf     = $mpdf_lib['mpdf'] ?? null;

            // create directory if it does not exist
            if (!is_dir($save_path)) {
                mkdir($save_path, 0755, true);
            }

            /*
             * Save prequalification static pages
             */
            $mpdf->Output($save_path . "/merge.pdf", 'F');

            /*
             * Add the above generated pdf to the merger
             */
            $merger->addPDF($save_path . "/merge.pdf");

            /*
             * Store pdf's that were created during export process
             */
            $clean_files = [];

            /*
             * If the client uploads the same pdf file in the same section
             * we need to only show the pdf once
             */
            $imported_files = [];

            /*
             * Loop through all sections i.e insurances, accreditations, etc
             */

            $error = [];
            foreach ($action->get("sections") as $certificate_key => $certificate_data) {

                $section_added = false;

                /*
                 * Download client section files and append them to the section
                 */
                foreach ($certificate_data['files'] as $value) {

                    if (is_array($value) && $value['file']) {

                        /*
                         * If we already merged the same pdf in the same section
                         */
                        if (in_array($value['original_file'], ($imported_files[$certificate_key] ?? []), true) !== false) {
                            continue;
                        }

                        $save_to = $save_path . "/" . basename($value['original_file']);

                        if (file_exists($save_to)) {
                            /*
                                * Generate sections default pdf
                                * Example: Section 2 - Insurances, Section 3 - Accreditations
                            */
                            try {
                                self::generateMainSectionPage($certificate_key, $certificate_data, $clean_files, $section_added)($action);
                            } catch (\Exception $e) {
                                $error[] = [
                                    'message' => $e->getMessage(),
                                    'file'    => $value
                                ];
                            }

                            $pathInfo = pathinfo($save_to);
                            $extension = strtolower($pathInfo['extension'] ?? '');

                            if ($extension === self::EXTENSION_PDF) {
                                /*
                                * Merge the client section pdf
                                */
                                try {
                                    $tempPath = sys_get_temp_dir() . '/' . uniqid('pdf_', true) . '.pdf';
                                    self::standardizeToA4($save_to, $tempPath);
                                    //making sure that we only add pdf files that are not encrypted/protected
                                    //as the 3rd party library pdf add the files without throwing errors
                                    if ((new FPDI)->setSourceFile($tempPath)) {
                                        $merger->addPDF($tempPath);
                                        $clean_files[] = $tempPath;
                                        $imported_files[$certificate_key][] = $value['original_file'];
                                    }
                                } catch (\Exception $e) {
                                    $error[] = [
                                        'message' => $e->getMessage(),
                                        'file'    => $value
                                    ];
                                }
                            } else if (in_array($extension, [self::EXTENSION_PNG, self::EXTENSION_JPG])) {
                                $mpdf_images = new \Mpdf\Mpdf($mpdf_lib['options'] ?? []);
                                $mpdf_images->AddPage('P', '', '', '', '', 18, 18, 15, 20, 8, 10);
                                $mpdf_images->WriteHTML($action->get("header"));
                                $mpdf_images->SetHTMLFooter($action->get("footer"));
                                $mpdf_images->Image($save_to, 300, 25, 0, 0, $extension, '', true, true);
                                $mpdf_images->Output($save_to, 'F');

                                if (file_exists($save_to)) {
                                    $merger->addPDF($save_to);
                                    $clean_files[] = $save_to;
                                    $section_added = true;
                                }
                            }
                        }
                    }
                }
                if (isset($certificate_data['not_iso_docs'])) {
                    /*
                        * Generate sections default pdf
                        * Example: Section 2 - Insurances, Section 3 - Accreditations
                    */
                    try {
                        self::generateMainSectionPage($certificate_key, $certificate_data, $clean_files, $section_added)($action);
                    } catch (\Exception $e) {
                        $error[] = [
                            'message' => $e->getMessage(),
                            'file'    => $certificate_key
                        ];
                    }

                    $action->set("not_iso_accredited_content", $certificate_data['not_iso_docs']);
                    ob_start();
                    include __DIR__ . "/files/prequalification/not-iso-accredited.php";
                    $output = ob_get_clean();
                    if ($output) {
                        $mpdf_section = new \Mpdf\Mpdf($mpdf_lib['options'] ?? []);
                        $mpdf_section->AddPage('P', '', '', '', '', 18, 18, 15, 20, 8, 10);
                        $mpdf_section->WriteHTML($action->get("header"));
                        $mpdf_section->SetHTMLFooter($action->get("footer"));
                        $mpdf_section->WriteHTML($mpdf_lib['css'], 1);
                        $mpdf_section->WriteHTML(self::sanitizeHtml($action, $output, 'prequalification_pdf_not_iso'), 2);
                        $certificateFileNotIso = $save_path . "/" . $certificate_key . "_not-iso-accredited.pdf";
                        $mpdf_section->Output($certificateFileNotIso, 'F');

                        if (file_exists($certificateFileNotIso)) {
                            $merger->addPDF($certificateFileNotIso);
                            $clean_files[] = $certificateFileNotIso;
                            $section_added = true;
                        }
                    }
                }
            }
            try {
                $merger->merge('file', $save_path . '/merged.pdf'); //output file
                $clean_files[] = $save_path . "/merge.pdf";
                foreach ($clean_files as $file) {
                    unlink($file);
                }
            } catch (\Exception $e) {
                $error[] = [
                    'message' => $e->getMessage(),
                    'file'    => $clean_files
                ];
            }

            if ($error) {
                Manager::getService('sns')->sendException('file_upload_error', 'Prequalification export error', new Shape([
                    "error" => $error,
                    "aid"   => $aid
                ]));
            }

            $prequal = $action->get("prequalification");
            $action->set("export", [
                'path' => $save_path . '/merged.pdf',
                'name' => $prequal['company_information']['name'] . ' - C-Link Prequalification.pdf',
                'type' => 'application/pdf',
                'size' => filesize($save_path . '/merged.pdf')
            ]);
        };
    }

    /**
     * @return callable
     */
    public static function outputPDF(): callable
    {
        return function ($action) {
            $output = $action->get("export");
            if ($output && file_exists($output['path'])) {
                header('Content-Type: application/pdf');
                header(sprintf("Content-disposition: inline;filename=%s", basename($output['name'])));
                echo file_get_contents($output['path']);
                exit;
            }
        };
    }

    /**
     * @param string $inputPath
     * @param string $outputPath
     * @return void
     */
    public static function standardizeToA4($inputPath, $outputPath)
    {
        $pdf = new Fpdi();
        $pageCount = $pdf->setSourceFile($inputPath);
        for ($i = 1; $i <= $pageCount; $i++) {
            $newPage = $pdf->importPage($i);
            $pdf->AddPage();
            $pdf->useTemplate($newPage, 0, 0, 210);
        }
        $pdf->Output('F', $outputPath);
    }

    private static function sanitizeHtml($action, string $html, string $renderPath): string
    {

        if ($html === '' || (strpos($html, '<') === false && stripos($html, 'url(') === false)) {
            return $html;
        }

        $blockedAssets = [];
        $document      = new \DOMDocument('1.0', 'UTF-8');
        $previous      = libxml_use_internal_errors(true);
        $document->loadHTML(
            '<?xml encoding="utf-8" ?><div id="pdf-ssrf-sanitizer-root">' . $html . '</div>',
            LIBXML_HTML_NOIMPLIED | LIBXML_HTML_NODEFDTD
        );
        libxml_clear_errors();
        libxml_use_internal_errors($previous);

        $xpath  = new \DOMXPath($document);
        $remove = function ($node, string $tag, string $attr, string $val) use (&$blockedAssets, $action): bool {
            $decision = self::getAssetDecision($action, $val);
            if ($decision['allowed']) return false;
            $blockedAssets[] = ['tag' => $tag, 'attribute' => $attr, 'value' => $val, 'reason' => $decision['reason']];
            $node->parentNode && $node->parentNode->removeChild($node);
            return true;
        };

        foreach ($xpath->query('//img[@src]') ?: [] as $node) {
            $removed = $remove($node, 'img', 'src', trim((string) $node->getAttribute('src')));
            if (!$removed && $node->hasAttribute('srcset')) {
                $node->removeAttribute('srcset');
            }
        }

        foreach ($xpath->query('//link[@href]') ?: [] as $node) {
            if (strtolower(trim((string) $node->getAttribute('rel'))) === 'stylesheet') {
                $remove($node, 'link', 'href', trim((string) $node->getAttribute('href')));
            }
        }

        foreach ($xpath->query('//*[@style]') ?: [] as $node) {
            $style = (string) $node->getAttribute('style');
            $sanitized = trim((string) preg_replace('/\s{2,}/', ' ',
                preg_replace_callback('/url\((["\']?)(.*?)\1\)/i', function (array $m) use ($action, &$blockedAssets): string {
                    $url      = trim($m[2]);
                    $decision = self::getAssetDecision($action, $url);
                    if ($decision['allowed']) return $m[0];
                    $blockedAssets[] = ['tag' => 'style', 'attribute' => 'url', 'value' => $url, 'reason' => $decision['reason']];
                    return 'none';
                }, $style)
            ));
            $sanitized === '' ? $node->removeAttribute('style') : ($sanitized !== $style && $node->setAttribute('style', $sanitized));
        }

        $root = $document->getElementById('pdf-ssrf-sanitizer-root');
        $out  = '';
        if ($root !== null) {
            foreach ($root->childNodes as $child) {
                $out .= $document->saveHTML($child);
            }
        }

        self::logBlockedAssets($action, $renderPath, $blockedAssets);
        return $out ?: $html;
    }

    /**
     * @return array{allowed: bool, reason: string}
     */
    public static function getAssetDecision($action, string $value): array
    {
        $value = trim($value);
        if ($value === '') {
            return ['allowed' => true, 'reason' => 'empty'];
        }

        if (strpos(strtolower($value), self::INTERNAL_IMAGE_SCHEME) === 0) {
            return ['allowed' => true, 'reason' => 'internal_image_var'];
        }

        if (preg_match('/^\s*\/\//', $value)) {
            return ['allowed' => false, 'reason' => 'protocol_relative_blocked'];
        }

        if (preg_match('/^[a-z][a-z0-9+\-.]*:/i', $value)) {
            $scheme = strtolower((string) parse_url($value, PHP_URL_SCHEME));
            if ($scheme !== 'https') {
                return ['allowed' => false, 'reason' => 'non_https_blocked'];
            }

            $host = strtolower((string) parse_url($value, PHP_URL_HOST));
            if (self::isBlockedHost($host)) {
                return ['allowed' => false, 'reason' => 'blocked_internal_or_metadata_host'];
            }

            foreach (self::getAllowedAssetPrefixes($action) as $prefix) {
                if ($prefix !== '' && strpos(self::normalizeUrlPrefix($value), $prefix) === 0) {
                    return ['allowed' => true, 'reason' => 'allowlisted_asset_prefix'];
                }
            }

            return ['allowed' => false, 'reason' => 'non_allowlisted_remote_asset'];
        }

        if (preg_match('#(?:^|/)\.\.(?:/|$)#', $value)) {
            return ['allowed' => false, 'reason' => 'path_traversal_blocked'];
        }

        return ['allowed' => true, 'reason' => 'relative_asset'];
    }

    /**
     * @return array<int, string>
     */
    private static function getAllowedAssetPrefixes($action): array
    {
        $rawExtra = Environment::getValue('PDF_RENDER_ALLOWED_URLS');

        $prefixes = array_filter([
            Environment::getValue('PROSPER_UPGRADE_ACCOUNT_URL'),
            Environment::getValue('ASSET_URL'),
            Environment::getValue('AWS_S3_ASSET_URL'),
            Environment::getValue('CLINK_URL'),
        ]);

        foreach (array_filter(array_map('trim', explode(',', strval($rawExtra)))) as $extra) {
            $prefixes[] = $extra;
        }

        return array_values(array_filter(array_map([self::class, 'normalizeUrlPrefix'], $prefixes)));
    }

    private static function normalizeUrlPrefix(?string $value): string
    {
        $value = trim((string) $value);
        if ($value === '') {
            return '';
        }

        $parts = parse_url($value);
        if (!is_array($parts) || empty($parts['host'])) {
            return '';
        }

        $scheme = strtolower($parts['scheme'] ?? '');
        if ($scheme === '') {
            return '';
        }

        $host = strtolower($parts['host']);
        $path = $parts['path'] ?? '';
        $normalized = $scheme . '://' . $host;
        if (isset($parts['port'])) {
            $normalized .= ':' . $parts['port'];
        }
        $normalized .= '/' . ltrim($path, '/');

        return rtrim(preg_replace('#/+#', '/', $normalized), '/') . '/';
    }

    private static function isBlockedHost(string $host): bool
    {
        if ($host === '') {
            return true;
        }

        if (in_array($host, [
            'localhost',
            'metadata.google.internal',
            'metadata.aliyun.com',
            '169.254.169.254',
            '169.254.170.2',
        ], true)) {
            return true;
        }

        if (filter_var($host, FILTER_VALIDATE_IP)) {
            return self::isBlockedIpAddress($host);
        }

        return false;
    }

    private static function isBlockedIpAddress(string $ip): bool
    {
        if (filter_var($ip, FILTER_VALIDATE_IP, FILTER_FLAG_IPV4)) {
            $long = ip2long($ip);
            if ($long === false) {
                return true;
            }

            $ranges = [
                ['127.0.0.0', '127.255.255.255'],
                ['10.0.0.0', '10.255.255.255'],
                ['172.16.0.0', '172.31.255.255'],
                ['192.168.0.0', '192.168.255.255'],
                ['169.254.0.0', '169.254.255.255'],
                ['100.64.0.0', '100.127.255.255'],
            ];

            foreach ($ranges as $range) {
                if ($long >= ip2long($range[0]) && $long <= ip2long($range[1])) {
                    return true;
                }
            }

            return false;
        }

        if (filter_var($ip, FILTER_VALIDATE_IP, FILTER_FLAG_IPV6)) {
            $normalized = strtolower($ip);
            return $normalized === '::1'
                || strpos($normalized, 'fe80:') === 0
                || strpos($normalized, 'fc') === 0
                || strpos($normalized, 'fd') === 0;
        }

        return true;
    }

    /**
     * @param array<int, array<string, string>> $blockedAssets
     */
    private static function logBlockedAssets($action, string $renderPath, array $blockedAssets): void
    {
        foreach ($blockedAssets as $blockedAsset) {
            error_log(json_encode([
                'message' => 'Blocked remote asset during prequalification PDF rendering',
                'render_path' => $renderPath,
                'aid' => (string) $action->get("uriArgs.aid"),
                'tag' => $blockedAsset['tag'],
                'attribute' => $blockedAsset['attribute'],
                'value' => $blockedAsset['value'],
                'reason' => $blockedAsset['reason'] ?? 'blocked',
            ]));
        }
    }
}
