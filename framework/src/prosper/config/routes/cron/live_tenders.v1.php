<?php

use Core\Middleware\Generic;
use Core\Config;
use Core\Data\Shape;
use Core\Middleware\Service\AccountMiddleware;
use Core\Middleware\Exception as MiddlewareException;
use Core\Middleware\Collection;

use Core\Service\Manager;
use Prosper\Middleware\CronMiddleware;
use Prosper\Middleware\EmailMiddleware;
use Prosper\Middleware\Relay\ProjectMiddleware;
use Prosper\Middleware\SqsMiddleware;
use Prosper\Model\TeamManager;

$unsubscribe_email_id = 1;
$emailQueue = Config::get("services.aws.sqs.queues.email");
return [
    "rules" => [],
    "middleware" => [],
    "type" => "cli",
    "onError" => [
        "queueError" => function(MiddlewareException $ex) {
            error_log($ex->getMessage());
        }
    ],
    "actions" => [
        [
            "key" => "opportunities_queue_add",
            "middleware" => [
                CronMiddleware::loadSubcontractorEmailBlacklist(),
                CronMiddleware::loadLiveTenders(),
                CronMiddleware::filterByActiveContractors(),
                CronMiddleware::loadSubcontractorsOfferings(),
                CronMiddleware::matchSubcontractors(),
                SqsMiddleware::writeAll("matches", $emailQueue),
            ]
        ],
        [
            "key" => "opportunities_queue_read",
            "middleware" => [
                AccountMiddleware::loadTypes(),
                AccountMiddleware::loadSubscriptions(intval(Config::get("website_id.prosper"))),
                SqsMiddleware::fetch($emailQueue),
                AccountMiddleware::loadTokenTypes("auto_loader"),
                ProjectMiddleware::loadConstants(),
                Collection::storeFieldValues(
                    function($a){ return $a->jsonDecode("Body")->get("sid"); }, "account_ids", "results.messages"
                ),
                AccountMiddleware::loadAccountsByIdArray("account_ids"),
                /**
                 * As we want to loop all the results from sns we create on function that will call all
                 * the middleware for each message
                 */
                function($a) use($emailQueue, $unsubscribe_email_id) {
                    $types = $a->get("constants")->getItems()['project']->get("type");
                    $sizes = $a->get("constants")->getItems()['tender']->get("size");
                    $specialist_id = $a->getCollection("account_types")->filterByField("label", "specialist")->getFirst()->get("id");
                    foreach($a->getCollection("results.messages") as $row) {
                        try{
                            $item = $row->jsonDecode("Body");
                            $aid = $item->get("sid");
                            /**
                             * ToDo: Really we should load all the accounts in one go rather than one at a time, but the bulk load
                             * action in the account service does not include membership in the response
                             */
                            AccountMiddleware::fetch("account/" . $aid, "account")($item);

                            //filter by specialist account (not external)
                            if((int)$specialist_id === (int)$item->get("account.data.type_id", '')){
                                //Use the first user from the account, perhaps better to filter this by user type?
                                $item->set("user", $item->getCollection("account.data.users")->first());

                                $meta = json_decode($item->get("account.data.membership.meta", ''));
                                $item->set("tokens", $meta->tokens ?? 0);

                                //Create an autologin token and unsubscribe link for the email
                                AccountMiddleware::createUserToken(
                                    "user.id", "token_type", Config::getUrl("site_url", "account/auto_loader")
                                )($item->set("token_type", $a->get("token_type")));

                                $item->set("unsubscribe_url",
                                    Config::getUrl("site_url", "account/email/". base64_encode(strval($item->get("user.email"))) ."/unsubscribe/$unsubscribe_email_id")
                                );
                                //Get cc email list
                                $item->set("cc_emails", TeamManager::getTeamMemberEmails("sid", [$item->get("user.email")])($item));

                                $tender = $item->get("tender", '');
                                $tender_data = json_decode($tender, true);
                                $project_type_id = $tender_data['project']['type'];
                                $project_type = $types[$project_type_id] ?? null;
                                $size_id = $tender_data['tender']['size'];
                                $tender_date = DateTime::createFromFormat('d-m-Y', $tender_data['tender']['return_date']);
                                EmailMiddleware::send("Live Project Opportunities",[
                                    "sender" => $item->get("user"),
                                    "extra"  => new Shape([
                                        "project_id"    => $tender_data['project']['id'],
                                        "project_image" => Config::getUrl("postmark.image.type", $project_type.".png"),
                                        "project_name"  => $tender_data['project']['name'],
                                        "project_type"  => $project_type,
                                        "project_gia"   => $tender_data['project']['gia'],
                                        "tender_name"   => $tender_data['tender']['label'],
                                        "return_date"   => $tender_date->format('jS F Y'),
                                        "value"         => $sizes[$size_id] ?? 0
                                    ]),
                                    "token" => new Shape(["url" => $item->get("token_url")])
                                ])($a);
                            }
                        }catch (\Exception $e){
                            Manager::getService('sns')->sendException('failed_opportunities_cron_send', 'Opportunities cron sent fail', new Shape(array_merge($row->get(),['message' => $e->getMessage()])));
                        }

                        try{
                            SqsMiddleware::delete($emailQueue, "deleteParams")(
                                new Shape(["deleteParams" => ["ReceiptHandle" => $row->get("ReceiptHandle")]])
                            );
                        }catch (\Exception $e){
                            Manager::getService('sns')->sendException('failed_opportunities_cron_send', 'Opportunities cron delete handle error', new Shape(array_merge($row->get(),['message' => $e->getMessage()])));
                        }
                    }
                }
            ],
            "onError" => [
                "autoLoader" => Generic::redirect(Config::getUrl("site_url", "login")),
                "token"
            ]
        ],
    ]
];
