<?php

namespace App\Cron\DocQueue;


use App\Api\Document as DocumentApi;
use App\Api\Account as AccountApi;
use App\Api\Aws\Sns;
use App\Api\V2\Account as AccountV2;
use App\Api\Project;
use App\Api\S3;
use App\Api\Tender;
use App\core\Environment as Env;
use App\DocCreator\Attachment;
use App\DocCreator\DocCreator;
use App\DocCreator\Signatory\Signatory;
use App\DocCreator\FilesParser;
use App\Models\Account as AccountModel;
use App\Models\Document;
use App\Models\Project as ProjectModel;
use App\Models\Tender as TenderModel;
use App\Models\Transaction as TransactionModel;
use App\Models\Signatory as SignatoryModel;
use App\Models\User;
use App\Models\UserModel;
use App\Models\Util;
use App\Utility\Utility;
use CL\Pdf\Parser;
use App\Models\Document as DocumentModel;
use App\DocCreator\FPDI;
use App\Api\Document\Template;
use Exception;

abstract class Abstraction
{

    /**
     * @var array
     */
    protected array $data = [];

    /**
     * @var int
     */
    protected int $did = 0;

    /**
     * @var DocCreator
     */
    protected DocCreator $docCreator;

    /**
     * @var array
     */
    protected array $sids = [];

    /**
     * @var array
     */
    protected array $uids = [];

    const TYPE = "";

    const EMAIL_TEMPLATE = "";

    /**
     * @param Item $item
     */
    public function __construct(Item $item)
    {
        $this->data = $item->getData();
        $this->did  = $item->getDid();
        $this->sids = $item->getSids();
        $this->uids = $item->getUids();
    }

    /**
     * @return int
     */
    public abstract function getCronDocSubType(): int;

    /**
     * @return string
     */
    public abstract function getEntityType(): string;


    /**
     * @return int
     */
    public function getCronDocType(): int
    {
        return (int) DocumentApi::getDocumentTypes()[DocumentApi::DOCUMENT_CONTRACTUAL_LABEL];
    }

    /**
     * @param string $file
     * @return string
     */
    public abstract function getS3Key(string $file): string;

    public function getS3Bucket()
    {
        return "asset";
    }

    /**
     * Abstract Hook for after each document is processed
     * @param AccountModel $sid
     * @param $document
     * @return void
     */
    public function afterSend(AccountModel $sid, $document) {}

    /**
     * Abstract Hook for after all documents are processed
     * @param array $accounts
     * @param array $documents
     * @return void
     */
    public function afterProcess(array $accounts, array $documents) {}

    /**
     * @throws \App\Api\Exception
     * @throws \Mpdf\MpdfException
     */
    public function process()
    {
        $docusignDeprecatedWarnings = error_reporting(E_ALL & ~E_DEPRECATED);

        $documents  = [];
        $accounts   = $this->getAccounts();
        $recipients = $this->getDocCreator()->getSignatoriesRecipients();
        $signingMechanism = $this->data && isset($this->data['signing_mechanism']) ? $this->data['signing_mechanism'] : null;
        foreach ($accounts as $sid) {
            $doc = $this->createDocument($sid);
            $signatory = new Signatory();
            if ($signingMechanism && $signatory->isValidService($signingMechanism)) {
                S3::save(Env::getValue("AWS_S3_PDF_BUCKET"), $doc['path'], S3::getSaveTmpPath($doc['name']));
                if ($recipients) {
                    $signatoryClient = $signatory->setService($signingMechanism);
                    $signatoryClient->addDocument((new Document($doc)));
                    $signatoryClient->setPrefixArea(Env::getValue("DOCUSIGN_PREFIX_SIGN_AREA"));
                    $signatoryClient->setDatePrefixArea(Env::getValue("DOCUSIGN_PREFIX_SIGN_DATE_AREA"));
                    foreach ($recipients as $recipient) {
                        $signatoryClient->addSigner($recipient);
                    }
                    $signatoryClient->create();
                    $doc += ['signatory' => $signatoryClient];
                }
            }

            $this->sendDocument($sid, $doc);
            $this->afterSend($sid, $doc);
            $documents[$sid->getId()] = $doc;
        }
        $this->afterProcess($accounts, $documents);

        error_reporting($docusignDeprecatedWarnings);
    }

