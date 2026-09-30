<?php

namespace App\controllers;

use App\Api\Account;
use App\Api\Aws\Sns;
use App\Api\Aws\Sqs;
use App\Api\BoQ\BoQ as BoQApi;
use App\Api\Document;
use App\Api\Account as ApiAccount;
use App\Api\Document as DocumentApi;
use App\Api\Document\Template;
use App\Api\Email\Email;
use App\Api\ProjectManagement;
use App\Api\Tender as TenderApi;
use App\Api\Tender\Enquiry as EnquiryApi;
use App\Api\Tender\Order as OrderApi;
use App\Api\S3;
use App\Api\Transactions;
use App\Models\Document as DocumentModel;
use App\core\Controller;
use App\Models\Permission;
use App\Factory\UserFactory;

use App\DocCreator\DocCreator;
use App\Api\Project;
use App\Models\Project as ProjectModel;
use App\Models\Account as AccountModel;
use App\Models\Signatory as SignatoryModel;
use App\Models\UserModel;
use App\Models\Tender as TenderModel;
use App\Models\Transaction as TransactionModel;
use App\Models\Instruction as InstructionModel;
use App\Api\Tender;
use App\Api\Document\TenderTemplate;
use App\Api\ProcurementScheduleOverview;
use App\Cron\DocQueue;

use App\Models\Util;
use CL\Pdf\Parser;

use App\DocCreator\Script\Script;
use App\Utility\Utility;
use App\DocCreator\Attachment;

class DocumentCreatorController extends Controller
{
    private const PACKAGE_SEND_COOLDOWN_SECONDS = 300;

    const ENQUIRY_ISSUE_DATE_MILESTONE_LABEL = "Enquiry Issue Date";

    public $user_path = 'main-contractor';

    protected $user;

    /**
     * @return bool
     */
    public function isAuthorized(): bool
    {

        $action = $this->request->param('action');

        $resource = 'c-link';

        //config used for conditions on permission check
        $config = array();

        Permission::allow('administrator', $resource, ['*']);
        Permission::allow(
            'main-contractor',
            $resource,
            [
                'tender',
                'order',
                'tender_addendum',
                "template",
                "instruction",
                "ncr",
                "send",
                "generate",
                "preview"
            ]
        );

        return Permission::check(user_role(), $resource, $action, $config);
    }

    /**
     * @return \App\core\Response|void
     */
    public function startupProcess()
    {
        return parent::startupProcess();
    }

    public function beforeAction(): void
    {
        parent::beforeAction();

        $this->user = UserFactory::getUser();
        if (!$this->user) {
            logout();
            exit();
        }
        setJsConfig('user_id', $this->user->getId());
        setJsConfig('account_id', $this->user->getAccountId());
        setJsConfig('url', SITE_URL);
        setJsConfig('info', Account::info($this->request, $this->user, []));

        $this->view->setContext(["is_admin" => user_role() === "administrator"]);
        $this->view->setContext(["user" => $this->user]);
    }

    /**
     * @param int $tid
     * @return void
     */
    public function tender_addendum(int $tid): void
    {
        $this->view->setContext(["react_app" => "clink"]);
        $this->view->setContext(["version" => 2]);
        renderLayouts('react');
    }

    /**
     * @param int $tid
     * @return void
     */
    public function order(int $tid, int $did, int $sid): void
    {
        $this->view->setContext(["react_app" => "clink"]);
        $this->view->setContext(["version" => 2]);
        renderLayouts('react');
    }

