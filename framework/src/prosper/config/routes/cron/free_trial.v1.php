<?php

use Core\Data\Shape;
use Core\Middleware\Conditional;
use Core\Config;
use Core\Middleware\Hubspot;
use Core\Middleware\Service\AccountMiddleware;
use Core\Service\Manager;
use Prosper\Middleware\CronMiddleware;
use Prosper\Middleware\EmailMiddleware;
use Prosper\Middleware\Relay\TenderMiddleware;
use Prosper\Model\TeamManager;

$unsubscribe_email_id = 1;
$hubspotEnabled = Config::get("services.hubspot.prosper.enabled");
$cron_active = Config::get("cron.free_trial", []);

return [
    "rules" => [],
    "middleware" => [],
    "type" => "cli",
    "onError" => [],
    "actions" => [
        [
            "key" => "free_tokens_notifications",
            "middleware" => [
                Conditional::isTrue($cron_active['free_tokens_notifications'], [
                    AccountMiddleware::loadSubscriptions(intval(Config::get("website_id.prosper"))),
                    AccountMiddleware::loadTokenTypes("auto_loader"),
                    CronMiddleware::loadSubcontractorEmailBlacklist(),
                    CronMiddleware::loadLiveTenders(0),
                    CronMiddleware::loadSubcontractorsOfferings(),
                    CronMiddleware::matchSubcontractors(),
                    AccountMiddleware::loadAccountsByIdArray("sids"),
                    Conditional::isTrue($hubspotEnabled, [
                        function($a) use ($unsubscribe_email_id){
                            $free_trial_ids = $a->get("account_subscriptions")->filterByField("uid", "free_trial_prosper")->values("id");
                            $matches = $a->get("matches");
                            foreach($a->getCollection("accounts") as $account) {
                                $subscription = intval($account->get("membership")['subscription_id'] ?? 0);
                                if($subscription && in_array($subscription, $free_trial_ids)){
                                    $opportunities = $matches[$account->get("id")]['opportunities'] ?? 0;
                                    if($opportunities){
                                        //Set user opportunities number
                                        $account->set("opportunities", $opportunities);
                                        //Use the first user from the account, perhaps better to filter this by user type?
                                        $account->set("user", $account->getCollection("users")->first());
                                        //Create an autologin token and unsubscribe link for the email
                                        AccountMiddleware::createUserToken(
                                            "user.id", "token_type", Config::getUrl("site_url", "account/auto_loader")
                                        )($account->set("token_type", $a->get("token_type")));
                                        $account->set("unsubscribe_url",
                                            Config::getUrl("site_url", "account/email/". base64_encode(strval($account->get("user.email"))) ."/unsubscribe/$unsubscribe_email_id")
                                        );
                                        //Send the Email via hubspot
                                        //Get cc email list
                                        $account->set("cc_emails", TeamManager::getTeamMemberEmails("sid", [$account->get("user.email")])($account));
                                        EmailMiddleware::send("Opportunities Reminder",[
                                            "sender" => $account->get("user"),
                                            "extra"  => new Shape([
                                                "opportunities_number" => $account->get("opportunities")
                                            ]),
                                            "token" => new Shape(["url" => $account->get("token_url")])
                                        ])($account);
                                    }
                                }
                            }
                        }
                    ])
                ])
            ]
        ],
        [
            "key" => "free_tokens_top_up",
            "middleware" => [
                Conditional::isTrue($cron_active['free_tokens_top_up']['enabled'], [
                    AccountMiddleware::loadSubscriptions(intval(Config::get("website_id.prosper"))),
                    AccountMiddleware::loadTokenTypes("auto_loader"),
                    AccountMiddleware::loadAccountsByType("specialist"),
                    function($a){
                        $labels = $a->get("account_subscriptions")->filterByExistInArray("uid", ["flexi", "free_trial_prosper"], false);
                        $a->setItems([
                            "sids"                  => $a->get("accounts")->values("id"),
                            'subscriptions_allowed' => $labels->values("id")
                        ]);
                    },
                    AccountMiddleware::loadAccountsByIdArray("sids"),
                    function($a) use ($cron_active, $unsubscribe_email_id){
                        $tokens_rol_up = (int)($cron_active['free_tokens_top_up']['amount'] ?? 0);
                        $a->getCollection("accounts")->map(function($account) use ($tokens_rol_up, $a, $unsubscribe_email_id){
                            if(
                                 in_array((int)$account->get("membership.subscription_id"), $a->get("subscriptions_allowed"), false)
                            ){
                                if ( $meta = $account->get("membership.meta", '') ) {
                                    $meta = json_decode($meta, true);
                                    $tokens = $meta['tokens'] ?? 0;

                                    //Check if we disable the tokens top up for specific accounts
                                    $token_top_up_disabled = (isset($meta['tokens_top_up_disabled']) && $meta['tokens_top_up_disabled'] === "true");

                                    if ( (!isset($meta['tokens']) || $tokens < $tokens_rol_up) && !$token_top_up_disabled ) {

                                        ///Use the first user from the account, perhaps better to filter this by user type?
                                        $account->set("user", $account->getCollection("users")->first());

                                        //Create an autologin token and unsubscribe link for the email
                                        AccountMiddleware::createUserToken(
                                            "user.id", "token_type", Config::getUrl("site_url", "account/auto_loader")
                                        )($account->set("token_type", $a->get("token_type")));
                                        $account->set("unsubscribe_url",
                                            Config::getUrl("site_url", "account/email/". base64_encode(strval($account->get("user.email"))) ."/unsubscribe/$unsubscribe_email_id")
                                        );

                                        //Send the Email via hubspot
                                        //Get cc email list
                                        $account->set("cc_emails", TeamManager::getTeamMemberEmails("sid", [$account->get("user.email")])($account));
                                        $account->set("tokens", $tokens_rol_up - $tokens);
                                    }
                                }
                            }
                        });
                    },
                ])
            ]
        ],
        [
            "key" => "free_tokens_top_up_second_email",
            "middleware" => [
                Conditional::isTrue($cron_active['free_tokens_top_up']['enabled'], [
                    AccountMiddleware::loadSubscriptions(intval(Config::get("website_id.prosper"))),
                    AccountMiddleware::loadTokenTypes("auto_loader"),
                    AccountMiddleware::loadAccountsByType("specialist"),
                    function($a){
                        $labels = $a->get("account_subscriptions")->filterByExistInArray("uid", ["flexi", "free_trial_prosper"], false);
                        $a->setItems([
                            "sids"                  => $a->get("accounts")->values("id"),
                            'subscriptions_allowed' => $labels->values("id")
                        ]);
                    },
                    AccountMiddleware::loadAccountsByIdArray("sids"),
                    function($a) use ($unsubscribe_email_id){
                        $a->getCollection("accounts")->map(function($account) use ($a, $unsubscribe_email_id){
                            if(
                                in_array((int)$account->get("membership.subscription_id"), $a->get("subscriptions_allowed"), false)
                            ){

                                $earlier = new \DateTime($account->get("created_at"));
                                $later = new \DateTime(date("Y-m-d"));

                                $days = $later->diff($earlier)->format("%a");

                                //Check if the account was created 6 days before Friday
                                //as we sent the first email on Monday, and only accounts created before that will be receiving the Monday email
                                if ( $days > 5 && $meta = $account->get("membership.meta", '') ) {
                                    $meta = json_decode($meta, true);
                                    $tokens = $meta['tokens'] ?? 0;

                                    //Check if we disable the tokens top up for specific accounts
                                    $token_top_up_disabled = (isset($meta['tokens_top_up_disabled']) && $meta['tokens_top_up_disabled'] === "true");

                                    if ( $tokens && !$token_top_up_disabled ) {

                                        ///Use the first user from the account, perhaps better to filter this by user type?
                                        $account->set("user", $account->getCollection("users")->first());

                                        //Create an autologin token and unsubscribe link for the email
                                        AccountMiddleware::createUserToken(
                                            "user.id", "token_type", Config::getUrl("site_url", "account/auto_loader")
                                        )($account->set("token_type", $a->get("token_type")));
                                        $account->set("unsubscribe_url",
                                            Config::getUrl("site_url", "account/email/". base64_encode(strval($account->get("user.email"))) ."/unsubscribe/$unsubscribe_email_id")
                                        );

                                        //Send the Email via hubspot
                                        //Get cc email list
                                    }
                                }
                            }
                        });
                    },
                ])
            ]
        ],

    ]
];