    /**
     * @param AccountModel $sid
     * @param $document
     * @return void
     * @throws \Exception
     */
    public function sendDocument(AccountModel $sid, $document)
    {
        $this->sendEmail(
            $sid,
            [
                $this->getDocCreator()->getModel("account"),
                $this->getDocCreator()->getModel("user")
            ],
            $this->getEmailSubject(),
            $document
        );
    }

    /**
     * @return string
     */
    public function getEmailTemplate(): string
    {
        return self::EMAIL_TEMPLATE;
    }

    abstract public function getEmailSubject(): string;

    /**
     * @return array
     * @throws \App\Api\Exception
     */
    public function getAccounts()
    {
        return AccountApi::loadAccounts($this->sids, $this->uids);
    }

    /**
     * @param int $typeId
     * @return bool
     */
    public function isExternalSub(int $typeId): bool
    {
        $types  = AccountApi::getTypes();
        foreach ($types as $label => $id) {
            if ((int) $id === $typeId) {
                return ($label === "external_subcontractor");
            }
        }
        return false;
    }


    public function getDocCreator(): DocCreator
    {
        if (!isset($this->docCreator)) {
            $data = $this->data;
            $account = AccountApi::getAccount($data['aid']);

            $account_data = [];
            if (isset($account["id"])) {
                $account_data = AccountApi::get("user/" . $data['uid'] . "/profile");
                $account_data['account'] = [
                    'name' => $account['name'],
                    'address' => $account['address'],
                    'reg_number' => $account['reg_number'],
                    'landline' => $account['landline'],
                    'email' => $account['email']
                ];
            }

            $doc = DocumentApi::load($this->did);
            if ($doc->hasData()) {
                $this->docCreator  = new DocCreator($doc);
                $this->docCreator->setModels([
                    'user' => (new UserModel($account_data, $data['uid'])),
                    'account' => (new AccountModel($account, $data['aid']))
                ]);

                $categories = DocumentApi::getTemplateCategories($this->did);
                if ($categories->count()) {
                    $category = $categories->filterByField('entity_type',  $this->getEntityType())->getFirst();
                    $tid = $category->getData('entity_id');
                    $pid = $category->getData('parent_id');

                    $this->docCreator->setModels([
                        'project' => (new ProjectModel(Project::getProject($pid), $pid)),
                        'tender' => (new TenderModel(Tender::getTender($pid, $tid), $tid)),
                        "category" => $category
                    ]);
                }
            } else {
                $this->docCreator  = new DocCreator(new Document());
            }
        }

        return $this->docCreator;
    }

