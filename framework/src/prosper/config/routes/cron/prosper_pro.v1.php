<?php

use Core\Data\Shape;
use Core\Middleware\Collection as CollectionMiddleware;
use Core\Middleware\Conditional;
use Core\Config;
use Core\Middleware\Hubspot;
use Core\Middleware\Service\AccountMiddleware;
use Prosper\Middleware\CronMiddleware;
use Prosper\Middleware\EmailMiddleware;
use Prosper\Middleware\Relay\TokenHistoryMiddleware;
use Prosper\Model\TeamManager;

$unsubscribe_email_id = 1;
$cron_active = Config::get("cron.prosper_pro", []);

return [
    "rules" => [],
    "middleware" => [],
    "type" => "cli",
    "onError" => [],
    "actions" => [
        [
            "key" => "free_token_reminder",
            "middleware" => [
                Conditional::isTrue($cron_active['free_token_reminder'], [

                    //Load subcontractors opportunities
                    CronMiddleware::loadLiveTenders(0),
                    CronMiddleware::loadSubcontractorsOfferings(),
                    CronMiddleware::matchSubcontractors(),

                    //Load subscriptions and token and tracking
                    AccountMiddleware::loadSubscriptions(intval(Config::get("website_id.prosper"))),
                    AccountMiddleware::loadTokenTypes("auto_loader"),
                    AccountMiddleware::load("account/tracking/type", "", "account_action_type"),

                    //Load all prosper pro upgrades
                    function($a){
                        $action_type = $a->get("account_action_type")->filterByStringField("label", "supply_chain.prosper_pro.manual")->getFIrst();
                        AccountMiddleware::load("account/tracking?action_type=" . $action_type->get("id"), "", "accounts")($a);
                    },

                    //Load all token history
                    TokenHistoryMiddleware::getTokenUsedHistoryCount(true),

                    //Filter accounts by the following criteria
                    //Have their prosper pro upgrade date equal or greater than X day(s)
                    //They haven't used any types of tokens
                    function($a) use ($cron_active){
                        $token_history = $a->get("token_used");
                        CollectionMiddleware::reduce(function ($account) use ($token_history, $cron_active){
                            $account_history = $token_history->filterByStringField("account_id", $account->get("account_id"));
                            $action_date = new DateTime(date("Y-m-d", strtotime($account->get("action_date"))));
                            $days = (new DateTime(date("Y-m-d")))->diff($action_date)->format('%a');
                            if (
                                !$account_history->filterByStringField("token_type",TokenHistoryMiddleware::TOKEN_HISTORY_PAID_TYPE)->count()
                                &&
                                !$account_history->filterByStringField("token_type",TokenHistoryMiddleware::TOKEN_HISTORY_FREE_TYPE)->count()
                            ) {
                                return ($days == $cron_active['free_token_reminder_days']);
                            }
                            return false;
                        }, 'accounts')($a);
                    },

                    //Get all accounts ids from the previous collection
                    CollectionMiddleware::storeFieldValues(
                        function($a){ return $a->get("account_id"); }, "account_ids", "accounts"
                    ),

                    //Get all accounts that have matched the criteria above but also have at least 1 opportunity
                    function($a){
                        $a->set("account_ids", array_intersect($a->get("sids", []), $a->get("account_ids")));
                    },
                    //Load all accounts data based on accounts ids
                    AccountMiddleware::loadAccountsByIdArray("account_ids"),

                    function($a) use ($unsubscribe_email_id){

                        $a->getCollection("accounts")->map(function($account) use ($unsubscribe_email_id, $a){

                            //Use the first user from the account, perhaps better to filter this by user type?
                            $opportunities = $a->get("matches", [])[$account->get("id")];
                            $account->setItems([
                                'user'          => $account->getCollection("users")->first(),
                                'opportunities' => $opportunities['opportunities']
                            ]);

                            //Create an autologin token and unsubscribe link for the email
                            AccountMiddleware::createUserToken(
                                "user.id", "token_type", Config::getUrl("site_url", "account/auto_loader")
                            )($account->set("token_type", $a->get("token_type")));
                            $account->set("unsubscribe_url",
                                Config::getUrl("site_url", "account/email/". base64_encode(strval($account->get("user.email"))) ."/unsubscribe/$unsubscribe_email_id")
                            );

                            //Get cc email list
                            $account->set("cc_emails", TeamManager::getTeamMemberEmails("sid", [$account->get("user.email")])($account));

                            //Send the Email
                            EmailMiddleware::send("Opportunities Reminder",[
                                "sender" => $account->get("user"),
                                "extra"  => new Shape([
                                    "opportunities_number" => $account->get("opportunities")
                                ]),
                                "token" => new Shape(["url" => $account->get("token_url")])
                            ])($account);

                            return $account;
                        });
                    }
                ])
            ]
        ],

    ]
];
