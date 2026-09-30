<?php

namespace App\Cron\DocQueue;

use App\Api\Document as DocumentApi;
use App\Api\Email\Email;
use App\Api\S3;
use App\Api\Tender\Enquiry as EnquiryApi;
use App\Api\Document\TenderTemplate;
use App\core\Config;
use App\Cron\DocQueue;
use App\Models\Account as AccountModel;
use App\Models\Subcontractor;
use App\Api\Account as AccountApi;
use App\Api\Project as ProjectApi;
use App\Models\UserModel;

class Enquiry extends Abstraction
{

    const TYPE = "Enquiry";

    const EMAIL_TEMPLATE = "enquiry-send";

    private const ADDENDUM_DATE_FORMAT = 'd/m/Y';
    private const TENDER_DATE_FORMAT = 'd-m-Y';

    /**
     * The addendum field holding the tender return date being issued.
     */
    private const ADDENDUM_RETURN_DATE_KEY = 'new_tender_return_date';

    /**
     * @return int
     */
    public function getCronDocSubType() : int {
        return (int) DocumentApi::getSubType(TenderTemplate::ENTITY_TYPE)->getId();
    }

    /**
     * @return string
     */
    public function getEntityType() : string {
        return TenderTemplate::ENTITY_TYPE;
    }

    /**
     * @param string $file
     * @return string
     */
    public function getS3Key(string $file) : string {
        return s3::getKey($file, DocumentApi::DOCUMENT_CONTRACTUAL_LABEL, ["enquiries"]);
    }

    /**
     * @return bool
     */
    public function isTenderAddendum(): bool
    {
        return strpos($this->getDocCreator()->document()->getData('name'), TenderTemplate::TENDER_ADDENDUM) !== false;
    }

    public function process()
    {
        $mode = $this->isTenderAddendum() ? 'addendum' : 'enquiry';
        $this->getDocCreator()->setOption('snapshot_mode', $mode);
        parent::process();
    }

    /**
     * @return string
     */
    public function getEmailSubject(): string
    {
        $subject = $this->isTenderAddendum() ? 'Tender Addendum' : 'Tender Enquiry';
        $project = $this->getDocCreator()->getModel('project');
        $category = $this->getDocCreator()->getModel('category');
        $subject .= " for " . $project->getData("name") . " - " . $category->getData('label');
        return $subject;
    }

    /**
     * @return string
     */
    public function getEmailTemplate(): string
    {
        return $this->isTenderAddendum() ? 'tender-addendum-send' : self::EMAIL_TEMPLATE;
    }

