<?php

//Core Dependencies
use Core\Middleware\Service\AccountMiddleware;
use Core\Middleware\Procedure;
use Core\Data\Shape;
use Core\Router\Route\Action;

//Api Dependencies
use Api\Middleware\ProjectMiddleware;
use Api\Middleware\Transactions\QuoteMiddleware;
use Api\Model\BoQ\Resource;

Procedure::registerActions(
    "boqCheckProjectOwnerShip", [
        AccountMiddleware::ifIsATypeOf(array_merge(AccountMiddleware::MAIN_CONTRACTOR_TYPE, AccountMiddleware::ADMIN_TYPE), function($a) {
            ProjectMiddleware::fetchProject(Procedure::getData("key")($a), projectValueKey: Procedure::getData("value")($a))($a);
            //only check if the project is owned by the main contractor if the user is a main contractor
            AccountMiddleware::ifIsATypeOf(AccountMiddleware::MAIN_CONTRACTOR_TYPE, function($a) {
                ProjectMiddleware::checkProjectOwnershipById()($a);
            }, onlyCallbackOnTrue:true)($a);
        }, onlyCallbackOnTrue:true),
    ]
);

Procedure::registerActions(
    "fetchQuotes", [
        //Once the BOQ is loaded we need to check if it's a main contractor, and if so do they own the project
        QuoteMiddleware::loadQuotesCollection(argLoader : function($action) {
            $args = [
                "tid" => $action->get("boq")->get("tender_id")
            ];
            if($action->get("is_subcontractor")) {
                $args["sid"] = $action->int("account.id");
            }
            return $args;
        }),
    ]
);

Procedure::registerActions(
    "getSubcontractorsAndMapQuotes", [
        //Get the subcontractors ids from the quotes
        function(Action $action) {
            $quotes = $action->getCollection(QuoteMiddleware::QUOTE_COLLECTION_KEY);
            if(!$quotes) {
                throw new \Exception("No quotes found in procedure");
            }
            $sids = $quotes->getSubcontractorIds(function($sids) use ($action){
                $action->set("sids", $sids);
            });
        },
        //Load the subcontractors from the ids
        function(Action $action) {
            $subcontractors = AccountMiddleware::loadAccountsByIdArray("sids")(
                new Shape(["sids" => $action->get("sids")])
            )->getCollection("accounts");
            $action->set("subcontractors", $subcontractors);
        },
        //Map the quotes to the subcontractors, filter out the quotes that
        //dont have boq and group them by subcontractor id
        function(Action $action) {
            $subcontractors = $action->get("subcontractors");
            $quotes = $action->getCollection(QuoteMiddleware::QUOTE_COLLECTION_KEY);
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
            //Group quotes by subcontractor id to always get the latest quote
            $quotes = $quotes->groupByKey("subcontractor_id");
            $action->set(QuoteMiddleware::QUOTE_COLLECTION_KEY, $quotes);
        },
        //Add the programme weeks and exclusion notes to the quotes
        function(Action $action) {
            //Get the resources for the entity
            $resources = Resource::getResourcesByEntityId($action->int("boq.id"));

            //Set the resource types
            $typeProgrammeWeek = Resource::PROGRAMME_WEEK;
            $typeNoteExclusion = Resource::EXCLUSION_NOTE;

            //Get the quotes
            $quotes = $action->getCollection(QuoteMiddleware::QUOTE_COLLECTION_KEY);
            $differences = [];

            //Loop through the quotes and add the programme weeks and exclusion notes
            foreach ($quotes->getItems() as $item) {
                //We use the subcontractor id to get the programme weeks and exclusion notes
                $sid = $item->get("subcontractor_id");


                $programmeWeeks = array_filter($resources, function ($resource) use ($typeProgrammeWeek, $sid) {
                    return $resource["boq_resource_type_id"] === $typeProgrammeWeek && intval($resource["resource_data"]["id_account"]) === intval($sid);
                });

                //Get the latest programme week
                $programmeWeek = new Shape(empty($programmeWeeks) ? [] : end($programmeWeeks));
                $item->set("programme_weeks",
                    [
                        "id"   => $programmeWeek->get("boq_resource_id", "") ,
                        "text" => $programmeWeek->get("resource_data.text", "")
                    ]
                );

                //Get the latest exclusion note
                $noteExclusion = new Shape(array_filter($resources, function ($resource) use ($typeNoteExclusion, $sid) {
                    return $resource["boq_resource_type_id"] === $typeNoteExclusion && intval($resource["resource_data"]["id_account"]) === intval($sid);
                }));
                $item->set("exclusion_note",
                    [
                        "id"   => $noteExclusion->get("boq_resource_id", "") ,
                        "text" => $noteExclusion->get("resource_data.text", "")
                    ]
                );

                $differences[$sid] = [];
                //Get the differences between the quote and the programme week
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
            $action->set(QuoteMiddleware::QUOTE_COLLECTION_KEY, $quotes);
        }
    ]
);
