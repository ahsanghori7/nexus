<?php

use Api\Middleware\MilestoneMiddleware;
use Core\Config;
use Core\Data\Shape;
use Core\Middleware\Conditional;
use Core\Middleware\Service\AccountMiddleware;
use Core\Service\Manager;
use Prosper\Middleware\EmailMiddleware;
use Prosper\Middleware\Relay;
use Prosper\Middleware\Relay\InterestsMiddleware;
use Prosper\Middleware\Relay\EnquiriesMiddleware;
use Prosper\Middleware\Relay\TenderMiddleware;
use Core\Middleware\Generic;
use Core\Middleware\Session;
use Prosper\Middleware\Relay\TokenHistoryMiddleware;
use Prosper\Middleware\RestMiddleware;
use Core\Middleware\Collection as CollectionMiddleware;
use Prosper\Middleware\Relay\ProjectMiddleware;
use Core\Data\Collection as CollectionClass;
use Core\Middleware\Service\UserMiddleware;
use Prosper\Model\Signatory;

return [
    "key" => "^relay$",
    "rules" => [Relay::isResource("enquiries")],
    "middleware" => [
        Session::validate()
    ],
    "type" => "http",
    "onError" => [
        "relayError" => function ($e, $a) {
            $a->set("json", $e->getMessage());
        },
        "onError" => [
            "noSession" => Generic::notAuthorised()
        ],
        "file_upload_error" => function ($e, $a) {
            Manager::getService('sns')->sendException('file_upload_error', $e->getMessage(), $a->get("file_upload_error_data"));
            Manager::getService('s3')->sendException('file_upload_error', 'document', $a->get("file_upload_error_data"));
            $a->set("json", $e->getMessage());
        },
        "add_transaction_error" => function ($e, $a) {
            Manager::getService('sns')->sendException('failed_quote_submitted', $e->getMessage(), $a->get("add_transaction_error_data"));
            $a->set("json", $e->getMessage());
        },
    ],
    "actions" => [
        [
            "key" => "enquiries$",
            "middleware" => [
                Generic::collectUrlArguments(["query" => []]),
                Relay::setJsonResponse()
            ]
        ],
        [
            "key" => "latest",
            "middleware" => [
                function ($a) {
                    $a->set("args", $a->getRoute()->getRequest()->getArgs());
                },
                ProjectMiddleware::loadConstants(),
                ProjectMiddleware::loadRegions(),
                TenderMiddleware::loadHistoryTypes(),
                EnquiriesMiddleware::loadCollection(sortBy: 'created_at'),
                EnquiriesMiddleware::loadCollectionTenderIds(),
                EnquiriesMiddleware::loadOrders(tenderIdsKey: 'tender_ids'),
                EnquiriesMiddleware::loadTransactionsByTenderIds(),
                EnquiriesMiddleware::processEnquiriesAndInterest("", "args.interests"),
                EnquiriesMiddleware::getCollectionDocuments(),
                EnquiriesMiddleware::limitLatestCollection(),
                EnquiriesMiddleware::loadSignatorySummaries(),
                EnquiriesMiddleware::getSignatoryData(),
                function ($action) {
                    $groups = [];
                    foreach ($action->getCollection("collection")->getItemsAsArray() as $item) {
                        if (!empty($item['group_id'])) {
                            $groups[$item['group_id']] = $item['group_id'];
                        }
                    }
                    $action->set("contractor_aids", $groups);
                    AccountMiddleware::loadAccountsByIdArray("contractor_aids")($action);
                    UserMiddleware::loadUsersByAccountIdArray("contractor_aids")($action);
                    $action->setItems([
                        'accounts' => new CollectionClass($action->get("accounts"), Shape::class),
                        'users'    => new CollectionClass($action->get("users"),    Shape::class),
                    ]);
                },
                EnquiriesMiddleware::loadContractors(),
                EnquiriesMiddleware::updateTenderLabel(['service', 'size', 'phase']),
                CollectionMiddleware::format(function ($data) {
                    $documents = $data->get("document", ['enquiry' => null, 'tender_addendum' => null, 'order' => null]);
                    return [
                        "id"                => $data->get("tid"),
                        "project_id"        => $data->get("project_id"),
                        "project"           => $data->get("name"),
                        "slug"              => $data->get("slug"),
                        "package"           => $data->get("label"),
                        "awarded"           => $data->get("awarded"),
                        "awarded_externally" => $data->get("awarded_externally"),
                        "service"           => $data->get("service"),
                        "group_id"          => $data->get("group_id"),
                        "author_id"         => $data->get("author_id"),
                        "contractor"        => $data->get("contractor.name"),
                        "contractor_id"     => $data->get("contractor.id"),
                        "users"             => $data->get("users"),
                        "document"          => $documents,
                        "order_created"     => $data->get("order_created"),
                        "order_price"       => $data->get("order_price"),
                        "created_at"        => $data->get("created_at"),
                        "updated_at"        => $data->get("updated_at"),
                        "status"            => $data->get("status"),
                        "status_id"         => $data->get("status_id"),
                        'signatory'         => $data->get("signatory"),
                        'size'              => $data->get("size"),
                        'phase'             => $data->get("phase"),
                        'send_date'         => $data->get("send_date"),
                        'tender_return'     => $data->get("tender_return"),
                        'start_on_site'     => $data->get("start_on_site"),
                        'decision_date'     => $data->get("decision_date"),
                        'project_start'     => $data->get("project_start"),
                        'project_completion' => $data->get("project_completion"),
                        'project_status'    => $data->get("project_status"),
                        'project_type'      => $data->get("project_type"),
                        'project_region'    => $data->get("project_region"),
                        'type'              => $data->get("type"),
                        'employer_liabilty_insurance' => $data->get("employer_liabilty_insurance"),
                    ];
                }),
                RestMiddleware::collectionToJson()
            ]
        ],
        [
            "key" => "enquiries\/(?<id>[0-9]{1,7})\/sign\/(?<template_id>[0-9]{1,7})$",
            "method" => "GET",
            "middleware" => [
                EnquiriesMiddleware::loadSubcontractor(),
                function($a){
                    $a->set("can_sign", Signatory::canSign($a->get("uriArgs.template_id"), $a->get("subcontractor.id"), Signatory::getSignatories("signed")->get("id")));
                },
                Generic::set("json",  function ($action) {
                    if($can_sign = $action->get("can_sign")){
                        $redirect = sprintf("%s/signatory/sign/%s?token=%s",  Config::get("clink.site_url"), (int)$action->get("uriArgs.id"), $action->getShape("session")->get("token"));
                    }
                    return json_encode(["success" => $can_sign, "redirect" => $redirect ?? null]);
                })
            ]
        ],
        [
            "key" => "enquiries\/(?<id>[0-9]{1,7})$",
            "method" => "PATCH",
            "middleware" => [
                EnquiriesMiddleware::loadSubcontractor(),
                RestMiddleware::hasJsonBody(),
                EnquiriesMiddleware::loadEnquiryTypes(),
                EnquiriesMiddleware::loadAllowedStatuses(),
                EnquiriesMiddleware::validateData(),
                EnquiriesMiddleware::loadEnquiry(),
                EnquiriesMiddleware::updateStatus(),
            ]
        ],
        [
            "key" => "enquiries\/(?<id>[0-9]{1,7})\/quotation$",
            "method" => "POST",
            "middleware" => [
                EnquiriesMiddleware::loadSubcontractor(),
                EnquiriesMiddleware::loadEnquiryTypes(),
                EnquiriesMiddleware::loadDocumentTypes(),
                EnquiriesMiddleware::loadEnquiry(),
                EnquiriesMiddleware::prepareQuoteData(),
                EnquiriesMiddleware::convertPriceToPenny(),
                EnquiriesMiddleware::addHistory("quote.pid", "quote.tid", function($a){
                    return $a->get("quote");
                }),
                EnquiriesMiddleware::addTransaction(),
                EnquiriesMiddleware::uploadQuoteFile(),
                EnquiriesMiddleware::getEnquiryContractorData(),
                EnquiriesMiddleware::addAdminNotification(),
                function ($a) {
                    $items = $a->get("enquiry")->getItems();
                    $tender = $items[$a->get("quote.tid")] ?? [];
                    $project = $items['project'];

                    AccountMiddleware::loadTokenTypes("auto_loader")($a);

                    //Create an autologin token link for the email
                    AccountMiddleware::createUserToken(
                        "contractor_enquiry_user.id", "token_type", Config::getUrl("site_url", "account/auto_loader")
                    )($a);

                    $a->set("token_url", sprintf("%s/auto_loader/?token=%s&redirect=project/%s/quotes_tender",
                        Config::get("clink.site_url"), $a->get("token"), $project->get('slug')
                    ));

                    $contractor_email_data = [
                        "sender"    => new Shape($a->get("subcontractor")),
                        "recipient" => $a->get("contractor_enquiry_user"),
                        'project'   => new Shape($project),
                        'tender'    => new Shape($tender),
                        'token'     => new Shape(['url' => $a->get("token_url")]),
                        'extra'     => new Shape([
                            'date' => date("Y/m/d H:i:s"),
                            'company_name' => $a->get("subcontractor.name"),
                        ])
                    ];

                    //send quotation to the contractor that sent the enquiry
                    EmailMiddleware::send("Quotation Received New", $contractor_email_data)($a);

                    //send quotation to subcontractor
                    EmailMiddleware::send("Quotation Submitted", [
                        "sender"    => new Shape($a->get("subcontractor")),
                        'project'   => new Shape($project),
                        'tender'    => new Shape($tender),
                        'token'     => new Shape(['url' => $a->get("activation_link")]),
                        'extra'     => new Shape(['date' => date("Y/m/d H:i:s")])
                    ])($a);

                    MilestoneMiddleware::milestoneComplete('quote.tid', 'Quote Due', 'session.user')($a);
                },
                Generic::set("json",  function ($action) {
                    return json_encode(["success" => true]);
                }),
            ]
        ],
        [
            "key" => "enquiries\/types$",
            "method" => "GET",
            "middleware" => [
                EnquiriesMiddleware::loadEnquiryTypes(),
                Generic::set("json",  function ($action) {
                    return json_encode(['data' => $action->get('types')->getItemsAsArray()]);
                }),
            ]
        ],
        [
            "key" => "enquiries\/(?<id>[0-9]{1,7})\/(?<tid>[0-9]{1,7})\/(?<sid>[0-9]{1,7})\/quote$",
            "method" => "GET",
            "middleware" => [
                EnquiriesMiddleware::downloadQuoteFile()
            ]
        ],
        [
            "key" => "subscribe_how_to_win$",
            "method" => "POST",
            "middleware" => [
                EnquiriesMiddleware::loadSubcontractor(),
                Generic::set("json", function ($a) {
                    return json_encode(["success" => true]);
                }),
            ]
        ],
        [
            "key" => "downloaded$",
            "method" => "POST",
            "middleware" => [
                EnquiriesMiddleware::loadSubcontractor(),
                AccountMiddleware::loadSubscriptions(intval(Config::get("website_id.prosper"))),
                function ($a) {
                    $a->set("commission_subscription", $a->get("account_subscriptions")->filterByField('uid', "commission")->first());
                    $isNotCommission = $a->get("commission_subscription.id") !== $a->get("subcontractor.subscription");
                    Conditional::isTrue($isNotCommission, [
                        TokenHistoryMiddleware::getTokenUsedHistoryCount(),
                    ])($a);
                },
                Generic::set("json", function ($a) {
                    return json_encode(["success" => true]);
                }),
            ]
        ],
    ]
];
