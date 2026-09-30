<?php

namespace Prequalification\Middleware;

use Core\Config;
use Core\Data\Shape;
use Core\Middleware\Service\AccountMiddleware;
use Core\Middleware\Service\UserMiddleware;
use Core\Service\Manager;
use Prosper\Middleware\EmailMiddleware as ProsperEmailMiddleware;
use Prosper\Model\TeamManager;

class EmailMiddleware
{

    public const UNSUBSCRIBE_EMAIL_ID = 1;

    /**
     * @return \Closure
     */
    public static function sendDocumentRequestFulfilled(): \Closure
    {
        return function ($a){
            AccountMiddleware::loadTokenTypes("auto_loader")($a);
            AccountMiddleware::loadById("uriArgs.aid", "subcontractor_account")($a);
            $account = $a->get("subcontractor_account");
            $user = new Shape($account->get("users")[0]);
            $data = [
                "account_data"    => $account,
                "user_id"         => $user->get("id"),
                "user_data"       => $user->get(),
                "document_name"   => $a->getRoute()->getRequest()->getData()->get("form.label"),
            ];
            foreach($a->get("accounts") as $contractor){
                $a->setItems([
                    'data' => $data + ['contractor_name' => $contractor['name']],
                    'contractor_aid'   => $contractor['users'][0]['id'],
                    'contractor_email' => $contractor['users'][0]['email']
                ]);
                //Create an autologin token and unsubscribe link for the email
                AccountMiddleware::createUserToken(
                    "contractor_aid", "token_type", Config::getUrl("site_url", "account/auto_loader")
                )($a->set("token_type", $a->get("token_type")));
                $a->set("unsubscribe_url",
                    Config::getUrl("site_url", "account/email/" . base64_encode(strval($a->get("data.account_data.email"))) . "/unsubscribe/" . self::UNSUBSCRIBE_EMAIL_ID)
                );
                $a->set("token_url", sprintf("%s/auto_loader/?token=%s&redirect=supply_chain/%s",
                    Config::get("clink.site_url"), $a->get("token"), $account->get("id")
                ));

                //Send the Email
                ProsperEmailMiddleware::send("Document Request Fullfilled",[
                    "sender"     => $user,
                    'recipient'  => new Shape(['id' => $a->get("contractor_aid")]),
                    'token'      => new Shape(['url' => $a->get("token_url")]),
                    'extra'      => new Shape([
                        'company_name'  => $account->get("name"),
                        'document_name' => $a->getRoute()->getRequest()->getData()->get("form.label")
                    ]),
                ])($a);
            }
        };
    }

    /**
     * @param string $dataKey
     * @return \Closure
     */
    public static function sendDocumentRequestReminder(string $dataKey = 'data'): \Closure
    {
        return function ($a) use ($dataKey){

            //auto loader token
            AccountMiddleware::loadTokenTypes("auto_loader")($a);

            //Create an autologin token
            AccountMiddleware::createUserToken(
                "$dataKey.user.id", "token_type", Config::getUrl("site_url", "account/auto_loader")
            )($a->set("token_type", $a->get("token_type")));
            $a->set($dataKey, [
                'token_url' => $a->get("token_url")
            ], true);

            //Create unsubscribe url
            $a->set($dataKey, [
                'unsubscribe_url' => Config::getUrl("site_url", "account/email/" . base64_encode(strval($a->get("$dataKey.user.email"))) . "/unsubscribe/" . self::UNSUBSCRIBE_EMAIL_ID)
            ], true);

            //Get cc email list
            $a->set("cc_emails", TeamManager::getTeamMemberEmails("$dataKey.user.id", [$a->get("$dataKey.user.email")])($a));

            //Send the Email
            ProsperEmailMiddleware::send("Document Request Reminder",[
                "sender"     => $a->get("$dataKey.user"),
                'token'      => new Shape(['url' => $a->get("$dataKey.token_url")]),
                'extra'      => new Shape([
                    'company_name'  => $a->get("$dataKey.contractor.name"),
                    'document_name' => $a->get("$dataKey.document.label")
                ]),
            ])($a);
        };
    }

    /**
     * @return \Closure
     */
    public static function notifyPqqCompleted(): \Closure
    {
        return function ($action) {
            //Send the Email to subcontractor
            ProsperEmailMiddleware::send("PQQ Completion Request",[
                'sender'  => new Shape(['id' => $action->get('session')->get('user')['id']]),
                'extra'      => new Shape([
                    'subcontractor_name' => $action->get('session')->get('user')['display_name'],
                    'main_contractor_name' => $action->get('contractor_name'),
                ]),
            ])($action);
        };
    }

    /**
     * @return \Closure
     */
    public static function notifyMainContractorPqqCompleted(): \Closure
    {
        return function ($action) {
            //Send the Email to main contractor user
            $contractorUser = $action->get('contractor_user');
            ProsperEmailMiddleware::send("Main Contractor PQQ Completion Request",[
                'sender'  => new Shape(['id' => $contractorUser->get('id')]),
                'extra'      => new Shape([
                    'subcontractor_name' => $action->get('session')->get('user')['display_name'],
                    'contractor_name' => $contractorUser->get('display_name'),
                    'company_name' => $action->get('session')->get('account')['name'],
                    'dashboard_link' => sprintf("%s/main-contractor/", Config::get("clink.site_url")),
                ]),
            ])($action);
        };
    }
}