    /**
     * @param AccountModel $account
     * @param $document
     * @return void
     * @throws \Exception
     */
    public function sendDocument(AccountModel $account, $document)
    {
        //let the exception propagate so DocQueue::process
        //marks the item as failed, keeps it on the queue and notifies via SNS.
        $subcontractor = new Subcontractor($account->getData(), $account->getId());
        $contractor = $this->getDocCreator()->getModel("account");
        $subcontractor->setData("main_contractor_id", $contractor->getData("id"));

        $email_template = 'Tender Received';
        $enquiryType = 'Tender Enquiry';
        if( $this->isTenderAddendum()){
            $email_template = "Addendum Received";
            $enquiryType = 'Tender Addendum';
        }

        $user_contact = $subcontractor->getSupplyChainContact($contractor->getData("id"));
        $email = $user_contact['email'] ?? $subcontractor->getData("email");

        $isInactive = ($subcontractor->isExternalAccount() && !$subcontractor->isMembershipType('activated_supply_chain'));
        $contractor_user = AccountApi::getUser($this->data['uid']);
        $contractorModel = new UserModel($contractor_user, $contractor_user['id']);
        $data = $this->getEmailSendData($subcontractor, $contractor, $contractorModel, $isInactive, $enquiryType);

        if($isInactive){
            $email_template .= ' Inactive';
        }

        $emailTypeIds = AccountApi::getEmailTypeIds(['bounce', 'sent']);

        $emailTypeId = $emailTypeIds[0];
        try{
            Email::send([
            'template' => $email_template,
            'sender'   => $account->getData("user"),
            'to'       => $email,
            'extra'    => $data
            ]);
            $emailTypeId = $emailTypeIds[1];
        }
        catch(\Exception $e){
            $message = json_encode($account->getData());
            DocQueue::handleQueueError($e, $message);
        }

        if (isset($this->data['enquiry_type']) && $this->data['enquiry_type'] === 'sending_tender') {
            $tid        = (int) $this->data['tid'];
            $totalUsers = (int) $this->data['account_total_users'];
            $documentDetails = DocumentApi::get(sprintf(
                'document/%d',
                $document['id']
            ));
            $entityId   = (int) $document['id'];
            $enquiry    = (int) $documentDetails['parent_id'];
            // Ensure pid is available; fallback to project model if not passed in queue payload
            $pid        = (int) ($this->data['pid'] ?? $this->getDocCreator()->getModel('project')->getId() ?? 0);
            $sidsList   = is_array($this->data['sids']) ? $this->data['sids'] : [$this->data['sids']];
            foreach ($sidsList as $sidVal) {
                $accountId = (int)$sidVal;
                $recipientIds = $this->data['suids'];
                if (!empty($recipientIds)) {
                    $userId = (int) $recipientIds[0];
                    $userProfile = AccountApi::get("user/$userId/profile");
                    $email = $userProfile['email'] ?? null;
                }
                AccountApi::post("email/log", [
                    "email_id" => $emailTypeId,
                    "user_id"  => $this->data['uid'],
                    "template" => $email_template,
                    "meta"     => json_encode([
                        'recipient_id' => $this->data['suids'],
                        'entity_id'    => $entityId,
                        'enquiry'      => $enquiry,
                        'entity_type'  => 'Enquiry Sent',
                        'tender_id'    => $tid,
                        'account_id'   => $accountId,
                        'email'        => $email
                    ])
                ]);

                // Processed emails count (all users)
                $processed = AccountApi::get("email/logs-by-entity-account", [
                    "user_ids"     => $this->data['uid'],
                    'enquiry'      => $enquiry,
                    'entity_type'  => 'Enquiry Sent',
                    'account_id'   => (string)$accountId
                ]);
                if (count($processed) < $totalUsers) {
                    continue; // still in_queue for this account, wait for remaining users
                }

                // Any success?
                $sent = AccountApi::get("email/logs-by-entity-account", [
                    "user_ids"     => $this->data['uid'],
                    'enquiry'      => $enquiry,
                    'entity_type'  => 'Enquiry Sent',
                    'account_id'   => (string)$accountId,
                    'email_id'     => 4
                ]);

                $tender_status = ProjectApi::getTenderHistoryTypeIds(["sent","bounced","in_queue"]);
                $finalStatus = (count($sent) > 0) ? $tender_status[0] : $tender_status[1];
                // Update tender_history if still in_queue
                $results = EnquiryApi::get(
                    "project/$pid/tender/$tid/history",
                    [
                        "specialist_id" => $accountId,
                        "status_id"     => $tender_status[2] // ONLY in_queue
                    ]
                );
                $results = array_shift($results);

                if (!$results || empty($results['history'])) {
                    continue;
                }

                $history = array_shift($results['history']);
                EnquiryApi::updateHistory(
                    $pid,
                    $tid,
                    $history['id'],
                    ["status_id" => $finalStatus]
                );
            }
        }
    }

    /**
     * @param AccountModel $sid
     * @param $document
     * @throws \App\Api\Exception
     */
    public function afterSend(AccountModel $sid, $document)
    {
        $contractor = $this->getDocCreator()->getModel('account');
        $subcontractor = new Subcontractor($sid->getData() + ['main_contractor_id' => $contractor->getId()], $sid->getId());
        $project = $this->getDocCreator()->getModel('project');
        $exclude_statuses = ProjectApi::getTenderHistoryTypeIds(["dismissed", "deleted", "added"]);
        $epoch_first_enquiry_date = AccountApi::getConfig("enquiry.first_enquiry_received_epoch_date", "");
        try{
            $history = ProjectApi::getSpecialistHistory($sid->getId(), 'Enquiry');
            $total_enquiries = $sid->getEnquiryReceivedTotal($history, $exclude_statuses, $epoch_first_enquiry_date);
        }catch (\Exception $e){
            $total_enquiries = 0;
        }
        //when you send an enquiry we add the entry to the history table before the queue is processed
        //so at the time that the queue is processed the subcontractor will have at least 1 enquiry in history
        if($total_enquiries <= 1){
            Email::send([
                'template' => 'First Enquiry Received',
                'sender'   => $sid->getData("user"),
                'to'       => $subcontractor->getEmail(),
                'extra'    => [
                    'firstname'    => $subcontractor->fullName(),
                    'project_name' => $project->getData("name")
                ]
            ]);
        }
    }

