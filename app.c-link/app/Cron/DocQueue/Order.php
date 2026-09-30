<?php

namespace App\Cron\DocQueue;

use App\Api\Document as DocumentApi;
use App\Api\Email\Email;
use App\Api\S3;
use App\Api\Tender\Order as OrderApi;
use App\Api\Transactions;
use App\core\Config;
use App\DocCreator\DocCreator;
use App\Models\Account as AccountModel;
use App\Models\DownloadAccess;
use App\Models\Transaction as TransactionModel;
use App\Models\UserModel;
use App\Api\Account as AccountApi;
use App\Api\ProcurementScheduleOverview;
use App\Models\Signatory as SignatoryModel;
use App\core\Environment as Env;

class Order extends Abstraction
{

    const TYPE = "Order";
    const EMAIL_TEMPLATE = 'order-send';
    const TENDER_HISTORY_SENT_ID = 1;
    const TENDER_HISTORY_AWARDED_ID = 7;
    const TENDER_HISTORY_PENDING_SIGNATORY_ID = 12;
    const TENDER_HISTORY_SIGNED_ID = 13;
    const TENDER_HISTORY_ORDER_REJECTED_ID = 14;
    const TRANSACTION_SENT_ID = 1;
    /* TODO: Remove if we decide to drop draft orders work */
    const TOGGLE_DRAFT_WORK = false;

    /**
     * @return int
     */
    public function getCronDocSubType(): int
    {
        return (int) DocumentApi::getSubType("order_template")->getId();
    }

    /**
     * @param string $file
     * @return string
     */
    public function getS3Key(string $file): string
    {
        return s3::getKey($file, DocumentApi::DOCUMENT_CONTRACTUAL_LABEL, ["orders"]);
    }

    public function process()
    {
        $this->getDocCreator()->setOption('snapshot_mode', 'order');
        parent::process();
    }

    /**
     * @return bool
     */
    public function isTenderAddendum(): bool
    {
        return false;
    }

    /**
     * @return string
     */
    public function getEntityType(): string
    {
        return OrderApi::ENTITY_TYPE;
    }

    /**
     * @return string
     */
    public function getEmailSubject(): string
    {
        $project = $this->getDocCreator()->getModel('project');
        $category = $this->getDocCreator()->getModel('category');
        return  "Order issued for " . $category->getData('label') . " - " .  $project->getData('label');
    }

