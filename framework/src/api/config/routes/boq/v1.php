<?php

use Api\Middleware\ApiSession;
use Api\Middleware\ProjectMiddleware;
use Api\Middleware\QsaiMiddleware;
use Api\Middleware\Relay\BoqMiddleware;
use Api\Middleware\TenderMiddleware;
use Api\Middleware\Transactions\QuoteMiddleware;
use Api\Model\BoQ\Item;
use Api\Service\Boq\ExcelService as BoqExcelService;
use Core\Config;
use Core\Data\Shape;
use Core\Middleware\Collection;
use Core\Middleware\Conditional;
use Core\Middleware\Exception as MiddlewareException;
use Core\Middleware\Generic;
use Core\Middleware\Service\AccountMiddleware;
use Core\Service\Manager;
use Core\Middleware\Procedure;

/**
TODO LIST:
 * Handle all exceptions properly
 * Check Ownership on create and update
 * Follow a standard REST routing format if its prefixed with boq that the resource, /boq/ /boq/{entity_id}/sub_resource
 * (Suggestion) Move Project Middleware to shared location, perhaps start a directory at the root of the project or in core called common
**/

//Load in any preset Procedures to reuse
include_once("procedures.php");

$session_handler = Config::get("session.handler", ApiSession::class);
return [
    "type" => "http",
    "onError" => [
        "formValidation" => Generic::badRequest(),
        "invalidToken"   => $session_handler::invalidApiToken(),
        "tooManyRequests"  => Generic::tooManyRequests(),
        "noEntityFound"    => Generic::exceptionResponse("HTTP/1.0 404"),
        //ToDo: Refactor projectOwnsership and authError as the same
        "projectOwnershipError" => Generic::exceptionResponse("HTTP/1.0 403"),
        "authError"        => Generic::exceptionResponse("HTTP/1.0 403"),
        "serviceError"     => Generic::exceptionResponse("HTTP/1.0 500"),
        "badRequest"       => Generic::exceptionResponse("HTTP/1.0 503"),
        "missingProjectId" => Generic::exceptionResponse("HTTP/1.0 404"),
        "missingTenderId" => Generic::exceptionResponse("HTTP/1.0 404"),
        "payloadError"     => Generic::exceptionResponse("HTTP/1.0 400"),
        // Legacy/existing error handlers
        "error" => function ($e, $a) {
            $a->set("headers", ["HTTP/1.0 " . $a->get("code") => $e->getMessage()]);
            $a->set("json", $a->get("response")->get("content"));
        },
        "qsaiNotFoundError" => function ($e, $a) {
            $qsaiResponse = $a->get("response", []);
            $formatted = QsaiMiddleware::formatStructuredError($qsaiResponse);
            $a->set("headers", ["HTTP/1.0 404" => "Not Found"]);
            $a->set("json", json_encode($formatted));
        },
    ],
    "middleware" => [
        function($action) use ($session_handler){
            //browser will send before a OPTIONS request, without the authorisation token, and then will send the real request
            if($action->getRoute()->getRequest()->get("method") !== "OPTIONS"){
               $session_handler::validate()($action);
            }
        },
    ],
    "default_action" => [
        "middleware" => [
            function($a) {
                //ToDo: Add some more context and info
                $a->set("message", "No Api Route Found");
            },
            Generic::set("json",  function ($a) {
                $a->set("headers", ["HTTP/1.0 404 No Api Route Found" => ""]);
                return json_encode(['message' => $a->get("message", ""), "code" => 404]);
            })
        ]
    ],
    "actions" => array_merge([
        //CORS HANDLER
        [
            "key" => ".+",
            "method" => "OPTIONS",
            "middleware" => [
                Generic::corsResponse()
            ]
        ],
        [
            "key" => "^(?<slug>[a-zA-Z0-9-]+)$",
            "method" => "GET",
            "middleware" => [
                //I also question the wisdom of one route that get a BOQ by project slug at boq/{slug} and one that
                //gets by id at /boq/entity/{id}
                //IMO the entity prefix is redundant as the resource is already in the route /boq/
                Procedure::get("boqCheckProjectOwnerShip", ['key' => 'slug','value' => "uriArgs.slug"]),
                BoqMiddleware::fetchByProjectId("project.id"),
                BoqMiddleware::parseEntitiesEntries("boq"),
                Generic::set("json",  function ($a) {
                    return json_encode(['data' => $a->getCollection("collection")]);
                })
            ]
        ],
        [
            "key" => "^(?<project_id>[0-9]+)$",
            "method" => "GET",
            "middleware" => [
                Procedure::get("boqCheckProjectOwnerShip", ['key' => 'id','value' => "uriArgs.project_id"]),
                BoqMiddleware::fetchByProjectId("project.id"),
                BoqMiddleware::parseEntitiesEntries("boq"),
                Generic::set("json",  function ($a) {
                    return json_encode(['data' => $a->get("collection")]);
                })
            ]
        ],
        [
            "key" => "units",
            "method" => "GET",
            "middleware" => [
                Generic::set("json",  function ($a) {
                    try {
                        $units = Manager::getService("project")->fetch("boq/unit")->getCollection('data');
                        return json_encode(['data' => $units && $units->count() ? $units : []]);
                    } catch (\Exception $e) {
                        throw new MiddlewareException("projectNotFoundError", $e->getMessage());
                    }
                })
            ]
        ],
        [
            "key" => "^entity\/(?<eid>[0-9]+)$",
            "method" => "GET",
            "middleware" => [
                AccountMiddleware::ifIsATypeOf(AccountMiddleware::SUBCONTRACTOR_TYPE, function($a, $isType) {
                    $a->setItems([
                        "is_subcontractor" => $isType,
                        "status"           => "published",
                        "excluded"         => ["budget_rate", "budget_total"]
                    ]);
                }),
                BoqMiddleware::fetchByEntityId("uriArgs.eid"),
                BoqMiddleware::parseEntitiesEntries("boq", "excluded"),
                Generic::set("json",  function ($a) {
                    return json_encode(['data' => $a->get("collection")]);
                })
            ]
        ],
        [
            "key" => "^entity\/(?<tid>[0-9]+)$",
            "method" => "POST",
            "middleware" => [
                BoqMiddleware::createEntity("uriArgs.tid"),
                Generic::set("json",  function ($a) {
                    return json_encode(['success' => true]);
                })
            ]
        ],
        [
            "key" => "^entity\/(?<eid>[0-9]+)$",
            "method" => "PATCH",
            "middleware" => [
                BoqMiddleware::loadResourceTypes(),
                function ($a) {
                    $data = $a->getRoute()->getRequest()->getData();
                    $json = $data->getShape("json");
                    $a->set("json", $json);

                    $resourceTypes = $a->get("resource_types");
                    $entityNoteType = $resourceTypes->filterByField("label", "entity_note")->getFirst();
                    $a->set("resource_type", $entityNoteType);
                },
                BoqMiddleware::validateBudget("json.entries"),
                BoqMiddleware::fetchByEntityId("uriArgs.eid"),
                BoqMiddleware::saveResource("uriArgs.eid", "user.account_id", "json.notes", "resource_type"),
                BoqMiddleware::saveItems("uriArgs.eid", "json.entries"),
                TenderMiddleware::updateTenderBudget("uriArgs.eid", "json.entries"),
                BoqMiddleware::relayToQsaiForUpdate(),
                Generic::set("json",  function ($a) {
                    return json_encode(['success' => true]);
                })
            ],
            "documentation" => [
                "ToDo" => [
                    "Only Allow admins and Main Contractors to create BOQ's"
                ],
                "description" => "Allows for a BOQ entity to be updated, by id, with notes and items",
                "payload" => [
                    "entries" => [
                        [
                            "id" => "int",
                            "version_id" => "int",
                            "tenderee_note" => ["text" => "fulltext"],
                            "status" => ["enum" => ["published", "draft", "archived"]], // This should be an int...
                        ]
                    ],
                    "notes" => [
                        "id"   => "int optional",
                        "text" => "fulltext"
                    ]
                ]
            ]
        ],
        [
            "key" => "publish\/(?<eid>[0-9]+)$",
            "method" => "PATCH",
            "middleware" => [
                function ($a) {
                    $data = $a->getRoute()->getRequest()->getData();
                    $json = $data->getShape("json");
                    $a->set("json", $json);
                },
                ProjectMiddleware::fetchProjectStatuses(),
                BoqMiddleware::fetchByEntityId("uriArgs.eid"),
                BoqMiddleware::parseEntitiesEntries("boq", "excluded"),
                BoqMiddleware::updateStatus(),
                Generic::set("json",  function ($a) {
                    return json_encode(['success' => true]);
                })
            ]
        ],
        [
            "key" => "edit_boq\/(?<eid>[0-9]+)$",
            "method" => "PATCH",
            "middleware" => [
                function ($a) {
                    $data = $a->getRoute()->getRequest()->getData();
                    $json = $data->getShape("json");
                    $a->set("json", $json);
                },
                BoqMiddleware::fetchByEntityId("uriArgs.eid"),
                BoqMiddleware::parseEntitiesEntries("boq", "excluded"),
                Generic::set("json",  function ($a) {
                    return json_encode(['success' => true]);
                })
            ]
        ],
        [
            "key" => "republish_boq\/(?<eid>[0-9]+)$",
            "method" => "POST",
            "middleware" => [
                function ($a) {
                    $data = $a->getRoute()->getRequest()->getData();
                    $a->set("json", $data->getShape("json"));
                    $a->set("status",  Item::getStatusByLabel("published"));
                },
                ProjectMiddleware::fetchProjectStatuses(),
                BoqMiddleware::fetchByEntityId("uriArgs.eid"),
                function($a){
                    $boq = $a->get("boq");
                    $a->setItems([
                        "boq_reason" => $a->get("json.reason"),
                        "tender_id"  => $boq->get("tender.id"),
                        "project_id" => $boq->get("tender.project_id"),
                    ]);
                },
                BoqMiddleware::parseEntitiesEntries("boq"),
                BoqMiddleware::updateStatus("status"),
                AccountMiddleware::load("region","", "regions"),
                Procedure::get("boqCheckProjectOwnerShip", ['key' => 'id','value' => 'project_id']),
                TenderMiddleware::fetchTenderHistoryByTenderId(),
                TenderMiddleware::getBoqSubcontractorsFromTender(),
                Collection::storeFieldValues("id", "subcontractor_aids", "subcontractors"),
                AccountMiddleware::loadAccountsByIdArray("subcontractor_aids"),
                BoqMiddleware::getItemsDifferences("boq"),
                // ToDo: Check if general note is changed
                function($a){
                    if(count($a->get("differences", []))) {
                        $a->set("has_differences", true);
                    }
                },
                Conditional::hasKey("has_differences", [
                    BoqMiddleware::preparePDFData(),
                    BoqMiddleware::sendAddendumEmailWithAttachment(),
                ]),
                Generic::set("json",  function ($a) {
                    return json_encode(['success' => true]);
                })
            ]
        ],
        [
            "key" => "statuses",
            "method" => "GET",
            "middleware" => [
                ProjectMiddleware::fetchProjectStatuses(),
                Generic::set("json",  function ($a) {
                    return json_encode(['data' => $a->get("project_statuses")]);
                })
            ]
        ],
        [
            "key" => "export\/(?<eid>[0-9]+)$",
            "method" => "GET",
            "middleware" => [
                BoqMiddleware::fetchByEntityId("uriArgs.eid"),
                //Once the BOQ is loaded we need to check if it's a main contractor, and if so do they own the project
                Procedure::get("boqCheckProjectOwnerShip", ['key' => 'id', 'value' => 'boq.tender.project_id']),
                Procedure::get("fetchQuotes"),
                //Setup the quote collection
                Procedure::get("getSubcontractorsAndMapQuotes"),
                //Filter the quote items by the latest version
                QuoteMiddleware::filterQuoteItemsByLatestVersion(),
                //Calculate the best price for each quote
                QuoteMiddleware::calculateBestPrice(),
                ProjectMiddleware::fetchBOQUnits(callback: function($a, $units, $unitCollectionKey) {
                    $boq = $a->get("boq");
                    $boq->set($unitCollectionKey, $units);
                }),
                function($a) {
                    /** */
                    $boq = $a->get("boq");
                    $excel = new BoqExcelService($boq, $a->getCollection(QuoteMiddleware::QUOTE_COLLECTION_KEY));
                    $excel->render();
                    //Returns Download Headers and exits

                    $label = $boq->get("tender.label");
                    $label = preg_replace('/[^a-zA-Z0-9]/', '-', str_replace(" ", "_", strtolower($label)));
                    $excel->download($label . "_tender_analysis.xlsx");
                }
            ]
        ]
    ],
        //Include Sub Resources here
        include_once("quote.php")
    )//End of Array Merge
];