    /**
     * @param int $id
     * @param string $type
     * @param bool $output
     * @throws \App\Api\Exception
     */
    public function instruction_preview(int $id, string $type = '', bool $output = true)
    {
        $success = false;

        if ($id) {
            $instruction = Project::get("instruction/$id");
            $transaction = Project::get("transaction/" . $instruction['transaction_id']);
            $transaction = array_shift($transaction);
            $tid = (int)$transaction['tender']['id'];
            $pid = (int)$transaction['tender']['project_id'];
            $sid = (int)$transaction['subcontractor_id'];

            /*
             * Because the instruction documents cannot be modified we need to get the default document id
             */
            $document_default = Document::get("document", [
                "type"    => Document::DOCUMENT_CONTRACTUAL_TYPE,
                'subtype' => Document::getSubType($type)->getId()
            ]);
            $document_default = array_shift($document_default);
            $did = $document_default['id'];

            /*
             * Get instruction nr by index value
             */
            $instructions = Project::get("project/$pid/instruction", ['type_id' => $instruction['type_id']]);
            array_map(function ($id, $item) use (&$instruction) {
                if ($item['id'] == $instruction['id']) {
                    $instruction['nr'] = $id + 1;
                }
            }, array_keys($instructions), array_values($instructions));

            /*
             * Load document
             */
            $res = Document::get("document/$did");
            if ($res) {
                $did = (string)Template::getLoadedDocId($did, $this->user->getAccountId());
                $document = new DocumentModel($res, $did);
                if ($document->isOwner($this->user) || count($document->getOwnerIds()) == 0) {
                    $doc_creator = new DocCreator(Document::load(intval($did)));
                    $doc_creator->setModels([
                        'user' => (new UserModel($this->user->getData(), $this->user->getId())),
                        'account' => (new AccountModel(Account::getAccount($this->user->getAccountId()), $this->user->getAccountId())),
                        'project' => (new ProjectModel(Project::getProject($pid), (string)$pid)),
                        'tender' => (new TenderModel(Tender::getTender($pid, $tid), $tid)),
                        'transaction' => (new TransactionModel($transaction)),
                        'instruction' => (new InstructionModel($instruction)),
                    ]);
                    foreach (Account::loadAccounts([$sid]) as $to) {
                        $doc_creator->setSubcontractor($to, $this->user->getAccountId());
                    }
                    $content = $doc_creator->preview();
                    $parser = new Parser($content);
                    try {
                        $pdf = $parser->parse();
                        if ($output) {
                            /*
                             * Output pdf to browser
                             */
                            $document_name = sprintf(
                                "%s - %s - %s",
                                $document->getData('name'),
                                $doc_creator->getModel("project")->getData("name"),
                                $doc_creator->getModel("tender")->getData("label")
                            );
                            $pdf->SetTitle($document_name);
                            $pdf->Output($document->getData('name') . '.pdf', 'I');
                            $success = true;
                            exit;
                        } else {
                            /*
                             * Return pdf data
                             */
                            $success = true;
                            return [
                                'doc_creator' => $doc_creator,
                                'pdf' => $pdf->output('Instruction.pdf', 'S')
                            ];
                        }
                    } catch (\Exception $e) {
                        $success = false;
                    }
                }
            }
        }

        return $success;
    }