    public function getDocCreator(): DocCreator
    {
        if (!isset($this->docCreator)) {
            $this->docCreator = parent::getDocCreator();
            $qid = $this->data['qid'];
            try {
                $transaction = Transactions::get(sprintf('transaction?id=%s', $qid));
                $transaction = array_shift($transaction);
                $this->docCreator->setModels([
                    'signatory' => (new SignatoryModel()),
                    'transaction' => (new TransactionModel($transaction, $qid)),
                ]);
            } catch (\Throwable $th) {
                $this->docCreator->setModels([
                    'signatory' => (new SignatoryModel()),
                ]);
            }
        }
        return $this->docCreator;
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
            $document + ['order_number' => $this->getDocCreator()->getSingleShortcode('OrderReference')]
        );
    }

    /**
     * @param array $accounts
     * @param array $documents
     */
    public function afterProcess(array $accounts, array $documents)
    {
        foreach ($documents as $document) {
            $tmp = S3::getSaveTmpPath($document['name']);
            if (file_exists($tmp)) {
                unlink($tmp);
            }
        }
    }

    /**
     * @param AccountModel $to
     * @param array $from
     * @param string $subject
     * @param $document
     * @return void
     * @throws \App\Api\Exception
     */
    public function sendEmail(AccountModel $to, array $from, string $subject, $document): void
    {
        list($account, $user) = $from;
        $subEmail = $to->getData("email");

        //adding bcc emails
        $bcc = [
            config("email.clink.paul.email"),
            config("email.clink.francis.email")
        ];

        $project = $this->getDocCreator()->getModel('project');
        $tender  = $this->getDocCreator()->getModel("tender");
        $email_data = [];
        $data = [
            'fullname'           => $to->getData("name"),
            'email'              => $user->getData('email'),
            'company_name'       => $account->getData("name"),
            'project_name'       => $project->getData("name"),
            'tender_name'        => $tender->getData("label"),
            "company_telephone"  => $user->getData("contact_number"),
            "user_name"          => $user->getData("display_name"),
            "user_role"          => trim((string) $user->getData("job_title", "")),
            "subcontractor_name" => $to->getData("name"),
            "contractor_name"    => $user->getData("firstname"),
            'attachment'         => $document['url'],
            'order_no'           => $document['order_number'],
        ];
        $signatory = $document['signatory'] ?? null;

        //Send the pdf content to the email service
        $tmp_name = sprintf("%s/%s", "/tmp", $document['name']);
        S3::save(Env::getValue("AWS_S3_PDF_BUCKET"), $document['path'], $tmp_name);
        if (file_exists($tmp_name)) {
            $data['attachments'] = [[
                'name' => $document['name'],
                'content' => base64_encode(file_get_contents($tmp_name))
            ]];
        }

        if ($signatory) {
            $envelope_id  = $signatory->getEnvelopeId();

            // Check if signatory is already recorded
            $signatoryData = DocumentApi::get("document/envelope/$envelope_id");
            if (empty($signatoryData)) {
                $signatoryApi = DocumentApi::post("signatory", [
                    'document_id'  => $this->getDocCreator()->document()->getId(),
                    'signatory_id' => $envelope_id
                ]);
                $signatory_id = $signatoryApi->json()['data']['id'] ?? null;
            } else {
                $signatory_id = $signatoryData['id'];
            }

            if ($signatory_id) {
                $status     = DocumentApi::get("signatory/status", ['uid' => 'pending']);
                $status_id  = array_shift($status)['id'];
                $contractor = 0;
                $subcontractor = 0;
                $subcontractor_company_name = '';
                $signatory_snapshot = [];
                foreach ($signatory->getSigners() as $signer) {
                    $recipient_id = $signer->getRecipientId();
                    $signatory_snapshot[(int)$recipient_id] = [
                        'email' => $signer->getEmail(),
                        'full_name' => $signer->getName(),
                    ];

                    $aid = AccountApi::getAccountIdByUser($recipient_id);
                    $account = AccountApi::getAccount($aid);
                    if (AccountApi::isTypeOf($account['type_id'], AccountApi::getSpecialistTypes())) {
                        $subcontractor = $aid;
                        $subcontractor_company_name = $account['name'];
                    } else {
                        $contractor = $aid;
                    }
                    DocumentApi::post("signatory/$signatory_id/signer", [
                        'user_id'   => $recipient_id,
                        'status_id' => $status_id
                    ]);
                }
                $document_model = $this->getDocCreator()->document();
                $document_meta = $document_model->getMeta();
                $document_meta['signatory_snapshot'] = $signatory_snapshot;
                DocumentApi::patch(
                    "document/" . $document_model->getId(),
                    ['meta' => json_encode($document_meta)]
                );
                $bcc_sent = false;
                $stored_signers = DocumentApi::get("signatory?id=$envelope_id");
                $signer_orders = SignatoryModel::getSignerOrdersFromStoredSigners($stored_signers['signer'] ?? []);
                foreach ($signatory->getSigners() as $signer) {
                    $recipient_id = $signer->getRecipientId();
                    $account = AccountApi::getAccount(AccountApi::getAccountIdByUser($recipient_id));
                    $type    = (AccountApi::isTypeOf($account['type_id'], AccountApi::getSpecialistTypes())) ? 'Subcontractor' : 'Contractor';
                    $userModel = new UserModel([], $recipient_id);
                    $userModel->setData("signatory_email_order", $signer_orders[$userModel->getId()] ?? count($signer_orders));

                    $request   = $userModel->createTokenByLabel($recipient_id, 'signatory_request', [
                        'envelope_id'    => $envelope_id,
                        'recipient_id'   => $recipient_id,
                        'project_id'     => $project->getId(),
                        'tender_id'      => $tender->getId(),
                        'contractor'     => $contractor,
                        'subcontractor'  => $subcontractor,
                        'type'           => $type,
                        'sign_shortcode' => $signer->getSignerShortcode(),
                    ]);
                    $json = $request->json()["data"] ?? [];
                    $email_data[$recipient_id] = array_merge($data, [
                        'template' => 'Order Signatory',
                        'app'      => ($type === 'Contractor') ? 'clink' : 'prosper',
                        'fullname' => $signer->getName(),
                        'subcontractor_name' => $signer->getName(),
                        'subcontractor_company_name' => $subcontractor_company_name,
                        'email'    => $signer->getEmail(),
                        'signatory_order' => $userModel->getData("signatory_email_order"),
                        'docusign' => sprintf("%s/signatory/request/%s", Config::get("url.site"), $json['token'])
                    ]);
                    //send the email to bcc but only for the first main contractor
                    if (!$bcc_sent && $type === 'Contractor') {
                        $email_data[$recipient_id]['bcc'] = $bcc;
                        $bcc_sent = true;
                    }
                }

                usort($email_data, function ($a, $b) {
                    return $a['signatory_order'] <=> $b['signatory_order'];
                });
            } else {
                throw new \Exception("Signatory id not found");
            }
        }
        //wet (no signatory)
        else {
            $email_data = [
                $user->getId() => array_merge($data, ['template' => 'Order Sent',     'app' => 'clink',   'email' => $user->getData("email"), 'bcc' => $bcc]),
                $to->getId()   => array_merge($data, ['template' => 'Order Received', 'app' => 'prosper', 'email' => $subEmail])
            ];
        }

        if ($signatory && $email_data) {
            $email_data = array_values($email_data);
            $email_data[] = array_merge($email_data[0], ['template' => 'Order Signatory Action Required']);
        }

        Email::sendBulk($user->getId(), $email_data);
    }

    /**
     * @return string
     */
    public function getEmailTemplate(): string
    {
        return self::EMAIL_TEMPLATE;
    }

    /**
     * @param AccountModel $sid
     * @param $document
     * @return void
     * @throws \App\Api\Exception
     */
    public function afterSend(AccountModel $sid, $document)
    {
        $transaction = $this->getDocCreator()->getModel("transaction");
        $tender = $this->getDocCreator()->getModel("tender");
        $project = $this->getDocCreator()->getModel("project");
        $subcontractor = $this->getDocCreator()->getModel("subcontractor");
        $docusign = $document['signatory'] ?? null;

        //Update the document ownership to the subcontractor so they can view the document
        //from their dashboard
        DocumentApi::patch(sprintf("document/%s/owner", $document['id']), [
            'owner_id' => $sid->getData("id")
        ]);

        /*
         * Update transaction
         */
        Transactions::patch("project/{$project->getId()}/tender/transaction/{$transaction->getId()}", [
            "order_price"   =>  $this->getDocCreator()->getMeta()['values']['order_value'],
            "order_number"   =>  $this->getDocCreator()->getSingleShortcode('OrderReference'),
            "order_created" => date('Y-m-d H:i:s'),
            'order_updated' => date("Y-m-d H:i:s"),
            "meta" => [
                'subcontractor' => $subcontractor->getData('name'),
                'document' => $document,
                'order_template_id' => $this->did,
                'transaction_id' => intval($transaction->getId()),
            ] + (self::TOGGLE_DRAFT_WORK ? TransactionModel::setMetaDocumentStatus($transaction->getData(), $this->did, 'sent') : []),
            'status_id' => self::TRANSACTION_SENT_ID
        ]);

        /*
         * Update tender
         */
        Transactions::patch("project/{$project->getId()}/tender/{$tender->getId()}", [
            "awarded" => 1
        ]);

        /*
         * The package is settled, so the download links held by the
         * subcontractors who were not selected stop working here.
         */
        DownloadAccess::revokeForTender((int) $tender->getId(), (int) $sid->getId());

        $aid = $this->data['aid'];
        $signingMechanism = $this->data['signing_mechanism'] ?? null;
        $isSigning = in_array($signingMechanism, ['wet', 'docusign']);
        /*
         * Update tender history
         */
        Transactions::post("project/{$project->getId()}/tender/{$tender->getId()}/history", [
            "author_id" => $aid,
            "specialist_id" => $subcontractor->getId(),
            "status_id" => self::TENDER_HISTORY_AWARDED_ID,
            "tender_history_type" => "Enquiry",
            "meta" => [
                'id' => $subcontractor->getId(),
                'contact_name' => $subcontractor->getData('name'),
                'user_id' => $aid
            ]
        ]);

        // History to show new order status in prosper side.
        // signatory orders are recorded as "Sent"; all other mechanisms stay "Awarded".
        Transactions::post("project/{$project->getId()}/tender/{$tender->getId()}/history", [
            "author_id" => $aid,
            "specialist_id" => $subcontractor->getId(),
            "status_id" => $isSigning ? self::TENDER_HISTORY_SENT_ID : self::TENDER_HISTORY_AWARDED_ID,
            "tender_history_type" => "Order",
            "meta" => [
                'id' => $subcontractor->getId(),
                'contact_name' => $subcontractor->getData('name'),
                'user_id' => $aid
            ]
        ]);

        // mark the "Tender Issued" milestone as complete
        ProcurementScheduleOverview::milestoneComplete($tender->getId(), "Order Issued");

        if ($docusign) {
            Transactions::post("project/{$project->getId()}/tender/{$tender->getId()}/history", [
                "author_id" => $aid,
                "specialist_id" => $subcontractor->getId(),
                "status_id" => self::TENDER_HISTORY_PENDING_SIGNATORY_ID,
                "tender_history_type" => "Order",
                "meta" => [
                    'id' => $subcontractor->getId(),
                    'contact_name' => $subcontractor->getData('name'),
                    'user_id' => $aid
                ]
            ]);
            $envelopes = AccountApi::getEnvelopes($aid);
            if ($envelopes && intval($envelopes["current"]) > 0) {
                $envelopes["current"] = intval($envelopes["current"]) - 1;
                AccountApi::updateEnvelopes($aid, $envelopes);
            }
        }
    }
}
