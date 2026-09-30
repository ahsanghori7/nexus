<?php

namespace Prosper\Middleware\Cron;

use Core\Config;
use Core\Data\Shape;
use Core\Middleware\Service\AccountMiddleware;
use Prosper\Middleware\EmailMiddleware;

class QuoteReminderMiddleware
{

    /**
     * @param string $emailTemplate
     * @param int $unsubscribe_email_id
     * @return callable
     */
    public static function sendReminder(string $emailTemplate, int $unsubscribe_email_id = 1): callable
    {
        return function($a) use ($emailTemplate, $unsubscribe_email_id){
            $reminders = $a->get("quote_reminders");
            foreach($a->getCollection("accounts") as $account) {
                $aid = $account->get("id");
                $quote_reminders = $reminders[$aid] ?? [];

                foreach($quote_reminders as $reminder){
                    //Use the first user from the account, perhaps better to filter this by user type?
                    $account->set("user", $account->getCollection("users")->first());
                    //Create an opt in token and unsubscribe link for the email
                    AccountMiddleware::createUserToken(
                        "user.id", "token_type", Config::getUrl("site_url", "account/auto_loader")
                    )($account->set("token_type", $a->get("token_type")));
                    $account->set("unsubscribe_url",
                        Config::getUrl("site_url", "account/email/". base64_encode(strval($account->get("user.email"))) ."/unsubscribe/$unsubscribe_email_id")
                    );
                    $account->set("token_tid", $reminder['tid']);

                    //Get main contractor details
                    $main_contractor = $a->getCollection("main_contractors_aids")->filterByStringField("id", $reminder['main_contractor_aid']);

                    if($main_contractor->count()) {
                        $main_contractor = $main_contractor->getFirst();
                        $main_contractor_user = [
                            'firstname' => $main_contractor->get("name"),
                            'lastname'  => ''
                        ];
                        if($main_contractor->get("users")){
                            array_map(function($user) use ($reminder, &$main_contractor_user){
                                if($user['id'] == $reminder['main_contractor_uid']){
                                    $main_contractor_user = $user;
                                }
                                return $user;
                            },$main_contractor->get("users"));
                        }

                        //Send the Email
                        EmailMiddleware::send($emailTemplate,[
                            "sender" => $account->get("user"),
                            "extra"  => new Shape([
                                "client_number" => $main_contractor_user['contact_number'],
                                "package"       => $reminder['tender_label'],
                                "company_name"  => $main_contractor->get("name"),
                                "client_email"  => $main_contractor_user['email'],
                                "project_name"  => $reminder['project_name'],
                                "client_name"   => $main_contractor_user['firstname']." ".$main_contractor_user['lastname'],
                                "token_tid"     => $account->get("token_tid"),
                            ]),
                            "token" => new Shape(["url" => $account->get("token_url")])
                        ])($account);
                    }
                }
            }
        };
    }

}