    /**
     * @param array $accounts
     * @param array $documents
     * @return void
     * @throws \App\Api\Exception
     */
    public function afterProcess(array $accounts, array $documents)
    {
        $enquiryType = $this->isTenderAddendum() ? 'Tender Addendum' : 'Tender Enquiry';
        EnquiryApi::updateMetaHistory($this->getDocCreator()->getModel("tender"), $this->data['uid'], $documents, $this->did, ['accounts' => $accounts, EnquiryApi::BOQ_AVAILABLE_KEY => $this->getDocCreator()->hasBoqEnabled()], $enquiryType);

        if ($this->isTenderAddendum()) {
            $this->syncTenderReturnDate();
        }

        parent::afterProcess($accounts, $documents); // TODO: Change the autogenerated stub
    }

    /**
     * Moves the tender return date chosen on the addendum onto the tender, so
     * the procurement schedule shows the date the subcontractors have just been
     * given.
     */
    private function syncTenderReturnDate(): void
    {
        try {
            $meta     = $this->getDocCreator()->getMeta();
            $selected = trim((string) ($meta['values'][self::ADDENDUM_RETURN_DATE_KEY] ?? ''));

            if ($selected === '') {
                return;
            }

            $date = \DateTime::createFromFormat(self::ADDENDUM_DATE_FORMAT, $selected);

            if (!$date) {
                error_log("Enquiry: addendum {$this->did} carries an unreadable tender return date '{$selected}'");

                return;
            }

            $tender  = $this->getDocCreator()->getModel('tender');
            $project = $this->getDocCreator()->getModel('project');
            $stored  = $date->format(self::TENDER_DATE_FORMAT);

            if ($stored === (string) $tender->getData('tender_return')) {
                return;
            }

            ProjectApi::patch(
                sprintf('project/%s/tender/%s', $project->getId(), $tender->getId()),
                ['tender_return' => $stored]
            );
        } catch (\Exception $e) {
            error_log("Enquiry: could not sync the tender return date for addendum {$this->did}: " . $e->getMessage());
        }
    }

    /**
     * @param Subcontractor $subcontractor
     * @param AccountModel $contractor
     * @param UserModel $contractorUser
     * @param bool $isInactiveExternalSubcontractor
     * @param string $enquiryType
     * @return array
     * @throws \App\Api\Exception
     */
    public function getEmailSendData(Subcontractor $subcontractor, AccountModel $contractor, UserModel $contractorUser, bool $isInactiveExternalSubcontractor, string $enquiryType) : array {

        $data = [
            //change this in postmark
            'subcontractor_full_name'   => $subcontractor->fullName(),
            'subcontractor_company_name' => $subcontractor->getData("name"),
            'project_name'               => $this->getDocCreator()->getModel("project")->getData("name"),
            'package_name'               => $this->getDocCreator()->getModel("tender")->getData("label"),
            'main_contractor_company_name'       => $contractor->getData("name"),
            'main_contractor_contact_full_name'  => $contractorUser->fullName(),
            'main_contractor_contact_phone'      => $contractorUser->getData("contact_number"),
            'main_contractor_contact_email'      => $contractorUser->getData("email"),
            'enquiry_type' => $enquiryType
        ];

        $prefix = "/account/auto_loader/";
        $user_id = $subcontractor->getData("user_id") ?? $subcontractor->getData("user")['id'];
        if($isInactiveExternalSubcontractor) {
            //If the sub is external and inactive we want to send them to the sign up portal, not auto log in
            $data['firstname'] = $subcontractor->getData("name");
            $json = $subcontractor->createTokenByLabel($user_id, 'supply_chain', [
                'contractor_aid' => $contractor->getId()
            ])->json()["data"] ?? [];
            $prefix = "/supply-chain-portal/token/";
        }else {
            $json = $subcontractor->createAutoLoaderToken($user_id);
        }
        $data["token_url"] = Config::get("url.app_prosper") . $prefix . $json["token"];
        return $data;
    }
}