    /**
     * @param int $aid
     * @param AccountModel $sid
     * @param array $doc
     * @return array
     * @throws \Mpdf\MpdfException
     */
    public function createDocument(AccountModel $sid, array $doc = []): array
    {
        $documentAlreadyExists = !empty($doc);
        $project = $this->getDocCreator()->modelExists("project") ? $this->getDocCreator()->getModel('project')->getData() : [];
        $tender  = $this->getDocCreator()->modelExists("tender") ? $this->getDocCreator()->getModel('tender')->getData() : [];
        $this->getDocCreator()->setSubcontractor($sid, (int)$this->data['aid']);

        $meta = $this->getDocCreator()->getMeta();
        $preserveLinksOnly = !empty($meta['append_order']);
        if (isset($meta['append_order']) && $meta['append_order']) {
            $subFormId = (int)$meta['values']['subcontractor_form'];

            $subFormDoc = DocumentApi::load($subFormId);
            if (!$subFormDoc->hasData()) {
                Sns::send("timeout_document_process", "Subcontractor template not found for ID: $subFormId");
                throw new \Exception("Subcontractor template not found for ID: $subFormId");
            }

            $subFormDocCreator = new DocCreator($subFormDoc);
            $subFormDocCreator->setOption('sow', false);
            $subFormDocCreator->setSubcontractor($sid, (int)$this->data['aid']);

            $main = $this->getDocCreator();
            $mainFileManagerSources = FilesParser::getFileManagerSources($main->getContentAsArray());
            if ($mainFileManagerSources) {
                $subFormDocCreator->setOption('skipFileManagerSources', $mainFileManagerSources);
            }
            $main->setOption('pageNr', false);
            $main->setOption('parseFooter', false);
            $subFormDocCreator->setOption('pageNr', false);
            $subFormDocCreator->setOption('parseFooter', false);

            // COPY ALL AVAILABLE MODELS (NOW AVAILABLE CORRECTLY)
            $modelKeys = [
                'user',
                'account',
                'project',
                'tender',
                'category',
                'subcontractor',
                'signatory',
                'signer',
                'subcontractor_user',
                'subcontractor_company',
                'signature',
                'signature_areas'
            ];

            foreach ($modelKeys as $key) {
                if ($main->modelExists($key)) {
                    $subFormDocCreator->setModel($key, $main->getModel($key));
                }
            }

            /** FIX: Guarantee signatory models exist even if missing **/

            if (!$subFormDocCreator->modelExists('signatory')) {
                $subFormDocCreator->setModel('signatory', new SignatoryModel([], 0));
            }

            if (!$subFormDocCreator->modelExists('signer')) {
                $subFormDocCreator->setModel('signer', new SignatoryModel([], 0));
            }

            if (!$subFormDocCreator->modelExists('signature')) {
                $subFormDocCreator->setModel('signature', new SignatoryModel([], 0));
            }
            // FIX TRANSACTION
            if ($main->modelExists('transaction')) {
                $subFormDocCreator->setModel('transaction', $main->getModel('transaction'));
            } else {
                $subFormDocCreator->setModel('transaction', new TransactionModel(['order_append' => true], 0));
            }
            // COPY OPTIONS
            $optionKeys = [
                'parseHeader',
                'parseFooter',
                'parseShortcodes',
                'parseHtml',
                'parseFiles',
                'parseMiniBoq',
                'parseSimpleRowQuotePrice',
                'soa'
            ];
            foreach ($optionKeys as $opt) {
                if ($main->getOption($opt)) {
                    $subFormDocCreator->setOption($opt, true);
                }
            }
            // GENERATE
            $subFormContent = $subFormDocCreator->generate();
            $subContentParser = new Parser($subFormContent);
            $subContentPdf = $subContentParser->parse();
            $subPdfOutput = $subContentPdf->output('subForm', 'S');
        }

        if (isset($meta['soa'])) {
            $this->getDocCreator()->setOption('soa', true);
            $soas = DocumentApi::get(sprintf(
                "document?type=%s&subtype=%s",
                DocumentApi::getDocumentType('contractual'),
                DocumentApi::getSubType("soa_asset")->getId()
            ));
            if ($soas) {
                $soa = array_shift($soas);
                $soa_loaded_id = Template::getLoadedDocId($soa['id'], (int)$this->data['aid']);
                $this->getDocCreator()->setModel("soa", (new DocumentModel(DocumentApi::load($soa_loaded_id)->getData(), $soa_loaded_id)));
            }
        }
        if (isset($meta['miniboq'])) {
            $mini_boqs = DocumentApi::get(sprintf(
                "document?type=%s&subtype=%s",
                DocumentApi::getDocumentType('contractual'),
                DocumentApi::getSubType("miniboq_asset")->getId()
            ));
            if ($mini_boqs) {
                $mini_boq_loaded_id = null;
                $found_mini_boq = false;
                //load the correct miniboq json data based on the meta document id if provided
                foreach ($mini_boqs as $mini_boq) {
                    $meta = json_decode($mini_boq['meta'], true);
                    if (isset($meta['did'])) {
                        if ((int)$meta['did'] === (int)$this->data['did']) {
                            $mini_boq_loaded_id = $mini_boq['id'];
                            break;
                        }
                        $found_mini_boq = true;
                    }
                }
                if (!$mini_boq_loaded_id) {
                    if ($found_mini_boq) {
                        $mini_boq = array_shift($mini_boqs);
                        $mini_boq_loaded_id = $mini_boq['id'];
                    } else {
                        $mini_boq = end($mini_boqs);
                        $mini_boq_loaded_id = Template::getLoadedDocId($mini_boq['id'], (int)$this->data['aid']);
                    }
                }
                $this->getDocCreator()->setModel("mini_boq", (new DocumentModel(DocumentApi::load($mini_boq_loaded_id)->getData(), $mini_boq_loaded_id)));
                $this->getDocCreator()->setOption('parseMiniBoq', true);
            }
        }

        if (isset($meta['simpleRowQuotePrice'])) {
            $this->getDocCreator()->setOption('parseSimpleRowQuotePrice', true);
            $this->getDocCreator()->setOption('vat', 20);
        }

        //HAS ATTACHMENTS
        $has_attachments = $meta['attachments'] ?? false;
        if ($has_attachments) {
            $this->getDocCreator()->setOption('attachments', true);
        }
        $content = $this->getDocCreator()->generate();

        $notFound = "name not found";
        $projectName = $project['name'] ?? "Project $notFound";
        $tenderName = $tender['label'] ?? "Tender $notFound";
        $pdf_name = sprintf("%s %s %s.pdf", $projectName, $tenderName, date("d-m-Y"));
        $pdf_name = Util::sanitizeStringURL($pdf_name);

        if ($documentAlreadyExists) {
            $id = $doc["id"];
        } else {
            $res = DocumentApi::post("document", [
                'owner_id'   => $this->data["aid"],
                'parent_id'  => $this->data['did'] ?? 0,
                'type'       => $this->getCronDocType(),
                "name"       => $pdf_name,
                "subtype"    => $this->getCronDocSubType(),
                "s3_bucket"  => $this->getS3Bucket()
            ]);

            $id = $res->iDResponse();
        }

        try {
            if (ProjectModel::$error_number_document) {
                throw new Exception(ProjectModel::$error_number_document);
            }
            if ($id) {

                $hasNumberDocuments = $meta['number_document'] ?? false;
                //NON MCLAREN DOCUMENTS
                if (!$hasNumberDocuments) {
                    $parser = new Parser($content);
                    $pdf = $parser->parse();
                }
                //MCLAREN "HACK" TO MERGE NUMBER DOCUMENTS
                //THIS IS SOMEWHAT A COPY OF THE CODE FROM THE DOCUMENT CREATOR CONTROLLER - PREVIEW METHOD
                if ($hasNumberDocuments) {
                    $this->getDocCreator()->setOption('number_document', true);
                    $parent_id = (int)$this->data['did'];
                    $numberDocuments = \App\Api\Document::get(sprintf(
                        "document?type=%s&subtype=%s&owner_id=%s&parent_id=%s",
                        DocumentApi::getDocumentType('contractual'),
                        DocumentApi::getSubType("number_document")->getId(),
                        $this->data['aid'],
                        $parent_id
                    ));
                    $tmpFolder = Utility::uniqueTempDir(config('document.download.folder'));
                    $header = $content[0]["header"] ?? [];
                    $header["address"] = "";
                    $footer = $content[0]["footer"] ?? [];
                    $contentChildren = $content[0]["children"] ?? [];

                    $index = 1; // keys of $contentChildren are not incremental
                    $tmpFiles = [];

                    $pdfName = $pdf_name . '.pdf';
                    $mergedPath = $tmpFolder . $pdfName;
                    register_shutdown_function(function () use ($tmpFolder) {
                        Utility::removeDirectory($tmpFolder);
                    });
                    foreach ($contentChildren as $children) {
                        $tmpFileName = $tmpFolder . "Part_" . $index . ".pdf";
                        if (key_exists("uploadedContent", $children)) {
                            $ndShortcode = $children["uploadedContent"];
                            $uploadedExists = false;
                            foreach ($numberDocuments as $numberDocument) {
                                $json = $numberDocument["meta"];
                                $meta = json_decode($json, true);
                                if (($meta['number_document'] ?? null) === $ndShortcode && $numberDocument['s3_key']) {
                                    $uploadedExists = true;
                                    S3::save(S3::getBucket("document"), $numberDocument['s3_key'], $tmpFileName);
                                    break;
                                }
                            }
                            if (!$uploadedExists) {
                                continue;
                            }
                        } else {
                            $children["header"] = $header;
                            $children["footer"] = $footer;
                            $parser = new Parser([$children]);
                            $pdfParsed = $parser->parse();
                            $pdfParsed->Output($tmpFileName, 'F');
                        }

                        if (!file_exists($tmpFileName) || filesize($tmpFileName) === 0) {
                            throw new \RuntimeException("Invalid PDF: $tmpFileName");
                        }
                        $tmpFiles[] = $tmpFileName;
                        $index++;
                    }

                    $escapedFiles = array_map('escapeshellarg', $tmpFiles);
                    $filesList = implode(' ', $escapedFiles);

                    $cmd = sprintf(
                        'qpdf --empty --pages %s -- %s',
                        $filesList,
                        escapeshellarg($mergedPath)
                    );
                    exec($cmd . ' 2>&1', $output, $exitCode);
                    // Exit code 0 = success; exit code 3 = success with warnings.
                    $qpdfOk = ($exitCode === 0 || $exitCode === 3) && file_exists($mergedPath);
                    if (!$qpdfOk) {
                        throw new \RuntimeException('Error with qpdf');
                    }

                    if ($exitCode === 0 && file_exists($mergedPath)) {
                        $customFooterHtml = $footer['html'] ?? "";
                        $this->addGlobalPagination($mergedPath, $customFooterHtml);
                    }

                    $file = sprintf("%s/$pdf_name", $id);
                    $key = $this->getS3Key($file);
                    $result = S3::uploadContent(
                        'pdf',
                        $key,
                        file_get_contents($mergedPath),
                        [
                            'ContentDisposition' => "inline",
                            'ContentType' => "application/pdf"
                        ]
                    );
                    $url = $result['ObjectURL'];
                    DocumentApi::patch("document/" . $id, ["s3_key" => $key]);
                    return [
                        'path' => $key,
                        'name' => $pdf_name,
                        'url' => $url,
                        'id' => $id,
                        'is_tender_addendum' => $this->isTenderAddendum()
                    ];
                }

                // footer text reused for append_order overlay
                $footer_text = '';
                if ($this->getDocCreator()->getModel("account")) {
                    $footer_text = sprintf(
                        "%s | %s",
                        $this->getDocCreator()->getModel("account")->getData("name"),
                        $this->getDocCreator()->getFooterLabel()
                    );
                }
                if (isset($meta['attachments'])) {
                    $tmp_folder = Utility::uniqueTempDir(config('document.download.attachments'));
                    register_shutdown_function(function () use ($tmp_folder) {
                        Utility::removeDirectory($tmp_folder);
                    });
                    $pdf_save_path = $tmp_folder . $pdf_name;
                    $pdf->Output($pdf_save_path, 'F');
                    $attachments = DocumentApi::get(sprintf(
                        "document?type=%s&subtype=%s&owner_id=%s",
                        DocumentApi::getDocumentType('structural'),
                        DocumentApi::getSubType("document_attachment_list_item")->getId(),
                        (int)$this->data['aid'],
                    ));

                    if (!empty($attachments)) {
                        $parser = new Parser($content);
                        $total_pages = (new FPDI())->setSourceFile($pdf_save_path);

                        // Prepare attachment files
                        $attachment_files = [];
                        foreach ($attachments as $attachment) {
                            $file_path = $tmp_folder . "/" . $attachment['name'];
                            if (!$documentAlreadyExists) {
                                S3::save(S3::getBucket("document"), $attachment['s3_key'], $file_path);
                            }
                            if (file_exists($file_path)) {
                                $attachment_files[] = $file_path;
                            }
                        }

                        // Merge PDFs using qpdf if there are attachments
                        if (!empty($attachment_files)) {
                            $merged_temp_path = $tmp_folder . 'merged_' . $pdf_name;

                            // Build file list for qpdf
                            $all_files = array_merge([$pdf_save_path], $attachment_files);
                            $escaped_files = array_map('escapeshellarg', $all_files);
                            $files_list = implode(' ', $escaped_files);

                            // Execute qpdf merge
                            $cmd = sprintf(
                                'qpdf --empty --pages %s -- %s',
                                $files_list,
                                escapeshellarg($merged_temp_path)
                            );
                            exec($cmd, $output, $exitCode);

                            if ($exitCode !== 0 || !file_exists($merged_temp_path)) {
                                throw new \RuntimeException('Error merging PDFs with qpdf');
                            }

                            // Replace original with merged version
                            rename($merged_temp_path, $pdf_save_path);
                        }

                        if ($preserveLinksOnly) {
                            // overlay footer with page numbers while preserving links
                            $pageCount = (new FPDI())->setSourceFile($pdf_save_path);
                            if ($footer_text && $pageCount > 0) {
                                $footerTmp = tempnam(sys_get_temp_dir(), 'footer_') . '.pdf';
                                $mpdf = new \Mpdf\Mpdf(['mode' => 'utf-8', 'format' => 'A4']);
                                $mpdf->SetDisplayMode('fullpage');
                                $footerHtml = '<div style="border-top:0.6pt solid #444;margin-top:4mm;"></div>'
                                    . '<table width="100%" style="font-size:10pt;padding-top:2mm;">
                                        <tr>
                                            <td style="text-align:left;">{PAGENO} of {nbpg}</td>
                                            <td style="text-align:right;">' . $footer_text . '</td>
                                        </tr>
                                       </table>';
                                $mpdf->SetHTMLFooter($footerHtml);
                                for ($i = 1; $i <= $pageCount; $i++) {
                                    $mpdf->AddPage();
                                    $mpdf->WriteHTML('');
                                }
                                $mpdf->Output($footerTmp, 'F');

                                $overlayPath = $tmp_folder . 'overlay_' . $pdf_name;
                                $cmd = sprintf(
                                    'qpdf --underlay %s -- %s %s',
                                    escapeshellarg($footerTmp),
                                    escapeshellarg($pdf_save_path),
                                    escapeshellarg($overlayPath)
                                );
                                exec($cmd, $output, $exitCode);
                                if ($exitCode === 0 && file_exists($overlayPath)) {
                                    rename($overlayPath, $pdf_save_path);
                                }
                                @unlink($footerTmp);
                            }
                            $pdf_output = file_get_contents($pdf_save_path);
                        } else {
                            //OPEN ALL PDF PAGES AND ADD THE FOOTER
                            $pdf = new FPDI();
                            if ($this->getDocCreator()->getModel("account")) {
                                $footer_text = sprintf("%s | %s", $this->getDocCreator()->getModel("account")->getData("name"), $this->getDocCreator()->getFooterLabel());
                            }
                            $pdf->setFooterText($footer_text ?? '');
                            $pdf->AliasNbPages();
                            $pageCount = $pdf->setSourceFile($pdf_save_path);
                            for ($pageNo = 1; $pageNo <= $pageCount; $pageNo++) {
                                $tplIdx = $pdf->importPage($pageNo);
                                $pdf->AddPage();
                                $pdf->useTemplate($tplIdx);
                                if ($pageNo > $total_pages) {
                                    $pdf->setFooterText();
                                } else {
                                    $pdf->setFooterText($footer_text ?? '');
                                }
                            }
                        }
                    }
                }
                if (isset($subPdfOutput) && !empty($subPdfOutput)) {
                    $tmp_folder = Utility::uniqueTempDir(config('document.download.attachments'));
                    register_shutdown_function(function () use ($tmp_folder) {
                        Utility::removeDirectory($tmp_folder);
                    });
                    $pdf_save_path = $tmp_folder . $pdf_name;

                    // Save main PDF to file
                    $pdf->Output($pdf_save_path, 'F');

                    // Save subcontractor PDF to temporary file
                    $sub_pdf_name = 'sub_' . $pdf_name;
                    $sub_pdf_path = $tmp_folder . $sub_pdf_name;
                    file_put_contents($sub_pdf_path, $subPdfOutput);

                    // Merge main PDF and subcontractor PDF using qpdf
                    $total_pages = (new FPDI())->setSourceFile($pdf_save_path);
                    $merged_temp_path = $tmp_folder . 'merged_with_sub_' . $pdf_name;

                    // Build file list for qpdf
                    $all_files = [$pdf_save_path];
                    if (file_exists($sub_pdf_path)) {
                        $all_files[] = $sub_pdf_path;
                    }

                    $escaped_files = array_map('escapeshellarg', $all_files);
                    $files_list = implode(' ', $escaped_files);

                    // Execute qpdf merge
                    $cmd = sprintf(
                        'qpdf --empty --pages %s -- %s',
                        $files_list,
                        escapeshellarg($merged_temp_path)
                    );
                    exec($cmd, $output, $exitCode);

                    if ($exitCode !== 0 || !file_exists($merged_temp_path)) {
                        error_log("SubPDF merge error with qpdf");
                        throw new \RuntimeException('Error merging subcontractor PDF with qpdf');
                    }

                    // Replace original with merged version
                    rename($merged_temp_path, $pdf_save_path);

                    if ($preserveLinksOnly) {
                        $pageCount = (new FPDI())->setSourceFile($pdf_save_path);
                        if ($footer_text && $pageCount > 0) {
                            $footerTmp = tempnam(sys_get_temp_dir(), 'footer_') . '.pdf';
                            $mpdf = new \Mpdf\Mpdf(['mode' => 'utf-8', 'format' => 'A4']);
                            $mpdf->SetDisplayMode('fullpage');
                            $footerHtml = '<div style="border-top:0.6pt solid #444;margin-top:4mm;"></div>'
                                . '<table width="100%" style="font-size:10pt;padding-top:2mm;">
                                        <tr>
                                            <td style="text-align:left;">{PAGENO} of {nbpg}</td>
                                            <td style="text-align:right;">' . $footer_text . '</td>
                                        </tr>
                                       </table>';
                            $mpdf->SetHTMLFooter($footerHtml);
                            for ($i = 1; $i <= $pageCount; $i++) {
                                $mpdf->AddPage();
                                $mpdf->WriteHTML('');
                            }
                            $mpdf->Output($footerTmp, 'F');

                            $overlayPath = $tmp_folder . 'overlay_' . $pdf_name;
                            $cmd = sprintf(
                                'qpdf --underlay %s -- %s %s',
                                escapeshellarg($footerTmp),
                                escapeshellarg($pdf_save_path),
                                escapeshellarg($overlayPath)
                            );
                            exec($cmd, $output, $exitCode);
                            if ($exitCode === 0 && file_exists($overlayPath)) {
                                rename($overlayPath, $pdf_save_path);
                            }
                            @unlink($footerTmp);
                        }
                        $pdf_output = file_get_contents($pdf_save_path);
                    } else {
                        // Add footer to merged PDF
                        $pdf = new FPDI();
                        if ($this->getDocCreator()->getModel("account")) {
                            $footer_text = sprintf(
                                "%s | %s",
                                $this->getDocCreator()->getModel("account")->getData("name"),
                                $this->getDocCreator()->getFooterLabel()
                            );
                        }
                        $pdf->setFooterText($footer_text ?? '');
                        $pdf->AliasNbPages();
                        $final_pdf_path = $pdf_save_path; // merged file
                        $pageCount = $pdf->setSourceFile($final_pdf_path);

                        // Since everything (attachments + subPDF) is merged,
                        // we don't differentiate pages anymore
                        for ($pageNo = 1; $pageNo <= $pageCount; $pageNo++) {
                            $tplIdx = $pdf->importPage($pageNo);
                            $pdf->AddPage();
                            $pdf->useTemplate($tplIdx);
                            $pdf->setFooterText($footer_text ?? '');
                        }
                    }

                    // Cleanup temporary subPDF file
                    if (file_exists($sub_pdf_path)) {
                        unlink($sub_pdf_path);
                    }
                }
                if (!isset($pdf_output)) {
                    $pdf_output = $pdf->output($pdf_name, 'S');

                    //HAS ATTACHMENTS
                    if ($has_attachments) {
                        $attachmentsService = new Attachment(new UserModel(["account_id" => $this->data['aid']], $this->data['uid']));
                        $attachments = $attachmentsService->getAttachmentsForDocument($meta, $this->getDocCreator()->document(), (int)$this->data['did']);
                        if (!empty($attachments)) {
                            $settings['attachments'] = true;
                            $tmpFolder = Utility::uniqueTempDir(config('document.download.folder'));
                            register_shutdown_function(function () use ($tmpFolder) {
                                Utility::removeDirectory($tmpFolder);
                            });
                            $tmpFiles[] = $tmpFolder . $pdf_name;
                            $tmpFiles = $attachmentsService->prepareTmpAttachmentPdfs($attachments, $tmpFolder, (int)$project['id'], (int)$tender['id'], $settings, $tmpFiles);
                            exec(sprintf(
                                'qpdf --empty --pages %s -- %s',
                                implode(' ', array_map('escapeshellarg', $tmpFiles)),
                                escapeshellarg($tmpFolder . "tmp_" . $pdf_name)
                            ), $output, $exitCode);
                            rename($tmpFolder . "tmp_" . $pdf_name, $tmpFolder . $pdf_name);
                            $pdf_output = file_get_contents($tmpFolder . $pdf_name);
                        }
                    }
                }
                $file = sprintf("%s/$pdf_name", $id);
                $key = $this->getS3Key($file);
                $url = S3::getURI(S3::getBucket("PDF"), $key);
                if (!$documentAlreadyExists) {
                    $result = S3::uploadContent(
                        'pdf',
                        $key,
                        $pdf_output,
                        [
                            'ContentDisposition' => "inline",
                            'ContentType' => "application/pdf"
                        ]
                    );
                    $url = $result['ObjectURL'];
                    DocumentApi::patch("document/" . $id, ["s3_key" => $key]);
                }
                return [
                    'path' => $key,
                    'name' => $pdf_name,
                    'url' => $url,
                    'id' => $id,
                    'is_tender_addendum' => $this->isTenderAddendum()
                ];
            }
            throw new \Exception("Failed to create document");
        } catch (\Exception $e) {
            error_log("Failed to send: " . $this::TYPE  . " Document: " . $e->getMessage());
            //Rethrow so DocQueue::process marks this item as failed, keeps it on the queue,
            //and sends the SNS notification centrally via handleQueueError.
            throw $e;
        }
    }