    /**
     * @param int $id
     * @param string $type
     * @throws \App\Api\Exception
     */
    public function preview(int $id, string $type = ''): bool
    {
        $success = false;
        if ($id) {
            $res = Document::get("document/$id");

            if ($res) {

                $id = Template::getLoadedDocId($id, $this->user->getAccountId());
                $document = new DocumentModel($res, (string)$id);

                $owners_count = count($document->getOwnerIds());
                $hidden_count = count($document->getHiddenIds());
                $permission = true;
                if ($owners_count > 0 && $owners_count != $hidden_count && !$document->isOwner($this->user)) {
                    $permission = false;
                }

                if ($permission || $document->isOwner($this->user) || count($document->getOwnerIds()) == 0) {
                    $doc_creator = new DocCreator(Document::load($id));
                    $userModel = new UserModel($this->user->getData(), $this->user->getId());
                    $accountModel = new AccountModel(Account::getAccount($this->user->getAccountId()), $this->user->getAccountId());
                    $doc_creator->setModels(['user' => $userModel, 'account' => $accountModel]);

                    $settings = [
                        'parseFiles' => false,
                        'sow' => false,
                        'soa' => false,
                        'soamc' => false,
                        "mini_boq" => false,
                        'number_document' => false
                    ];

                    $categories = Document::getTemplateCategories($id);
                    $type = $doc_creator->document()->isTenderDocument() ? TenderTemplate::ENTITY_TYPE : OrderApi::ENTITY_TYPE;
                    $category = $categories->filterByField('entity_type', $type)->getFirst();

                    //ORDER SETTINGS
                    if (!$doc_creator->document()->isTenderDocument()) {
                        //IF IS AN ORDER ASSET WE DONT HAVE ANY META
                        $meta = self::getQuoteMeta($document);
                        $qid = $meta['id'] ?? null;
                        $sid = $meta['subcontractor_id'] ?? null;
                        foreach (Account::loadAccounts([$sid]) as $to) {
                            $doc_creator->setSubcontractor($to, $this->user->getAccountId());
                        }
                        if ($qid) {
                            $transaction = Transactions::get(sprintf('transaction?id=%s', $qid));
                            $transactionModel = new TransactionModel(array_shift($transaction), $qid);
                            $signatoryModel = new SignatoryModel();
                            $doc_creator->setModels(['transaction' => $transactionModel, 'signatory' => $signatoryModel]);
                        }
                    }

                    if ($category) {
                        $tid = $category->getData('entity_id');
                        $pid = $category->getData('parent_id');
                        $projectModel = new ProjectModel(Project::getProject($pid), $pid);
                        $tenderModel = new TenderModel(Tender::getTender($pid, $tid), $tid);
                        $doc_creator->setModels(['project' => $projectModel, 'tender' => $tenderModel]);
                        $settings = [
                            'parseFiles' => true,
                            'sow' => true,
                        ];
                    }

                    $doc_meta = $document->getMeta();
                    $has_soa = $doc_meta['soa'] ?? false;
                    if ($has_soa) {
                        $soas = Document::get(sprintf(
                            "document?type=%s&subtype=%s",
                            Document::getDocumentType('contractual'),
                            Document::getSubType("soa_asset")->getId()
                        ));
                        if ($soas) {
                            $soa = end($soas);
                            $soa_loaded_id = Template::getLoadedDocId($soa['id'], $this->user->getAccountId());
                            $documentModel = new DocumentModel(Document::load($soa_loaded_id)->getData(), (string)$soa_loaded_id);
                            $doc_creator->setModel("soa", $documentModel);
                            $settings['soa'] = true;
                        }
                    }

                    $has_soamc = $doc_meta['soamc'] ?? false;
                    if ($has_soamc) {
                        $soamcs = Document::get(sprintf(
                            "document?type=%s&subtype=%s",
                            Document::getDocumentType('contractual'),
                            Document::getSubType("soamc_asset")->getId()
                        ));
                        if ($soamcs) {
                            $soamc = end($soamcs);
                            $soamc_loaded_id = Template::getLoadedDocId($soamc['id'], $this->user->getAccountId());
                            $soamc_model = new DocumentModel(Document::load($soamc_loaded_id)->getData(), (string)$soamc_loaded_id);
                            $doc_creator->setModel("soamc", $soamc_model);
                            $settings['soamc'] = true;
                        }
                    }

                    $has_purchase_order = $doc_meta['miniboq'] ?? false;
                    if ($has_purchase_order) {
                        $mini_boqs = Document::get(sprintf(
                            "document?type=%s&subtype=%s",
                            Document::getDocumentType('contractual'),
                            Document::getSubType("miniboq_asset")->getId()
                        ));
                        if ($mini_boqs) {
                            $mini_boq_loaded_id = null;

                            //load the correct miniboq json data based on the meta document id if provided
                            $found_mini_boq = false;
                            foreach ($mini_boqs as $mini_boq) {
                                $meta = json_decode($mini_boq['meta'], true);
                                if ($meta['did'] ?? '') {
                                    if ((int)$meta['did'] === $id) {
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
                                    $mini_boq_loaded_id = Template::getLoadedDocId($mini_boq['id'], $this->user->getAccountId());
                                }
                            }

                            $documentModel = new DocumentModel(Document::load($mini_boq_loaded_id)->getData(), $mini_boq_loaded_id);
                            $doc_creator->setModel("mini_boq", $documentModel);
                            $settings['parseMiniBoq'] = true;
                        }
                    }

                    $has_simple_quote_price = $doc_meta['simpleRowQuotePrice'] ?? false;
                    if ($has_simple_quote_price) {
                        $settings['parseSimpleRowQuotePrice'] = true;
                    }

                    $numberDocuments = [];
                    $hasNumberDocuments = $doc_meta['number_document'] ?? false;
                    if ($hasNumberDocuments) {
                        $settings['number_document'] = true;
                        $parent_id = $document->getData("id");
                        $numberDocuments = Document::get(sprintf(
                            "document?type=%s&subtype=%s&owner_id=%s&parent_id=%s",
                            Document::getDocumentType('contractual'),
                            Document::getSubType("number_document")->getId(),
                            $this->user->getAccountId(),
                            $parent_id
                        ));
                    }

                    try {
                        $tmpFolder = Utility::uniqueTempDir(config('document.download.folder'));

                        $content = $doc_creator->preview($settings);
                        $header = $content[0]["header"] ?? [];
                        if ($hasNumberDocuments) {
                            $header["address"] = "";
                        }
                        $footer = $content[0]["footer"] ?? [];
                        $contentChildren = $content[0]["children"] ?? [];

                        $index = 1; // keys of $contentChildren are not incremental
                        $tmpFiles = [];

                        $pdfName = $document->getData('name') . '.pdf';
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

                        //HAS ATTACHMENTS
                        $has_attachments = $doc_meta['attachments'] ?? false;
                        if ($has_attachments) {
                            $userModel = new UserModel($this->user->getData(), $this->user->getData("id"));
                            $attachmentsService = new Attachment($userModel);
                            $attachments = $attachmentsService->getAttachmentsForDocument($doc_meta, $document, (int)$id);
                            if (!empty($attachments)) {
                                $settings['attachments'] = true;
                                $tmpFiles = $attachmentsService->prepareTmpAttachmentPdfs($attachments, $tmpFolder, (int)$pid, (int)$tid, $settings, $tmpFiles, $index);
                            }
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
                        // Both produce a valid merged PDF.
                        $qpdfOk = ($exitCode === 0 || $exitCode === 3) && file_exists($mergedPath);
                        if (!$qpdfOk) {
                            throw new \RuntimeException('Error with qpdf');
                        }

                        if ($exitCode === 0 && file_exists($mergedPath)) {
                            $customFooterHtml = $footer['html'] ?? "";
                            $this->addGlobalPagination($mergedPath, $customFooterHtml);
                        }

                        header('Content-Type: application/pdf');
                        header('Content-Disposition: inline; filename="' . $pdfName . '"');
                        readfile($mergedPath);

                        $success = true;
                        exit;
                    } catch (\Exception $e) {
                        $success = false;
                    }
                }
            }
        }

        return $success;
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
     * @param int $id
     * @param string $type
     * @throws \App\Api\Exception
     */
    public function tender(int $id, string $type = ''): void
    {

        if ($id && $type == 'preview') {
            if (!$this->preview($id, TenderTemplate::ENTITY_TYPE)) {
                app()->view->render(views_path() . "/errors/500.php");
                return;
            }
        }

        $this->view->setContext(["react_app" => "clink"]);
        $this->view->setContext(["version" => 2]);
        renderLayouts('react');
    }

    /**
     * @param int $id
     * @param string $type
     * @throws \App\Api\Exception
     */
    public function instruction(int $id = 0, string $type = ''): void
    {
        if ($id) {
            if ($type == 'preview') {
                $this->instruction_preview($id, "instruction_template");
                app()->view->render(views_path() . "/errors/500.php");
                return;
            }
            if ($type == 'send') {
                $this->send_instruction($id, "instruction_template", "Instruction");
                app()->view->render(views_path() . "/errors/500.php");
                return;
            }
        }
    }

    /**
     * @param int $id
     * @param string $type
     */
    public function ncr(int $id = 0, string $type = ''): void
    {
        if ($id) {
            if ($type == 'preview') {
                $this->instruction_preview($id, "ncr_template");
                app()->view->render(views_path() . "/errors/500.php");
                return;
            }
            if ($type == 'send') {
                $this->send_instruction($id, "ncr_template", "NCR");
                app()->view->render(views_path() . "/errors/500.php");
                return;
            }
        }
    }

    /**
     * @param int $id
     * @param string $type
     * @throws \App\Api\Exception
     */
    public function template(int $id = 0, string $type = ''): void
    {
        // If an upstream step added an error flag, show a friendly error page instead of proceeding.
        $errorFlag = $this->request->getQueryValue('error');
        $numberDocument  = $this->request->getQueryValue('nd');
        if ($id && $type == 'preview') {
            if ($errorFlag) {
                $message = $numberDocument
                    ? sprintf("Asite failed to load numbered document %s. Please retry later or contact support.", $numberDocument)
                    : "We could not load the requested Asite document. Please retry later or contact support.";
                $view = stripos($errorFlag, 'asite') !== false ? "/errors/asite.php" : "/errors/500.php";
                app()->view->render(views_path() . $view, ['message' => $message]);
                return;
            }
            if (!$this->preview($id)) {
                app()->view->render(views_path() . "/errors/500.php");
                return;
            }
        }

        $this->view->setContext(["react_app" => "clink"]);
        $this->view->setContext(["version" => 2]);
        renderLayouts('react');
    }

    /**
     * @throws \App\Api\Exception
     */
    public function generate(): void
    {
        foreach (Sqs::read("default") as $message) {
            $data = json_decode($message['Body'], true);

            $did = $data['did'] ?? null;
            $sids = $data['sids'] ?? [];

            if ($did && $sids) {
                $categories = Document::getTemplateCategories($did);
                $category = $categories->filterByField('entity_type', TenderTemplate::ENTITY_TYPE)->getFirst();
                $tid = $category->getData('entity_id');
                $pid = $category->getData('parent_id');

                $doc_creator = new DocCreator(Document::load($did));
                $doc_creator->setModels([
                    'user' => (new UserModel($this->user->getData(), $data['uid'])),
                    'account' => (new AccountModel(Account::getAccount($data['aid']), $data['aid'])),
                    'project' => (new ProjectModel(Project::getProject($pid), $pid)),
                    'tender' => (new TenderModel(Tender::getTender($pid, $tid))),
                ]);

                foreach (Account::loadAccounts($sids) as $to) {
                    $doc_creator->setSubcontractor($to);
                    $content = $doc_creator->generate();
                    Sqs::send(json_encode([
                        'did' => $did,
                        'sid' => $to->getId(),
                        'content' => $content
                    ]), 'process');
                }
                Sqs::remove($message);
            }
        }
    }

    /**
     * @param array $request
     * @param DocumentModel $document
     * @return array
     * @throws \App\Api\Exception
     */
    public static function getAccounts(array $request, DocumentModel $document): array
    {
        $sids = $request['sids'] ?? [];
        if (!$sids) {
            $sid = self::getQuoteMeta($document)['subcontractor_id'];
            if ($sid) {
                $sids[] = $sid;
            }
        }
        if (empty($sids)) {
            throw new \Exception("Failed to find any subcontractor Ids");
        }
        $accounts = [];

        foreach (Account::getAccounts(array_unique($sids)) as $account) {
            if (ApiAccount::isTypeOf($account['type_id'], ApiAccount::getSpecialistTypes())) {
                $accounts[$account['id']] = $account;
            }
        }
        return $accounts;
    }

    /**
     * @param DocumentModel $document
     * @return array
     */
    public static function getQuoteMeta(DocumentModel $document): array
    {
        return $document->getMeta()['quote'] ?? [];
    }

    /**
     * @param int $id
     * @param string $type
     * @param string $label
     * @throws \App\Api\Exception
     */
    public function send_instruction(int $id, string $type, string $label): void
    {

        $success = false;
        $message = null;
        $instruction_id = $id;

        $doc_creator = $this->instruction_preview($id, $type, false);
        if ($doc_creator) {

            $pdf_content = $doc_creator['pdf'];
            $doc_creator = $doc_creator['doc_creator'];
            /*
             * Generate the pdf name
             */
            $pdf_name = sprintf(
                "%s %s Instruction %s.pdf",
                $doc_creator->getModel("project")->getData("name"),
                $doc_creator->getModel("tender")->getData("label"),
                $doc_creator->getModel("instruction")->getData("nr")
            );

            /*
             * Insert the document assets
             */
            $res = DocumentApi::post("document", [
                'owner_id'   => $this->user->getAccountId(),
                'type'       => Document::getDocumentType("contractual"),
                "subtype"    => Document::getSubType("instruction_asset")->getId(),
                "name"       => $pdf_name,
                "s3_bucket"  => 'asset',
                "meta"       => ['instruction_id' => $doc_creator->getModel("instruction")->getData("id")]
            ]);

            if ($id = $res->iDResponse()) {

                /*
                 * Upload the generated pdf to S3
                 */
                $s3_key = s3::getKey($id . "/" . Util::sanitizeStringURL($pdf_name), DocumentApi::DOCUMENT_CONTRACTUAL_LABEL, ["instructions"]);
                try {
                    $result = S3::uploadContent(
                        'pdf',
                        $s3_key,
                        $pdf_content,
                        [
                            'ContentDisposition' => "inline",
                            'ContentType' => "application/pdf"
                        ]
                    );
                    $pdf_url = $result['ObjectURL'];

                    /*
                     * Patch the instruction status to "sent"
                    */
                    $instruction_id = $doc_creator->getModel("instruction")->getData("id");
                    $types = array_filter(ProjectManagement::getStatus()->getData(), function ($item) {
                        return ($item['uid'] == "sent");
                    });
                    $type_last = end($types);
                    Project::patch("instruction/$instruction_id", ['status' => $type_last['id']]);

                    /*
                     * Patch document s3_key column
                     */
                    DocumentApi::patch("document/" . $id, ["s3_key" => $s3_key]);

                    /*
                     * Send email through hubspot
                    */

                    $fullname = $this->user->getData("firstname") . " " . $this->user->getData("lastname");
                    $subcontractor = $doc_creator->getModel("subcontractor");
                    $data = [
                        'project_name'                 => $doc_creator->getModel("project")->getData("name"),
                        'instruction_ncr_number'       => $doc_creator->getModel("instruction")->getData("nr"),
                        'instruction_type'             => $label,
                        'date_time'                    => $doc_creator->getModel("instruction")->formatDate(),
                        'first_name'                   => $this->user->getData("firstname"),
                        'subcontractor_name'           => $subcontractor->fullName(),
                        'main_contractor_name'         => $fullname,
                        'main_contractor_company_name' => $this->user->getAccountData("name"),
                        'attachments'                   => [[
                            "content" => base64_encode($pdf_content),
                            "name"    => $pdf_name,
                        ]]
                    ];

                    Email::send([
                        'template' => 'Instruction & Variation',
                        'sender'   => ['id' => $this->user->getId()],
                        'to'       => $this->user->getData("email"),
                        'extra'    => $data
                    ], 'clink');

                    Email::send([
                        'template' => 'Instruction & Variation Received',
                        'sender'   => ['id' => $this->user->getId()],
                        'to'       => $subcontractor->getData("email"),
                        'extra'    => $data
                    ]);

                    $success = true;
                } catch (\Exception $e) {
                    $message = $e->getMessage();
                }
            } else {
                $message = "Failed to send document";
            }
        } else {
            $message = "Failed to generate document";
        }

        /*
         * SNS send error
         */
        if (!$success && $message) {
            $sns_message = "Document ID: $instruction_id\n";
            $sns_message .= "Type ID: $type\n";
            $sns_message .= "Message: $message\n";
            Sns::send("failed_send_instruction", $sns_message);
        }

        $this->jsonContent(['success' => $success, 'message' => $message]);
    }

    /**
     * @throws \App\Api\Exception
     */
    public function send(): void
    {
        $request = json_decode(file_get_contents('php://input'), true);

        $did = $request['did'] ?? null;
        $tid = $request['tid'] ?? null;
        $uids = $request['suids'] ?? [];
        $signingMechanism = $request['signing_mechanism'] ?? null;
        $tender = TenderApi::getTenderById(intval($tid));
        $project = $tender["project"];
        $pid = intval($project["pid"]);

        $suids = [];
        $accountUserCounts = [];
        foreach ($uids as $key => $suid) {
            $aid = $request['sids'][$key] ?? null;
            $suids[] = [
                "uid" => $suid,
                "aid" => $aid
            ];
            if ($aid !== null) {
                if (!isset($accountUserCounts[$aid])) {
                    $accountUserCounts[$aid] = 0;
                }
                $accountUserCounts[$aid]++;
            }
        }

        $success = false;
        $message = null;
        if ($did) {
            $res = Document::get("document/$did");
            if ($res) {
                $document = new DocumentModel($res, $did);
                if ($document->isOwner($this->user)) {
                    try {
                        $accounts = self::getAccounts($request, $document);
                        try {
                            $subcontractors = [];

                            if ($document->isTenderDocument()) {
                                $categories = DocumentApi::getTemplateCategories($did);
                                $category = $categories->filterByField('entity_type', TenderTemplate::ENTITY_TYPE)->getFirst();
                                $tid = $category->getData('entity_id');
                                $pid = $category->getData('parent_id');
                                $addedStatusId = TenderApi::getHistoryTypes()
                                    ->filterByField("uid", "added")
                                    ->getFirst()
                                    ->getId();

                                $latestSend = null;
                                $latestSendTimestamp = null;
                                $history = EnquiryApi::get("project/$pid/tender/$tid/history", [
                                    "tender_history_type" => EnquiryApi::ENTITY_TYPE
                                ]);

                                foreach ($history as $historyItem) {
                                    foreach (($historyItem['history'] ?? []) as $item) {
                                        if ($item['status_id'] == $addedStatusId) {
                                            continue;
                                        }
                                        $timestamp = strtotime($item['created_at'] ?? '');
                                        if ($timestamp !== false && ($latestSendTimestamp === null || $timestamp > $latestSendTimestamp)) {
                                            $latestSend = $item;
                                            $latestSendTimestamp = $timestamp;
                                        }
                                    }
                                }

                                if ($latestSendTimestamp !== null) {
                                    $remainingSeconds = self::PACKAGE_SEND_COOLDOWN_SECONDS - (time() - $latestSendTimestamp);
                                    if ($remainingSeconds > 0) {
                                        $meta = json_decode($latestSend['meta'] ?? '', true) ?: [];
                                        $lastSendType = !empty($meta['is_tender_addendum']) ? 'Addendum' : 'Enquiry';

                                        http_response_code(429);
                                        $this->jsonContent([
                                            'success' => false,
                                            'message' => "An $lastSendType was already sent for this package less than 5 minutes ago. Please wait before sending again.",
                                        ]);
                                    }
                                }

                                //UPDATE BOQ STATUS TO TENDERED IF THE CONTRACTOR HAS BOQ SELECTED
                                $doc_creator = new DocCreator(Document::load($did));
                                if ($doc_creator->hasBoqEnabled()) {
                                    $token = app()->Cookie->getCookie('token');
                                    $boq = BoQApi::get("boq/" . $pid, [], ['Authorization' => "Bearer $token"]);
                                    if ($boq) {
                                        foreach ($boq as $item) {
                                            if ((int)$item['tender']['id'] === (int)$tid) {
                                                BoQApi::patch("boq/publish/" . $item['id'], ['status' => BoQApi::BOQ_TENDERED_STATUS], ['Authorization' => "Bearer $token"]);
                                                break;
                                            }
                                        }
                                    }
                                }
                            }

                            //we only have the contact modal script enable for tender documents
                            if ($document->isTenderDocument()) {
                                foreach ($suids as $suid) {
                                    DocQueue::Send([
                                        'did' => $did,
                                        'qid' => self::getQuoteMeta($document)['id'] ?? null,
                                        'sids' => $suid['aid'],
                                        'suids' => [$suid['uid']],
                                        'aid' => $this->user->getAccountId(),
                                        'uid' => $this->user->getId(),
                                        'signing_mechanism' => $signingMechanism,
                                        'time' => time(),
                                        'enquiry_type' => 'sending_tender',
                                        'account_total_users' => $accountUserCounts[$suid['aid']],
                                        'tid'  => $tid,
                                        'pid'  => $pid
                                    ]);
                                }
                            }

                            foreach ($accounts as $key_id => $account) {

                                $subcontractors[] = $account['name'];

                                /*
                                 * Set the enquiry history status to sent
                                 * as the queue is process at a later time
                                 */
                                if ($document->isTenderDocument()) {
                                    $meta = json_decode($account['meta'] ?? '', true);
                                    $sent_to = $meta[$this->user->getId()]['email'] ?? $account['email'];
                                    EnquiryApi::addHistory($pid, $tid, $account['id'], $this->user->getId(), $did, 'in_queue', TenderTemplate::isTenderAddendum($document->getData("name")), $sent_to);
                                } else {
                                    DocQueue::Send([
                                        'did' => $did,
                                        'qid' => self::getQuoteMeta($document)['id'] ?? null,
                                        'sids' => $account['id'],
                                        'suids' => [],
                                        'aid' => $this->user->getAccountId(),
                                        'uid' => $this->user->getId(),
                                        'signing_mechanism' => $signingMechanism,
                                        'time' => time()
                                    ]);
                                    $inQueueStatus = TenderApi::getHistoryTypes()->filterByField("uid", "in_queue")->getFirst()->getId();
                                    $newTenderHistory = [
                                        "author_id" => $this->user->getAccountId(),
                                        "specialist_id" => $account['id'],
                                        "status_id" => $inQueueStatus,
                                        "tender_history_type" => "Order",
                                        "meta" => []
                                    ];
                                    TenderApi::addTenderHistory($pid, $tid, $newTenderHistory);
                                }
                            }

                            /*
                             * Send enquiry email to contractor
                             */
                            if ($document->isTenderDocument()) {
                                $project = Project::getProject($pid);
                                $contractorModel = new UserModel($this->user->getData(), $this->user->getId());
                                $company = $contractorModel->getData("account");
                                $role = trim((string) $contractorModel->getData("job_title", ""));
                                $request = $contractorModel->createTokenByLabel($this->user->getId(), 'auto_loader');
                                $json = $request->json()["data"] ?? [];
                                $data = [
                                    'project_name'       => $project['name'],
                                    'package_name'       => Tender::getTender($pid, $tid)['label'],
                                    'first_name'         => $this->user->getData("firstname"),
                                    'subcontractor_list' => $this->getSubcontractorEnquiryList($subcontractors),
                                    'sender_name'        => $this->user->getData("display_name"),
                                    'sender_role'        => $role,
                                    'sender_company'     => $company["name"],
                                    'token_url'          => sprintf(
                                        "%s/auto_loader/?token=%s&redirect=project/%s/issue_enquiry#document-%s",
                                        config("url.site"),
                                        $json['token'],
                                        $project['slug'],
                                        $did
                                    )
                                ];

                                $template = 'Enquiry Sent';
                                if (TenderTemplate::isTenderAddendum($document->getData("name"))) {
                                    $template = 'Addendum Sent';
                                }

                                //Email to the person that sends the enquiry
                                Email::send([
                                    'template' => $template,
                                    'sender'   => ['id' => $this->user->getId()],
                                    'to'       => $this->user->getData("email"),
                                    'extra'    => $data
                                ], 'clink');

                                //Email to the project owner
                                //the project author id is not set for old projects and we need to fallback to the company owner
                                if (!$project['author_id']) {
                                    $project_owner = ApiAccount::getAccount($project['group_id']);
                                } else {
                                    $project_owner = ApiAccount::getUser($project['author_id']);
                                    $contractorModel = new UserModel($project_owner, $project['author_id']);
                                    $request = $contractorModel->createTokenByLabel($project['author_id'], 'auto_loader');
                                    $json = $request->json()["data"] ?? [];
                                    $data['token_url'] = sprintf(
                                        "%s/auto_loader/?token=%s&redirect=project/%s/issue_enquiry#document-%s",
                                        config("url.site"),
                                        $json['token'],
                                        $project['slug'],
                                        $did
                                    );
                                    $data['first_name'] = $project_owner['firstname'];
                                }
                                //send email to the project owner if the email is valid and not the same as the sender
                                if (isset($project_owner['email']) && filter_var($project_owner['email'], FILTER_VALIDATE_EMAIL) && $this->user->getData("email") !== $project_owner['email']) {
                                    $data['sender_name'] = $this->user->getFullName();
                                    $data['sender_role'] = trim((string) $this->user->getData("job_title"));
                                    $data['sender_company'] = $this->user->getAccountData("name");
                                    Email::send([
                                        'template' => $template,
                                        'sender' => ['id' => $this->user->getId()],
                                        'to' => $project_owner['email'],
                                        'extra' => $data
                                    ], 'clink');
                                }

                                ProcurementScheduleOverview::milestoneComplete(intval($tid), self::ENQUIRY_ISSUE_DATE_MILESTONE_LABEL);
                            }
                        } catch (\Exception $e) {
                            error_log($e->getMessage());
                            $message = 'Something went wrong';
                        }
                        $success = true;
                    } catch (\Exception $e) {
                        $message = $e->getMessage();
                    }
                } else {
                    $message = 'Permission Denied';
                }
            } else {
                $message = 'Document not valid';
            }
        } else {
            $message = 'Missing json data';
        }

        $this->jsonContent(['success' => $success, 'message' => $message]);
    }

    /**
     * @param array $content
     */
    public function jsonContent(array $content): void
    {
        header("Content-Type: application/json");
        echo json_encode($content);
        die;
    }

    /**
     * @param array $subcontractors
     * @return string
     */
    public function getSubcontractorEnquiryList(array $subcontractors): string
    {
        $current_date = date('H:i \o\n F j, Y', strtotime(date("Y-m-d H:i")));
        return implode(" (sent at $current_date)" . "\n", $subcontractors) . " (sent at $current_date)";
    }
}
