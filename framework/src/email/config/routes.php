<?php

use Core\Config;
use Core\Data\Shape;
use Core\Middleware\Generic;
use Core\Service\Manager;
use Core\Middleware\Service\AccountMiddleware;
use Email\Middleware\UserSettingsMiddleware;
use Email\Utility\Email as EmailUtility;
use Email\Factory as EmailFactory;
use Email\Middleware\EmailMiddleware;
use Email\Template\Template;

$templatesWithoutBounceEvent = ["Document Expired"];

return [
    "email" => [
        "type" => "http",
        "middleware" => [],
        "onError" => [
            "bad_request" => Generic::badRequest(),
            "relayError" => function ($e, $a) {
                $a->set("json", $e->getMessage());
            },
        ],
        "actions" => [
            [
                "key" => "send$",
                "method" => "POST",
                "middleware" => [
                    EmailMiddleware::loadEmailTypes(),
                    function ($a) {
                        $json      = $a->getRoute()->getRequest()->getData()->getShape("json");
                        $sender    = new Shape($json->get("sender", []));
                        $recipient = new Shape($json->get("recipient", $json->get("sender", [])));

                        try {
                            $senderData = Manager::getService('account')->fetch(sprintf("user/%s/profile", $sender->get("id")))->getShape('data');
                        } catch (\Throwable $e) {
                            $senderData = new Shape();
                        }

                        try {
                            $recipientData = Manager::getService('account')->fetch(sprintf("user/%s/profile", $recipient->get("id")))->getShape('data');
                        } catch (\Throwable $e) {
                            $recipientData = new Shape();
                        }

                        $data = [
                            'sender'    => $senderData,
                            'recipient' => $recipientData,
                            'to'    => $json->get("to"),
                            'from'  => $json->get("from"),
                            'bcc'   => $json->get("bcc"),
                            'cc'    => $json->get("cc"),
                        ];

                        foreach (explode(",", Config::get("email.shortcodes.list", "")) as $value) {
                            if ($result = $json->get($value)) {
                                $data[$value] = $result;
                            }
                        }

                        $data["metadata"] = $data["metadata"] ?? [];
                        $data["metadata"]["sender_email"] ??= $senderData->get("email", $json->get("from"));
                        $data["metadata"]["recipient_email"] ??= $recipientData->get("email", $json->get("to"));
                        $data["metadata"]["template"] = $json->get("template", "");

                        $a->setItems([
                            'sender_uid' => $senderData->get("id"),
                            'email' => [
                                'subject'  => $json->get("subject"),
                                'template' => $json->get("template"),
                                'cc'       => $json->get("cc"),
                                'bcc'      => $json->get("bcc"),
                                'data'     => new Shape($data)
                            ],
                            'user_id' => $json->int("user_id", 0)
                        ]);
                    },
                    UserSettingsMiddleware::loadSettings("sender.id"),
                    function ($a) {
                        if (!$a->get("email.data.from")) {
                            $from = Config::get("email.site.prosper.default");
                        } else {
                            $from = $a->get("email.data.from");
                        }
                        $email_data  = $a->get("email.data");
                        $from        = $a->get("settings.email.address", $from);
                        $password    = $a->get("settings.email.password", '');
                        $emailClient = EmailFactory::getClient(
                            $from,
                            $password,
                            EmailUtility::getClientFromEmailDomain($from)
                        );
                        $emailTemplate = EmailFactory::getTemplateLoader(Config::get("email.template.loader.default"));
                        $emailTemplate->setTemplate($a->get("email.template"));
                        $template = (new Template($emailTemplate))->getTemplateHtml($email_data);
                        $emailClient->setTemplateLoader($emailTemplate);
                        $emailClient->setEmailData($email_data);
                        $to = $a->get("email.data.to", $a->get("email.data.recipient.email"));
                        $emailClient->send($to, $a->get("email.subject", ""), $template, $a->get("email.data.cc", []), $a->get("email.data.bcc", []));

                        $types = $a->get("email_types");
                        $idType = $types->filterByField("uid", "sent")->getFirst()->get("id");
                        $recipient = $a->get("email.data.recipient");
                        $metaData = ["recipient_id" => $recipient->int("account_id")];
                        $json = $a->getRoute()->getRequest()->getData()->getShape("json");
                        $metaData = array_merge($metaData, $json->get("meta", []));
                        $meta = new Shape($metaData);
                        $data = [
                            "email_id" => $idType,
                            "user_id" => $a->int("user_id"),
                            "template" => $a->get("email.template"),
                            "meta" => $meta->jsonEncode()
                        ];
                        EmailMiddleware::logEmailEvent($data)($a);
                    },
                ]
            ],
            [
                "key" => "webhook$",
                "method" => "POST",
                "middleware" => [
                    EmailMiddleware::loadEmailTypes(),
                    AccountMiddleware::loadTypes(),
                    function ($a) use ($templatesWithoutBounceEvent) {
                        $types = $a->get("email_types");
                        $json = $a->getRoute()->getRequest()->getData()->getShape("json");
                        $type = $json->get("RecordType");
                        $metadata = $json->get("Metadata", []);
                        $template = $metadata["template"] ?? "";
                        switch ($type) {
                            case "Open":
                                $idType = $types->filterByField("uid", "open")->getFirst()->get("id");
                                $data = [
                                    "email_id" => $idType,
                                    "template" => $template
                                ];
                                $id = EmailMiddleware::logEmailEvent($data)($a);
                                break;
                            case "Bounce":
                                $senderEmail = $metadata["sender_email"] ?? "";
                                $recipientEmail = $metadata["recipient_email"] ?? "";
                                if ($senderEmail && ($senderEmail !== $recipientEmail) && !in_array($template, $templatesWithoutBounceEvent)) {
                                    EmailMiddleware::sendEmailDeliveryFailed($senderEmail, $recipientEmail, $json->get("Description"))($a);
                                }
                                $uid = $a->get("user.id");
                                $idType = $types->filterByField("uid", "bounce")->getFirst()->get("id");
                                $data = [
                                    "email_id" => $idType,
                                    "user_id" => $uid,
                                    "template" => $template,
                                    "meta" => $json->jsonEncode()
                                ];
                                $id = EmailMiddleware::logEmailEvent($data)($a);
                                break;
                            default:
                                $id = 0;
                                break;
                        }
                        $a->set("id", $id);
                    },
                    Generic::set("json",  function ($a) {
                        return json_encode(["success" => (bool)$a->get("id")]);
                    })
                ]
            ],
        ]
    ]
];