    /**
     * @param string $filePath
     * @param string $htmlTemplate
     */
    private function addGlobalPagination(string $filePath, string $htmlTemplate = "")
    {
        $mpdf = new \Mpdf\Mpdf([
            'margin_left' => 18,
            'margin_bottom' => 22,
            'margin_footer' => 10,
            'packTableData' => true
        ]);

        $pageCount = $mpdf->setSourceFile($filePath);

        for ($i = 1; $i <= $pageCount; $i++) {
            $importPage = $mpdf->importPage($i);
            $size = $mpdf->getTemplateSize($importPage);
            $mpdf->_setPageSize([$size['width'], $size['height']], $size['orientation']);
            $mpdf->addPage();
            $mpdf->useTemplate($importPage);

            if (!empty($htmlTemplate)) {
                $footerHtml = str_replace(
                    ['{PAGENO}', '{nbpg}'],
                    [$i, $pageCount],
                    $htmlTemplate
                );
            } else {
                $footerHtml = "<div style='text-align: left; font-size: 10px'>{$i} of {$pageCount}</div>";
            }

            $xPos = 18;
            $yPos = $size['height'] - 15;
            $width = $size['width'] - 36;
            $height = 10;

            $mpdf->WriteFixedPosHTML($footerHtml, $xPos, $yPos, $width, $height);
        }

        $mpdf->Output($filePath, 'F');
    }

