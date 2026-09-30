<?php

use Core\Config;
use Core\Data\Shape;
use Api\Middleware\Transactions\QuoteMiddleware;
use Core\Middleware\Generic;
use Api\Middleware\Relay\BoqMiddleware;
use Core\Data\Collection;
use Core\Middleware\Service\AccountMiddleware;
use Core\Middleware\Procedure;
use Core\Middleware\Exception as MiddlewareException;
use Core\Middleware\Conditional;
use Api\Middleware\ProjectMiddleware;
use Prosper\Middleware\Relay\EnquiriesMiddleware;
use Api\Model\BoQ\Entity;
use Prosper\Middleware\EmailMiddleware;
use Api\Model\BoQ\Quote as QuoteModel;
use Api\Data\Boq\Resource as BoqResource;
use Api\Model\BoQ\Resource;
use Api\Model\BoQ\Item;

//Load in any preset Procedures to reuse
include_once("procedures.php");

return [
    [
        "key" => "^(?<eid>[0-9]+)\/quote$",
        "method" => "GET",
        "middleware" => [
            AccountMiddleware::ifIsATypeOf(AccountMiddleware::SUBCONTRACTOR_TYPE, function ($a, $isType) {
                $a->set("is_subcontractor", $isType);
            }, true),
            BoqMiddleware::fetchByEntityId("uriArgs.eid"),
            //Once the BOQ is loaded we need to check if it's a main contractor, and if so do they own the project
            Procedure::get("boqCheckProjectOwnerShip", ['key' => 'id', 'value' => 'boq.tender.project_id']),
            Procedure::get("fetchQuotes"),
            function ($a) {
                //Attach all the subcontractor data to each quote
                $quotes = $a->getCollection(QuoteMiddleware::QUOTE_COLLECTION_KEY);
                //We have old users ~4-5 years old that have their "user id" as -1 in the transaction table
                $sids = array_filter($quotes->values("subcontractor_id"), function ($id) {
                    return $id > 0;
                });
                $subcontractors = AccountMiddleware::loadAccountsByIdArray("sids")(
                    new Shape(["sids" => $sids])
                )->getCollection("accounts");
                $quotes->map(function ($q) use ($subcontractors) {
                    $sub = $subcontractors->filterByField("id", $q->get("subcontractor_id"), cast: "int")->first();
                    return $q->set("subcontractor", $sub);
                });

                //Filter quotes that dont have boq
                $quotes = $quotes->filter(
                    function ($q) {
                        return (bool)$q->get("quote");
                    }
                );

                $eid = $a->int("uriArgs.eid");
                try {
                    $resources = Resource::getResourcesByEntityId($eid);
                } catch (\Exception $e) {
                    $resources = [];
                }
                $typeProgrammeWeek = 2;
                $typeNoteExclusion = 3;

                //Group quotes by subcontractor id to always get the latest quote
                $quotes = $quotes->groupByKey("subcontractor_id");
                $differences = [];
                foreach ($quotes->getItems() as $item) {
                    $sid = $item->get("subcontractor_id");
                    $differences[$sid] = [];
                    $programmeWeeks = array_filter($resources, function ($resource) use ($typeProgrammeWeek, $sid) {
                        return $resource["boq_resource_type_id"] === $typeProgrammeWeek && intval($resource["resource_data"]["id_account"]) === intval($sid);
                    });
                    $programmeWeeks = end($programmeWeeks);
                    $id = $programmeWeeks["boq_resource_id"] ?? "";
                    $text = $programmeWeeks["resource_data"]["text"] ?? "";
                    $item->set("programme_weeks", ["id" => $id, "text" => $text]);

                    $noteExclusion = array_filter($resources, function ($resource) use ($typeNoteExclusion, $sid) {
                        return $resource["boq_resource_type_id"] === $typeNoteExclusion && intval($resource["resource_data"]["id_account"]) === intval($sid);
                    });
                    $noteExclusion = end($noteExclusion);
                    $id = $noteExclusion["boq_resource_id"] ?? "";
                    $text = $noteExclusion["resource_data"]["text"] ?? "";
                    $item->set("exclusion_note", ["id" => $id, "text" => $text]);

                    foreach ($item->get("quote") as $q) {
                        if (!isset($differences[$sid][$q["boq_item_id"]])) {
                            $differences[$sid][$q["boq_item_id"]] = $q;
                        }

                        $selectedQuote = $differences[$sid][$q["boq_item_id"]];
                        $differences[$sid][$q["boq_item_id"]]["has_differences"] = intval($selectedQuote["rate"]) !== intval($q["rate"]) && intval($selectedQuote["version"]) !== intval($q["version"]);
                    }
                    $itemsWithDifferences = array_filter($differences[$sid], function ($item) {
                        return $item["has_differences"];
                    });
                    $item->set("differences", array_keys($itemsWithDifferences));
                }
                $a->set(QuoteMiddleware::QUOTE_COLLECTION_KEY, $quotes);
            },
            //,
            QuoteMiddleware::filterQuoteItemsByLatestVersion(),
            QuoteMiddleware::calculateBestPrice(),
            Generic::set("json",  function ($a) {
                return json_encode([
                    'data' =>
                    $a->get(QuoteMiddleware::QUOTE_COLLECTION_KEY)
                ]);
            })
        ],
        "documentation" => [
            "description" => "Return Quote Items for a BOQ",
            "response" => [
                "data" => [
                    //ToDo: Import Response format data from config or other location, saved as Json to make quicker to update
                ]
            ]
        ]
    ],
    [
        "key" => "^(?<eid>[0-9]+)\/get_quotes$",
        "method" => "GET",
        "middleware" => [
            AccountMiddleware::ifIsATypeOf(AccountMiddleware::SUBCONTRACTOR_TYPE, function ($a, $isType) {
                $a->set("is_subcontractor", $isType);
            }, true),
            BoqMiddleware::fetchByEntityId("uriArgs.eid"),
            //Once the BOQ is loaded we need to check if it's a main contractor, and if so do they own the project
            Procedure::get("boqCheckProjectOwnerShip", ['key' => 'id', 'value' => 'boq.tender.project_id']),
            Procedure::get("fetchQuotes"),
            Generic::set("json",  function ($a) {
                return json_encode([
                    'data' =>
                        $a->get(QuoteMiddleware::QUOTE_COLLECTION_KEY)
                ]);
            })
        ],
    ],
    [
        "key" => "^(?<eid>[0-9]+)\/quote_history$",
        "method" => "GET",
        "middleware" => [
            AccountMiddleware::ifIsATypeOf(AccountMiddleware::SUBCONTRACTOR_TYPE, function ($a, $isType) {
                $a->set("is_subcontractor", $isType);
            }, true),
            BoqMiddleware::fetchByEntityId("uriArgs.eid"),
            //Once the BOQ is loaded we need to check if it's a main contractor, and if so do they own the project
            Procedure::get("boqCheckProjectOwnerShip", ['key' => 'id', 'value' => 'boq.tender.project_id']),
            Procedure::get("fetchQuotes"),
            function ($a) {
                $quotes = $a->getCollection(QuoteMiddleware::QUOTE_COLLECTION_KEY);
                $a->set(QuoteMiddleware::QUOTE_COLLECTION_KEY, $quotes->filter(
                    function ($q) {
                        return (bool)$q->get("quote");
                    }
                ));
            },
            QuoteMiddleware::groupQuoteItemsByPublishedVersion(),
            function ($a) {
                $eid = $a->int("uriArgs.eid");
                try {
                    $resources = Resource::getResourcesByEntityId($eid);
                } catch (\Exception $e) {
                    $resources = [];
                }
                $typeProgrammeWeek = 2;
                $statusesPublished = [3, 6];
                $programmeWeeks = array_filter($resources, function ($resource) use ($typeProgrammeWeek, $statusesPublished) {
                    return $resource["boq_resource_type_id"] === $typeProgrammeWeek &&
                        in_array($resource["resource_version"]["status"], $statusesPublished);
                });
                $a->set("programme_weeks", []);
                $results = [];
                if (!empty($programmeWeeks)) {
                    foreach ($programmeWeeks as $programmeWeek) {
                        $resourceData = Resource::getResourceById($programmeWeek['boq_resource_id']);
                        $aid = $resourceData["resource_data"]["id_account"];
                        $version = $resourceData["resource_version"]["version"];
                        $results[$aid][$version] = $resourceData["resource_data"];
                    }
                    $a->set("programme_weeks", $results);
                }
            },
            QuoteMiddleware::quoteHistoryCalculateSectionPrices(),
            Generic::set("json",  function ($a) {
                return json_encode([
                    'data' => $a->get("quotes_history")
                ]);
            })
        ]
    ],
    [
        "key" => "^(?<eid>[0-9]+)\/quote\/(?<sid>[0-9]+)\/document$",
        "method" => "POST",
        "middleware" => [
            BoqMiddleware::fetchByEntityId("uriArgs.eid"),
            Procedure::get("boqCheckProjectOwnerShip", ['key' => 'id', 'value' => 'boq.tender.project_id']),
            AccountMiddleware::ifIsATypeOf(AccountMiddleware::SUBCONTRACTOR_TYPE, function ($a, $isType) {
                $sid = $a->int("uriArgs.sid");
                //If a logged in subcontractor, check the sid provided to confirm is the same account
                if ($isType) {
                    $accountId = $a->getShape("account")->int("id");
                    if ($sid !== $accountId) {
                        throw new MiddlewareException(
                            "authError",
                            "You do not have permission to perform this action"
                        );
                    }
                    $sid = $accountId;
                }
                $a->set("is_subcontractor", $isType);
                $a->set("subcontractor_id", $sid);
            }),
            Procedure::get("fetchQuotes"),
            function ($a) {
                $collection = $a->getCollection(QuoteMiddleware::QUOTE_COLLECTION_KEY);
                $a->set("transaction_id", $collection->first()->get("id"));
            },
            QuoteMiddleware::getLatestVersion(),
            QuoteMiddleware::prepareDocuments(),
            QuoteMiddleware::uploadDocuments(),
            QuoteMiddleware::removeDocuments(),
        ]
    ],
    [
        "key" => "^(?<eid>[0-9]+)\/quote\/(?<sid>[0-9]+)$",
        "method" => "POST",
        "middleware" => [
            function ($a) {
                $data = $a->getRoute()->getRequest()->getData();
                $a->set("json", $data->get("form"));
                $a->set("note", $a->get("json.note", ""));
                $a->set("programme", $a->get("json.programme", ""));
            },
            Generic::set("quoteItems", function ($a) {
                $json = $a->get("json");
                if (empty($json->get("quoteItems", []))) {
                    return new Collection([], Shape::class);
                }
                $quoteItems = $json->getCollection("quoteItems");
                return $quoteItems;
            }),
            BoqMiddleware::fetchByEntityId("uriArgs.eid"),
            Procedure::get("boqCheckProjectOwnerShip", ['key' => 'id', 'value' => 'boq.tender.project_id']),
            AccountMiddleware::ifIsATypeOf(AccountMiddleware::SUBCONTRACTOR_TYPE, function ($a, $isType) {
                $sid = $a->int("uriArgs.sid");
                //If a logged in subcontractor, check the sid provided to confirm is the same account
                if ($isType) {
                    $accountId = $a->getShape("account")->int("id");
                    if ($sid !== $accountId) {
                        throw new MiddlewareException(
                            "authError",
                            "You do not have permission to perform this action"
                        );
                    }
                    $sid = $accountId;
                }
                $a->set("is_subcontractor", $isType);
                $a->set("subcontractor_id", $sid);
            }),
            Procedure::get("fetchQuotes"),
            //If there is no quote for subcontractor, create one.
            Conditional::collectionHasCount(QuoteMiddleware::QUOTE_COLLECTION_KEY, function ($a) {
                $payload = array_merge(
                    $a->getRoute()->getRequestData("json")->get("breakdownSummary", []),
                    $a->keys(["subcontractor_id"])->toArray(),
                    ["note" => $a->get("json.note")],
                    //TypeId 1 is Quote TODO: Make this configurable/dynamic
                    ["type_id" => 1]
                );
                $a->set("transaction_payload", $payload);
                QuoteMiddleware::createTransaction("transaction_payload", "boq.tender_id")($a);
            }),
            function ($a) {
                //Here we always update the first quote, this might need to be changed in future if we allow for
                //handling multiple quotes from different subcontractors
                $collection = $a->getCollection(QuoteMiddleware::QUOTE_COLLECTION_KEY);
                $a->set("transaction_id", $collection->first()->get("id"));
                // Clean quotation marks from keys
                $collection->map(function ($quote, $i) use ($a) {
                    if ($i === 0) {
                        $quote->updateItems($a->get("quoteItems"));
                    }
                    return $quote;
                });
            },
            BoqMiddleware::loadResourceTypes(),
            QuoteMiddleware::saveQuotesItems(),
            function ($a) {
                $resourceTypes = $a->get("resource_types");
                $programmeWeeksType = $resourceTypes->filterByField("label", "programme_weeks")->getFirst();
                $exclusionAllowancesNoteType = $resourceTypes->filterByField("label", "exclusion_allowances_note")->getFirst();
                $a->set("programme_weeks_type", $programmeWeeksType);
                $a->set("exclusion_allowances_note_type", $exclusionAllowancesNoteType);
                $a->set("note", $a->get("note.text", ""));
                $a->set("programme", $a->get("programme.text", ""));
            },
            //at this point the transaction was created before (or exists already) and we just update the note and programme columns
            //this is only supports updating 1 quote as we expect the subcontractor to only be able to send 1 quote
            QuoteMiddleware::updateTransaction("note"),
            QuoteMiddleware::updateTransaction("programme"),
            function ($a) {
                $a->set("note", $a->get("json.note", ""));
                $a->set("programme", $a->get("json.programme", ""));
            },
            BoqMiddleware::saveResource("uriArgs.eid", "uriArgs.sid", "programme", "programme_weeks_type"),
            BoqMiddleware::saveResource("uriArgs.eid", "uriArgs.sid", "note", "exclusion_allowances_note_type"),
            Generic::set("json",  function ($a) {
                return json_encode(
                    ['data' => $a->get("new_quote_item_ids", [])]
                );
            })
        ]
    ],
    [
        "key" => "^(?<eid>[0-9]+)\/quote\/(?<sid>[0-9]+)\/publish$",
        "method" => "PATCH",
        "middleware" => [
            //ToDo: Set this flag globally as knowing what the user type is is useful in multiple places
            AccountMiddleware::ifIsATypeOf(AccountMiddleware::SUBCONTRACTOR_TYPE, function ($a, $isType) {
                $a->set("is_subcontractor", $isType);
            }, true),
            BoqMiddleware::fetchByEntityId("uriArgs.eid"),
            function ($a) {
                $eid = $a->int("uriArgs.eid");
                $lastPublishedVersion = Entity::getLatestVersionByEntityId($eid, true);
                $a->set("lastPublishedVersion", $lastPublishedVersion);
            },
            Procedure::get("boqCheckProjectOwnerShip", ['key' => 'id', 'value' => 'boq.tender.project_id']),
            Procedure::get("fetchQuotes"),
            //Update All draft items to published
            function ($a) {
                $a->set("quote_status", "published");
                ProjectMiddleware::setProjectEntityStatus("quote_status", statusSaveKey: "published_status")($a);
                $draft = $a->getCollection(ProjectMiddleware::PROJECT_STATUS_COLLECTION_KEY)
                    ->filterByField("label", "draft")->first();

                $collection = $a->get(QuoteMiddleware::QUOTE_COLLECTION_KEY);
                $updates    = 0;
                $collection->map(function ($quote) use ($a, $draft, &$updates) {
                    $quote->updateItemsStatus($a->get("published_status")->int("id"), $draft->int("id"));
                    $updates += $quote->countUpdatedItems();
                    return $quote;
                });
                $a->set("transaction_id", $a->get(QuoteMiddleware::QUOTE_COLLECTION_KEY)->first()->get("id"));
                //Update the Collection
                $a->set(ProjectMiddleware::PROJECT_STATUS_COLLECTION_KEY, $collection);
                $a->set("quote_update_count", $updates);
                $a->set("status_id", QuoteMiddleware::QUOTE_STATUS_SENT_ID);
                $a->set("status",  Item::getStatusByLabel("published"));
            },
            QuoteMiddleware::saveQuotesItems(),
            QuoteMiddleware::updateTransactionFromQuoteItems(),
            QuoteMiddleware::updateTransaction("status_id"),
            function ($a) {
                $a->set("upload_source", new Shape([
                    "source"              => "Prosper Submission",
                    "uploaded_by_user_id" => $a->get("user.id"),
                ]));
            },
            QuoteMiddleware::updateTransaction("upload_source"),
            function ($action) {
                $eid  = $action->get("uriArgs.eid");
                $status = $action->get("status");
                $resources = Resource::getResourcesByEntityId($eid);
                $draftStatus = Item::getStatusByLabel("draft");
                $resources = array_filter($resources, function ($resource) use ($draftStatus) {
                    return $resource["resource_version"]["status"] === $draftStatus;
                });
                foreach ($resources as $resource) {
                    Resource::updateResourceMapping($resource["id"], ['status' => $status]);
                }
            },
            EnquiriesMiddleware::loadEnquiryTypes(),
            ProjectMiddleware::fetchProject(projectValueKey: "boq.tender.project_id"),
            EnquiriesMiddleware::loadEnquiry("boq.tender.id"),
            EnquiriesMiddleware::getEnquiryContractorData(),
            EnquiriesMiddleware::addHistory("boq.tender.project_id", "boq.tender.id", function ($a) {
                $sid    = $a->get("uriArgs.sid");
                $status = $a->get("types")->filterByField("uid", "tender_returned")->first();
                return new Shape([
                    "sid"                   => $sid,
                    "author_id"             => $sid,
                    "status_id"             => $status->get("id"),
                    "tender_history_type"   => 'Enquiry',
                    "meta"                  => []
                ]);
            }),
            function ($a) {
                $quote_email_data = [
                    "sender"    => new Shape($a->get("user")),
                    "recipient" => $a->get("contractor"),
                    'project'   => $a->get("project"),
                    'tender'    => $a->get("boq.tender"),
                    'token'     => new Shape(['url' => $a->get("activation_link")]),
                    'extra'     => new Shape([
                        'date' => date("Y/m/d H:i:s"),
                        'company_name' => $a->get("account.name")
                    ])
                ];

                //send quotation to project owner
                EmailMiddleware::send("Quotation Received", $quote_email_data)($a);

                //send quotation to the contractor that sent the enquiry
                $quote_email_data['recipient'] = $a->get("contractor_enquiry_user");
                EmailMiddleware::send("Quotation Received", $quote_email_data)($a);

                //send quotation to subcontractor
                unset($quote_email_data['recipient']);
                EmailMiddleware::send("Quotation Submitted", $quote_email_data)($a);
            },
            //ToDo: Check if the transaction table status_id is actually used for anything before updating it.
            //ToDo: If Updates, we need to email the Main Contractor
            Generic::set("json",  function ($a) {
                return json_encode(
                    ['data' => ["success" => true, "updates" => $a->get("quote_update_count")]]
                );
            })
        ]
    ],
    [
        "key" => "^(?<eid>[0-9]+)\/quote\/(?<sid>[0-9]+)\/republish$",
        "method" => "PATCH",
        "middleware" => [
            BoqMiddleware::fetchByEntityId("uriArgs.eid"),
            function ($a) {
                $data = $a->getRoute()->getRequest()->getData();
                $eid = $a->int("uriArgs.eid");
                $lastPublishedVersion = Entity::getLatestVersionByEntityId($eid, true);
                $a->set("lastPublishedVersion", $lastPublishedVersion);
                $a->set("json", $data->get("json"));
            },
            Procedure::get("boqCheckProjectOwnerShip", ['key' => 'id', 'value' => 'boq.tender.project_id']),
            Procedure::get("fetchQuotes"),
            //Update All draft items to published
            function ($a) {
                $a->set("quote_status", "published");
                ProjectMiddleware::setProjectEntityStatus("quote_status", statusSaveKey: "published_status")($a);
                $draft = $a->getCollection(ProjectMiddleware::PROJECT_STATUS_COLLECTION_KEY)
                    ->filterByField("label", "draft")->first();
                $collection = $a->get(QuoteMiddleware::QUOTE_COLLECTION_KEY);
                $updates    = 0;
                $collection->map(function ($quote) use ($a, $draft, &$updates) {
                    $quote->updateItemsStatus($a->get("published_status")->int("id"), $draft->int("id"));
                    $updates += $quote->countUpdatedItems();
                    return $quote;
                });
                $a->set("transaction_id", $a->get(QuoteMiddleware::QUOTE_COLLECTION_KEY)->first()->get("id"));
                //Update the Collection
                $a->set(ProjectMiddleware::PROJECT_STATUS_COLLECTION_KEY, $collection);
                $a->set("quote_update_count", $updates);
                $a->set("notify_contractor", (bool)$updates);
                $a->set("status_id", QuoteMiddleware::QUOTE_STATUS_SENT_ID);
                $a->set("status",  Item::getStatusByLabel("published"));
            },
            QuoteMiddleware::saveQuotesItems(),
            QuoteMiddleware::updateTransactionFromQuoteItems(),
            QuoteMiddleware::updateTransaction("status_id"),
            function ($action) {
                $eid  = $action->get("uriArgs.eid");
                $status = $action->get("status");
                $resources = Resource::getResourcesByEntityId($eid);
                $draftStatus = Item::getStatusByLabel("draft");
                $resources = array_filter($resources, function ($resource) use ($draftStatus) {
                    return $resource["resource_version"]["status"] === $draftStatus;
                });
                foreach ($resources as $resource) {
                    Resource::updateResourceMapping($resource["id"], ['status' => $status]);
                }
            },
            EnquiriesMiddleware::loadEnquiryTypes(),
            ProjectMiddleware::fetchProject(projectValueKey: "boq.tender.project_id"),
            EnquiriesMiddleware::loadEnquiry("boq.tender.id"),
            EnquiriesMiddleware::getEnquiryContractorData(),
            //Notify the contractor for the differences from the new boq
            Conditional::isTrue("notify_contractor", [
                function ($a) {
                    $a->setItems([
                        "boq_reason" => $a->get("json.reason"),
                        "tender_id"  => $a->get("boq.tender.id"),
                    ]);
                },
                AccountMiddleware::load("region", "", "regions"),
                QuoteMiddleware::getItemsDifferences(),
                BoqMiddleware::preparePDFData(),
                BoqMiddleware::sendQuoteAddendumEmailWithAttachment(),
            ], true),
            Generic::set("json",  function ($a) {
                return json_encode(
                    ['data' => ["success" => true, "updates" => $a->get("quote_update_count")]]
                );
            })
        ]
    ],
    [
        "key" => "^(?<eid>[0-9]+)\/quote\/(?<sid>[0-9]+)\/download(\/(?<version>[0-9]+))?$",
        "method" => "GET",
        "middleware" => [
            BoqMiddleware::fetchByEntityId("uriArgs.eid"),
            Procedure::get("boqCheckProjectOwnerShip", ['key' => 'id', 'value' => 'boq.tender.project_id']),
            Procedure::get("fetchQuotes"),
            function ($a) {
                $quote = $a->get(QuoteMiddleware::QUOTE_COLLECTION_KEY)->filterByStringField("subcontractor_id", $a->get("uriArgs.sid"));
                $documents = QuoteModel::getSubcontractorDocumentsByVersion($a->get(QuoteMiddleware::QUOTE_COLLECTION_KEY), $a->int("uriArgs.sid"), $a->int("uriArgs.version"));
                if ($quote->count()) {
                    $a->setItems([
                        "documents"      => $documents,
                        "download_path"  => sprintf("%s/%s", Config::get("boq.quote.save.tmp"), $quote->first()->get("id"))
                    ]);
                }
            },
            QuoteMiddleware::downloadDocuments("documents", "download_path"),
            Generic::set("json",  function ($a) {
                $zip = $a->get("zip");
                if (!$zip) {
                    $message = 'No documents uploaded';
                }
                return json_encode(
                    ['data' => ["success" => (bool)$zip, "file" => $zip, 'error' => $message ?? null]]
                );
            })
        ]
    ],
    [
        "key" => "^(?<eid>[0-9]+)\/quote\/(?<sid>[0-9]+)\/revision_download\/(?<token>[a-z0-9]+)$",
        "method" => "GET",
        "middleware" => [
            BoqMiddleware::fetchByEntityId("uriArgs.eid"),
            Procedure::get("boqCheckProjectOwnerShip", ['key' => 'id', 'value' => 'boq.tender.project_id']),
            QuoteMiddleware::getRevisionToS3("uriArgs.eid"),
            Generic::set("json",  function ($a) {
                return json_encode(
                    ['data' => ["success" => true, "revision" => $a->get("revision")]]
                );
            })
        ]
    ]
];
