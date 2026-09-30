<?php

use Core\Config;
use Core\Data\Shape;
use Core\Service\Manager;
use Core\Middleware\Generic;
use Core\Middleware\Exception as MiddlewareException;
use Prosper\Middleware\SqsMiddleware;
use Prosper\Middleware\EmailMiddleware;
use Core\Middleware\Service\AccountMiddleware;

$emailQueue = Config::get("services.aws.sqs.queues.approval_email");

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
            "key" => "send",
            "middleware" => [
                SqsMiddleware::fetch($emailQueue),
                function($a) use($emailQueue) {
                    foreach($a->getCollection("results.messages") as $row) {
                        $content = json_decode($row->get('Body'), true);
                        try {
                            if (!$content || !is_array($content)) {
                                throw new \Exception("Malformed message json");
                            }

                            $senderId = (int)($content['uid'] ?? 0);
                            $email_data = $content['email_data'] ?? [];

                            if ($senderId && !empty($email_data)) {
                                foreach($email_data as $data) {
                                    if (!isset($data["body"]) || !$data["body"]) {
                                        continue;
                                    }
                                    $user_id = $data['user_id'] ?? null;
                                    if ($user_id) {
                                        $a->set('user_id', $data['user_id']);
                                        $a->set('token', null);
                                        $tokenLabel = $content['type'] === 'order' ? 'review_token' : 'auto_loader';
                                        AccountMiddleware::loadTokenTypes($tokenLabel)($a);
                                        if (!$a->getShape('token_type')->has('id')) {
                                            throw new \Exception("$tokenLabel token type is not configured");
                                        }
                                        AccountMiddleware::createUserToken(
                                        "user_id", "token_type"
                                        )($a);
                                        if (!$a->get('token')) {
                                            throw new \Exception("Failed to create $tokenLabel token");
                                        }
                                    }

                                    $link = [];
                                    if ($content['type'] === 'order') {
                                        $link['orderLink'] = sprintf("%s/auto_loader/?review_token=%s&redirect=%s%s", Config::get('clink.site_url'), $a->get('token'), $data["body"]["url"], isset($data['body']['plain_redirect']) ? "&plain_redirect=true" : "");
                                    } else if ($content['type'] === 'shortlisted_subcontractor') {
                                        $link['requestLink'] = sprintf("%s/auto_loader/?token=%s&redirect=%s%s", Config::get('clink.site_url'), $a->get('token'), $data["body"]["url"], isset($data['body']['plain_redirect']) ? "&plain_redirect=true" : "");
                                    } else {
                                        $link['reportLink'] = sprintf("%s/auto_loader/?token=%s&redirect=%s%s", Config::get('clink.site_url'), $a->get('token'), $data["body"]["url"], isset($data['body']['plain_redirect']) ? "&plain_redirect=true" : "");
                                    }
                                    $extra = array_merge($data["body"], $link);

                                    EmailMiddleware::send( $data['template'], [
                                        "sender" => new Shape(["id" => $senderId]),
                                        "from"   => Config::get("email.site.clink.default"),
                                        "to"     => $data['email'] ?? null,
                                        "user_id" => $user_id ?? null,
                                        "extra"  => new Shape($extra)
                                    ])($a);
                                }

                            }
                        }
                        catch (\Exception $e) {
                            Manager::getService('sns')->sendException('failed_approval_requests_cron_send', 'Request Approval cron sent fail', new Shape(array_merge($row->get(),['message' => $e->getMessage()])));
                        }

                        try{
                            SqsMiddleware::delete($emailQueue, "deleteParams")(
                                new Shape(["deleteParams" => ["ReceiptHandle" => $row->get("ReceiptHandle")]])
                            );
                        }catch (\Exception $e){
                            Manager::getService('sns')->sendException('failed_approval_requests_cron_send', 'Request Approval cron delete handle error', new Shape(array_merge($row->get(),['message' => $e->getMessage()])));
                        }
                    }
                },
            ],
            "onError" => [
                "autoLoader" => Generic::redirect(Config::getUrl("site_url", "login")),
                "token"
            ]
        ]
    ]
];