    /**
     * @param $from
     * @param $to
     * @param $project
     * @param $category
     * @param $document
     * @param false $is_tender_addendum
     */
    public function sendEmail(AccountModel $to, array $from, string $subject, $document): void
    {
        list($account, $user) = $from;
        $subEmail = $to->getData("email");
        if ($this->isExternalSub((int)  $to->getData("type_id"))) {
            $meta = json_decode($to->getData("meta"), true);
            if (isset($meta[$account->getId()])) {
                $subEmail = $meta[$account->getId()]["email"] ?? $subEmail;
            }
        }

        $email = clink_email();
        $email->subject($subject);
        $email->to($subEmail);
        $email->bcc(config('email.clink.default.email'), config('email.clink.default.name'));
        list($account, $user) = $from;
        $email->cc($user->getData("email"), $user->getData("display_name"));
        $email->template($this->getEmailTemplate(), [
            'name'    => $to->getData("name"),
            'company' => $account->getData("name"),
            'project_name' => $this->getDocCreator()->getModel('project')->getData("name"),
            'tender_name'  => $this->getDocCreator()->getModel("tender")->getData("label"),
            "company_telephone" => $account->getData("landline"),
            "user_name"  => $user->getData("display_name"),
            'attachment' => $document['url']
        ]);
        $email->send();
    }
}
