<?php

namespace App\Cron;

use App\Api\Account;
use App\Api\Aws\Sqs;
use App\Api\Document as DocumentApi;
use App\Api\Project;
use App\Api\S3;
use App\Api\Tender\Enquiry as EnquiryApi;
use App\Api\Document\TenderTemplate;
use App\Api\Tender;
use App\DocCreator\DocCreator;
use App\Models\Account as AccountModel;
use App\Models\Project as ProjectModel;
use App\Models\Tender as TenderModel;
use App\Models\UserModel;
use App\Models\Util;
use CL\Pdf\Parser;

class Enquiry
{

    public const ENQUIRY_SUBTYPE_ID = 15;
    public const ENQUIRY_TYPE_ID = 3;

    /**
     * @return array
     */
    public function getQueueItems(): array
    {
        return Sqs::read("default");
    }

    public function init(int $did, array $data) : DocCreator {

        $categories = DocumentApi::getTemplateCategories($did);
        $category = $categories->filterByField('entity_type', TenderTemplate::ENTITY_TYPE)->getFirst();
        $tid = $category->getData('entity_id');
        $pid = $category->getData('parent_id');

        $account = Account::getAccount($data['aid']);
        $account_data = Account::get("user/".$data['uid']."/profile");
        $account_data['account'] = [
            'name' => $account['name'],
            'address' => $account['address'],
            'reg_number' => $account['reg_number'],
            'landline' => $account['landline'],
            'email' => $account['email']
        ];

        $doc_creator = new DocCreator(DocumentApi::load($did));
        $doc_creator->setModels([
            'user' => (new UserModel($account_data, $data['uid'])),
            'account' => (new AccountModel($account, $data['aid'])),
            'project' => (new ProjectModel(Project::getProject($pid), $pid)),
            'tender' => (new TenderModel(Tender::getTender($pid, $tid), $tid)),
            "category" => $category
        ]);

        return $doc_creator;
    }

    /**
     * @return void
     * @throws \App\Api\Exception
     * @throws \Mpdf\MpdfException
     */
    public function send(): void
    {
        foreach($this->getQueueItems() as $message) {
            $data = json_decode($message['Body'], true);

            $did = $data['did'] ?? null;
            $sids = $data['sids'] ?? [];
            if ( $did && $sids ) {
                $doc_creator = $this->init($did, $data);

                $doc_name = $doc_creator->document()->getData('name');

                $tender_addendum = false;
                if(strpos($doc_name, TenderTemplate::TENDER_ADDENDUM) !== false){
                    $tender_addendum = true;
                }

                $documents = [];
                foreach (Account::loadAccounts($sids) as $to) {
                    $doc = $this->createDocument($data['aid'], $to, $doc_creator);
                    $documents[$to->getId()] = $doc;
                    if($documents[$to->getId()]) {
                        $this->sendEmail(
                            [$doc_creator->getModel("account"), $doc_creator->getModel("user")],
                            $to,
                            $doc_creator->getModel("project"),
                            $doc_creator->getModel("category"),
                            $documents[$to->getId()]['url'],
                            $tender_addendum
                        );
                    }
                    EnquiryApi::send($doc_creator->getModel("tender"), (int) $data['aid'], $documents);
                }

                //I think we need a better strategy to capture failed enquiries, such as notify an admin
                Sqs::remove($message);
            }
        }
    }

    /**
     * @param int $aid
     * @param AccountModel $sid
     * @param $doc_creator
     * @return array
     * @throws \Mpdf\MpdfException
     */
    public function createDocument(int $aid, AccountModel $sid, $doc_creator): array
    {
        $project = $doc_creator->getModel('project')->getData();
        $tender = $doc_creator->getModel('tender')->getData();

        $doc_creator->setSubcontractor($sid);
        $content = $doc_creator->generate();
        $parser = new Parser($content);
        $pdf = $parser->parse();

        $pdf_name = sprintf("%s %s %s.pdf", $project['name'], $tender['label'],date("d-m-Y") );
        $pdf_name = Util::sanitizeStringURL($pdf_name);

        $res = DocumentApi::post("document", [
            'owner_id'  => $aid,
            'type'      => self::ENQUIRY_TYPE_ID,
            "name"      => $pdf_name,
            "subtype"    => self::ENQUIRY_SUBTYPE_ID,
            "s3_bucket" => "assets"
        ]);
        $success = $res->getStatus() === 200;
        $id = ($success) ? $res->json()["data"]["id"] : null;

        try {
            if ($id) {
                $pdf_output = $pdf->output($pdf_name, 'S');
                $file = sprintf("%s/$pdf_name", $id);
                $key = s3::getKey($file, DocumentApi::DOCUMENT_CONTRACTUAL_LABEL, ["enquiries"]);

                $result = S3::uploadContent(
                    'pdf',
                    $key,
                    $pdf_output,
                    [
                        'ContentDisposition' => "inline",
                        'ContentType' => "application/pdf"
                    ]
                );
                DocumentApi::patch("document/" . $id, ["s3_key" => $key]);
                return [
                    'path' => $key,
                    'name' => $pdf_name,
                    'url' => $result['ObjectURL'],
                    'id' => $id
                ];
            }
            throw new \Exception("Failed to create document");
        }
        catch (\Exception $e){
            error_log("Enquiry Send: ". $e->getMessage());
        }
        return [];
    }

    /**
     * @param $from
     * @param $to
     * @param $project
     * @param $category
     * @param $document
     * @param false $is_tender_addendum
     */
    public function sendEmail($from, $to, $project, $category, $document, $is_tender_addendum = false): void
    {

        $subject = "Tender Enquiry for " . $project->getData("name") . " - " . $category->getData('label');
        $template = 'enquiry-send';
        if($is_tender_addendum){
            $subject = "Tender Addendum for " . $project->getData("name") . " - " . $category->getData('label');
            $template = 'tender-addendum-send';
        }

        list($account, $user) = $from;
        $subcontractor_data = $to->getData();
        $email_address = $subcontractor_data['email'];
        $name = $subcontractor_data['name'];
        $email = clink_email();
        $email->subject($subject);
        $email->to($email_address);
        $email->cc();
        $email->bcc(config('email.clink.default.email'),config('email.clink.default.name'));
        $email->template($template, [
            'name'    => $name,
            'company' => $account->getData("name"),
            'project_name' => $project->getData("name"),
            'tender_name'  => $category->getData('label'),
            "company_telephone" => $account->getData("landline"),
            "user_name" => $user->getData("display_name"),
            'attachment'   => $document
        ]);
        $email->send();
    }
}
