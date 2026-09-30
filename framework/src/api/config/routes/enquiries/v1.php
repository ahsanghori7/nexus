<?php

use Core\Config;
use Core\Data\Shape;
use Core\Middleware\Generic;
use Core\Middleware\Service\AccountMiddleware;
use Core\Service\Manager;
use Core\Data\Collection as CollectionClass;
use Prosper\Model\Document as DocumentModel;
use Api\Middleware\ApiSession;

$session_handler = Config::get("session.handler", ApiSession::class);
return [
    "type" => "http",
    "onError" => [
        "formValidation" => Generic::badRequest(),
        "invalidToken"   => $session_handler::invalidApiToken(),
        "tooManyRequests"  => Generic::tooManyRequests(),
        "noEntityFound"    => Generic::exceptionResponse("HTTP/1.0 404"),
        "projectOwnershipError" => Generic::exceptionResponse("HTTP/1.0 403"),
        "EndpointFetchFailure" => Generic::exceptionResponse("HTTP/1.0 500"),
    ],
    "middleware" => [
        function ($action) use ($session_handler) {
            //browser will send before a OPTIONS request, without the authorisation token, and then will send the real request
            if ($action->getRoute()->getRequest()->get("method") !== "OPTIONS") {
                $session_handler::validate()($action);
            }
        },
    ],
    "default_action" => [
        "middleware" => [
            function ($a) {
                //ToDo: Add some more context and info
                $a->set("message", "No Api Route Found");
            },
            Generic::set("json",  function ($a) {
                $a->set("headers", ["HTTP/1.0 404 No Api Route Found" => ""]);
                return json_encode(['message' => $a->get("message", ""), "code" => 404]);
            })
        ]
    ],
    "actions" => [
        //CORS HANDLER
        [
            "key" => ".+",
            "method" => "OPTIONS",
            "middleware" => [
                Generic::corsResponse()
            ]
        ],
        [
            "key" => "history\/document$",
            "method" => "GET",
            "middleware" => [
                AccountMiddleware::ifIsATypeOf(AccountMiddleware::SUBCONTRACTOR_TYPE, function ($a, $isType) {
                    $a->set("is_subcontractor", $isType);
                }, true),
                function ($a) {
                    // TODO: Create Middlewares to handle this code
                    $subcontractor = $a->get("is_subcontractor");
                    $aid = $subcontractor->int("id");
                    try {
                        $projects = Manager::getService('project')->fetch("tender", [
                            'specialist_id' => $aid,
                        ])->getCollection('data');
                    } catch (\Exception $e) {
                        $projects = new CollectionClass([], Shape::class);
                    }

                    $ids = [];
                    $transactions = [];
                    foreach ($projects->getItemsAsArray() as $item) {
                        $tenders = $item["tender"] ?? [];
                        foreach ($tenders as $tid => $tender) {
                            $ids[$tid] = $tid;
                        }
                    }
                    if ($ids) {
                        $ids = '[' . implode(",", $ids) . ']';
                        try {
                            $transactions = Manager::getService("project")->fetch("transaction/tender/$ids")->getCollection("data")->filter(function ($t) use ($aid) {
                                return intval($t->get("subcontractor_id")) === $aid;
                            });
                        } catch (\Exception $e) {
                            $transactions = new CollectionClass([], Shape::class);
                        }
                    }
                    $documents = ['enquiry' => [], 'tender_addendum' => [], 'order' => []];
                    // This updates each item twice, so we need to avoid repeated values manually
                    foreach ($projects as $item) {
                        $tenders = $item->get("tender") ?? [];
                        // Use just elements of $tenders  that has the keys Enquiry or Interest
                        $tendersWithEnquiriesAndInterests = array_filter($tenders, function ($tender) {
                            return array_key_exists('Enquiry', $tender)
                                || array_key_exists('Interest', $tender); // TODO: Check this documents to be added too
                        });
                        foreach ($tendersWithEnquiriesAndInterests as $tid => $tender) {
                            $enquiriesHistory = [];
                            if (
                                isset($tender["Enquiry"])
                                && isset($tender["Enquiry"][$aid])
                                && isset($tender["Enquiry"][$aid]["history"])
                            ) {
                                $enquiriesHistory = $tender["Enquiry"][$aid]["history"];
                            }
                            $version = 1;
                            $versionTenderAddendum = 1;
                            foreach ($enquiriesHistory as $history) {
                                $history = new Shape($history);
                                $meta = $history->get("meta", "");
                                if ($meta && $meta !== '""') { // TODO: Check why the db is saving text '""' instead of empty string
                                    $meta = json_decode($meta, true);
                                    $documentModel = new DocumentModel($meta['document'] ?? [], $aid);
                                    if ($url = $documentModel->getUrl()) {
                                        $type = $documentModel->getType();
                                        ($type === 'enquiry')
                                            ? ($documents[$type][] = [
                                                "id" => $documentModel->getID(),
                                                "tender_id" => $tid,
                                                'received_date' => $history->get("created_at"),
                                                'document_name' => 'Tender document',
                                                'version' => $version,
                                                'download_link' => $url,
                                            ])
                                            : ($documents[$type][] = [
                                                "id" => $documentModel->getID(),
                                                "tender_id" => $tid,
                                                'received_date' => $history->get("created_at"),
                                                'document_name' => 'Tender addendum',
                                                'version' => $versionTenderAddendum,
                                                'download_link' => $url,
                                            ]);
                                        if ($type === 'enquiry') {
                                            $version++;
                                        } else {
                                            $versionTenderAddendum++;
                                        }
                                    }
                                }
                            }
                        }
                    }
                    foreach ($projects as $item) {
                        $tenders = $item->get("tender") ?? [];
                        // Use just elements of $tenders that has the key Order
                        $tendersWithOrders = array_filter($tenders, function ($tender) {
                            return array_key_exists('Order', $tender);
                        });
                        $version = 1;
                        foreach ($tendersWithOrders as $tid => $tender) {
                            $transactionsFiltered = $transactions->filter(function ($i) use ($tid) {
                                return intval($i->get("tender_id")) === intval($tid);
                            });
                            $transaction = null;
                            if ($transactionsFiltered->count()) {
                                foreach ($transactionsFiltered as $transaction) {
                                    $meta = $transaction->get("meta");
                                    $doc = $meta ? json_decode($meta, true) : null;
                                    if ($doc) {
                                        $url = isset($doc["document"]) && isset($doc["document"]["url"]) ?
                                            $doc["document"]["url"] : "";
                                        $documents['order'][] = [
                                            "id" => $doc["document"]["id"],
                                            "tender_id" => $transaction->get("tender_id"),
                                            'received_date' => $transaction->get("order_created"),
                                            'document_name' => 'Order',
                                            'version' => $version,
                                            'download_link' => $url,
                                        ];
                                        $version++;
                                    }
                                }
                            }
                        }
                    }
                    $a->set("documents", $documents);
                },
                Generic::set("json",  function ($a) {
                    return json_encode(['data' => $a->get("documents")]);
                })
            ]
        ]
    ]
];
