<?php

use Core\Config;
use Core\Data\Shape;
use Core\Middleware\Conditional;
use Core\Middleware\Generic;
use Core\Middleware\Exception as MiddlewareException;
use Api\Middleware\Relay\BoqMiddleware;
use Api\Middleware\ProjectMiddleware;
use Api\Middleware\ApiSession;
use Api\Middleware\DocumentMiddleware;
use Api\Middleware\IfsProjectMiddleware;
use Api\Middleware\OrderMiddleware;
use Core\Middleware\Procedure;
use Api\Model\BoQ\Entity;
use Api\Model\BoQ\Item;
use Api\Model\Project\Team;
use App\Domain\Account\Manage;
use Core\Data\Collection;
use Core\Middleware\Service\AccountMiddleware;
use Core\Middleware\Service\UserMiddleware;
use Prosper\Middleware\Relay\TenderMiddleware;
use Core\Middleware\Validator;
use Core\Service\Manager;
use Prosper\Middleware\AccountMiddleware as Account;
use Api\Middleware\ApprovalSatisfactionHelper;

//Load in any preset Procedures to reuse
include_once("procedures.php");
$session_handler = Config::get("session.handler", ApiSession::class);

$convertToUKTime = function ($dateTime) {
    if (!$dateTime) return null;
    $date = new DateTime($dateTime, new DateTimeZone('UTC'));
    $date->setTimezone(new DateTimeZone('Europe/London'));
    return $date->format("Y-m-d H:i:s");
};

return [
    "type" => "http",
    "onError" => [
        "formValidation" => Generic::badRequest(),
        "invalidToken"   => $session_handler::invalidApiToken(),
        "tooManyRequests"  => Generic::tooManyRequests(),
        "InvalidRouteParams" => Generic::exceptionResponse("HTTP/1.0 400"),
        "InvalidPayload" => Generic::exceptionResponse("HTTP/1.0 400"),
        "InvalidStatus" => Generic::exceptionResponse("HTTP/1.0 403"),
        "noEntityFound"    => Generic::exceptionResponse("HTTP/1.0 404"),
        "projectOwnershipError" => Generic::exceptionResponse("HTTP/1.0 403"),
        "EndpointFetchFailure" => Generic::exceptionResponse("HTTP/1.0 500"),
        "projectTeamMemberError" => Generic::exceptionResponse("HTTP/1.0 400"),
        "TenderRecommendationFetchFailed" => Generic::exceptionResponse("HTTP/1.0 500"),
        "TenderRecommendationInvalidField" => Generic::exceptionResponse("HTTP/1.0 400"),
        "PricingSummaryFetchFailed" => Generic::exceptionResponse("HTTP/1.0 400"),
        "TenderRecommendationAlreadyExists" => Generic::exceptionResponse("HTTP/1.0 403"),
        "tenderRecommendationOwnershipError" => Generic::exceptionResponse("HTTP/1.0 403"),
        "ApprovalAssignFailed" => Generic::exceptionResponse("HTTP/1.0 400"),
        "TenderRecommendationApprovalCompleted" => Generic::exceptionResponse("HTTP/1.0 403"),
        "TenderRecommendationApproversAlreadyExists" => Generic::exceptionResponse("HTTP/1.0 400"),
        "ReminderStatusError" => Generic::exceptionResponse("HTTP/1.0 403"),
        "TenderRecommendationAlreadyActive" => Generic::exceptionResponse("HTTP/1.0 403"),
        "TenderIdNotExists" => Generic::exceptionResponse("HTTP/1.0 400"),
        "TenderInquiryApproversAlreadyExists" => Generic::exceptionResponse("HTTP/1.0 400"),
        "TenderInquiryApprovalAssignFailed" => Generic::exceptionResponse("HTTP/1.0 400"),
        "tenderInquryOwnershipError" => Generic::exceptionResponse("HTTP/1.0 403"),
        "TenderInquiryReminderStatusError" => Generic::exceptionResponse("HTTP/1.0 403"),
        "ApprovalNotFound" => Generic::exceptionResponse("HTTP/1.0 400"),
        "ShortlistSubcontractorOwnershipError" => Generic::exceptionResponse("HTTP/1.0 403"),
        "ShortlistedSubcontractorFetchFailed" => Generic::exceptionResponse("HTTP/1.0 500"),
        "ShortlistedSubcontractorCreateFailed" => Generic::exceptionResponse("HTTP/1.0 400"),
        "ShortlistedSubcontractorAlreadyExists" => Generic::exceptionResponse("HTTP/1.0 409"),
        "ShortlistedSubcontractorInvalidPackage" => Generic::exceptionResponse("HTTP/1.0 400"),
        "PackageNotInProject" => Generic::exceptionResponse("HTTP/1.0 403"),
        "SubcontractorNotFound" => Generic::exceptionResponse("HTTP/1.0 404"),
        "ShortlistedSubcontractorApproversAlreadyExists" => Generic::exceptionResponse("HTTP/1.0 403"),
        "approvalLevelIdError" => Generic::exceptionResponse("HTTP/1.0 403"),
        "TenderRecommendationDocumentFailed" => Generic::exceptionResponse("HTTP/1.0 403"),
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
            "key" => "^(?<project_slug>[a-zA-Z0-9-]+)$",
            "method" => "GET",
            "middleware" => [
                Procedure::get("fetchAndValidateProject"),
                Generic::set("json",  function ($a) {
                    return json_encode(['data' => $a->get("project")]);
                })
            ]
        ],
        [
            "key" => "^(?<slug>[a-zA-Z0-9-]+)\/boq$",
            "method" => "GET",
            "middleware" => [
                ProjectMiddleware::fetchProject("slug", "uriArgs.slug"),
                Procedure::get("boqCheckProjectOwnerShip", ['key' => 'id', 'value' => 'project.id']),
                TenderMiddleware::loadHistoryTypes(),
                ProjectMiddleware::getTendersWithHistory(),
                BoqMiddleware::fetchByProjectId("project.id"),
                BoqMiddleware::getLastVersionResource("note"),
                BoqMiddleware::parseEntitiesEntries("boq"),
                Generic::set("json",  function ($a) {
                    return json_encode(['data' => $a->getCollection("collection")]);
                })
            ]
        ],
        [
            "key" => "^(?<project_slug>[a-zA-Z0-9-]+)\/(?<tid>[a-zA-Z0-9-]+)\/boq$",
            "method" => "GET",
            "middleware" => [
                Procedure::get("fetchAndValidateProject"),
                function ($a) {
                    $tid = $a->int("uriArgs.tid");
                    $tenders = $a->get("project")->getCollection("tender");
                    if ($tenders->count()) {
                        $tender = $tenders->filterByField("id", $tid, cast: "int");
                        if ($tender->count()) {
                            $a->set("tender", $tender->first());
                        } else {
                            throw new MiddlewareException("noEntityFound", "No Tender Found with Id $tid");
                        }
                    } else {
                        throw new MiddlewareException("noEntityFound", "No Tender Found with Id $tid");
                    }
                },
                BoqMiddleware::fetchByTenderId("tender.id"),
                ProjectMiddleware::fetchProjectStatuses(),
                BoqMiddleware::getItemsDifferences("boq"),
                function ($a) {
                    //ToDo Move this logic into the BOQ class to flatten entries
                    $boq   = $a->get("boq");
                    $differences = $a->get("differences");
                    $eid = $boq->get("id");
                    $items = [];
                    $lastPublishedVersion = Entity::getLatestVersionByEntityId($eid, true);
                    $statuses = $a->get("project_statuses");
                    $publishedStatuses = array_map(function ($status) {
                        return $status["id"];
                    }, array_filter($statuses, function ($status) {
                        return $status["label"] === "published" || $status["label"] === "tendered";
                    }));

                    $lastPublishedNotes = array_filter($boq->getCollection("note")->getItemsAsArray(), function ($item) use ($publishedStatuses) {
                        return in_array($item["resource_mappings"]["resource_version"]["status"], $publishedStatuses);
                    });
                    usort($lastPublishedNotes, function ($a, $b) {
                        return $b['resource_mappings']['resource_version']['version'] - $a['resource_mappings']['resource_version']['version'];
                    });
                    $lastPublishedNotes = array_shift($lastPublishedNotes);
                    $boq->set("note", $lastPublishedNotes);
                    foreach ($boq->getCollection("entries") as $entry) {
                        $mappings = $entry->get("item_mappings");
                        $mappings = array_filter($mappings, function ($mapping) use ($lastPublishedVersion, $publishedStatuses) {
                            $status = intval($mapping['item_version']["status"]);
                            $version = intval($mapping['item_version']["version"]);
                            return in_array($status, $publishedStatuses) && $lastPublishedVersion === $version;
                        });
                        $mappings = count($mappings) ? $mappings : $entry->get("item_mappings");
                        $mappings = (new Collection(Item::sortByLatestVersion($mappings), Shape::class))->first();

                        $itemVersion = $mappings->getShape("item_version")->keys(["version", "status"])->toArray();
                        $deletedState = 4;
                        if (
                            intval($itemVersion["version"]) === $lastPublishedVersion
                            && intval($itemVersion["status"]) !== $deletedState // We show it if is not deleted
                        ) {
                            $items[]  = array_merge(
                                ["tender_id" => $boq->get("tender_id")],
                                $mappings->keys(
                                    ["unit_id", "item_no", "description", "quantity", "type", "budget_rate", "budget_total", "position", "tenderee_note"]
                                )->toArray(),
                                $itemVersion,
                                $entry->keys(["id", "boq_entity_id", "boq_item_created_at",])->toArray()
                            );
                        }
                    }

                    //sort items by their position id
                    $items = (new Collection($items, Shape::class))->sort(function ($a, $b) {
                        return $a['position'] <=> $b['position'];
                    });

                    $boq->set("entries", $items->getItemsAsArray());
                    $boq->set("differences", $differences);
                },
                Generic::set("json",  function ($a) {
                    return json_encode(['data' => $a->get("boq")]);
                })
            ]
        ],
        [
            "key" => "^(?<id>[0-9]+)\/team$",
            "method" => "GET",
            "middleware" => [
                Procedure::get("checkProjectOwnerShip", ['key' => 'id', 'value' => 'uriArgs.id']),
                function($a){
                    $team = Team::fetchTeamByProjectId($a->int("uriArgs.id"));
                    $a->set("uids", $team->values("user_id"));
                    UserMiddleware::loadUsersByIdArray("uids")($a);
                    $users = new Collection($a->get("users", []), Shape::class);
                    $team_members = [];
                    $team->map(function($member) use ($users, &$team_members){
                         $existing_user = $users->filterByField("id", $member->get("user_id"), cast: "int");
                         if($existing_user->count()){
                             $existing_user = $existing_user->first();
                             $team_members[] = [
                                 "id"         => $member->get("id"),
                                 "user_id"    => $member->get("user_id"),
                                 "added_date" => $member->get("added_date"),
                                 "member" => [
                                     "firstname" => $existing_user->get("firstname"),
                                     "lastname"  => $existing_user->get("lastname"),
                                     "email"     => $existing_user->get("email"),
                                     "contact_number" => $existing_user->get("contact_number"),
                                     "position"  => $member->get("team_member_role"),
                                     "role"      => $existing_user->get("role"),
                                     "user_type" => $existing_user->get("user_type"),
                                 ]
                             ];
                         }
                        return $member;
                    });
                    $a->set("team", $team_members);
                },
                Generic::set("json",  function ($a) {
                    return json_encode(['data' => $a->get("team")]);
                })
            ]
        ],
        [
            "key" => "^(?<id>[0-9]+)\/add_team_member$",
            "method" => "POST",
            "middleware" => [
                Procedure::get("checkProjectOwnerShip", ['key' => 'id', 'value' => 'uriArgs.id']),
                function ($a) {
                    $data = $a->getRoute()->getRequest()->getData();
                    $json = $data->getShape("json");
                    $a->setItems([
                        "team" => [
                            "id"             => $json->get("id"),
                            "email"          => $json->get("email"),
                            "firstname"      => $json->get("firstname"),
                            "lastname"       => $json->get("lastname"),
                            "contact_number" => $json->get("contact_number"),
                            "role_id"        => $json->int("position"),
                            "type_id"        => Team::getUserTeamRoleId()($a),
                            "password"       => sha1($json->get("email"))
                        ],
                        "new_user" => is_null($json->get("id")),
                        "aid"      => $a->get("account.id"),
                        "updated"  => false,
                    ]);
                    Validator::isEmail("team.email", true)($a);
                    Conditional::switched("new_user", [
                        function ($a) {
                            //check if the email is already assigned to another user
                            AccountMiddleware::existsByKey("team.email", "email", skipAccount: true)($a);
                            if (!$a->get("exists")) {
                                Account::createUser("team", [
                                    'email',
                                    'firstname',
                                    'lastname',
                                    'contact_number',
                                    'type_id',
                                    'password',
                                    'aid'
                                ])($a);
                                $member_id = Team::addTeamMember(
                                    $a->int("uriArgs.id"),
                                    $a->int("uid"),
                                    $a->int("team.role_id"),
                                );
                                $a->setItems([
                                    "updated"   => true,
                                    "member_id" => $member_id
                                ]);
                            }else{
                                throw new MiddlewareException("projectTeamMemberError", "Email already assigned to another user");
                            }
                        }
                    ],
                    [
                        function ($a) {
                            AccountMiddleware::loadById("account.id")($a);
                            //check if the user id is part of the team so that you can only change a user details that is part of your team manager
                            $user = (new Collection($a->get("account.users"), Shape::class))->filterByField("id", $a->int("team.id"), cast: "int");
                            if($user->count()){
                                AccountMiddleware::existsByKey("team.email", "email", skipAccount: true)($a);
                                //if the email is not assigned to other user than the one we are trying to add
                                if($a->get("exists")){
                                    $in_team = (new Collection($a->get("account.users"), Shape::class))->filterByField("id", $a->int("user.id"), cast: "int");
                                    if($in_team->count()){
                                        $a->set("exists", false); //we can update his details
                                    }
                                }
                                if(!$a->get("exists")){
                                    AccountMiddleware::updateUser()($a);
                                    if(Team::memberIsInTeam($a->int("uriArgs.id"), $a->int("user.id"), "user_id")){
                                        Team::updateTeamMember(
                                            $a->int("uriArgs.id"),
                                            $a->int("team.id"),
                                            $a->int("team.role_id"),
                                        );
                                    }else{
                                        $member_id = Team::addTeamMember(
                                            $a->int("uriArgs.id"),
                                            $a->int("user.id"),
                                            $a->int("team.role_id"),
                                        );
                                        $a->set("member_id", $member_id);
                                    }
                                    $a->setItems([
                                        "updated" => true,
                                        "uid"     => $a->int("uriArgs.id")
                                    ]);

                                }
                                else{
                                    throw new MiddlewareException("projectTeamMemberError", "Email already assigned to another user");
                                }
                            }
                            else{
                                throw new MiddlewareException("projectTeamMemberError", "User not found");
                            }
                        }
                    ])($a);
                },
                Generic::set("json",  function ($a) {
                    return json_encode(['data' => [
                        "success" => $a->get("updated", false),
                        "error"   => $a->get("error", null),
                        "user_id" => $a->int("uid"),
                        "member_id" => $a->int("member_id"),
                    ]]);
                })
            ]
        ],
        [
            "key" => "^(?<id>[0-9]+)\/team_member\/(?<member_id>[0-9]+)$",
            "method" => "DELETE",
            "middleware" => [
                Procedure::get("checkProjectOwnerShip", ['key' => 'id', 'value' => 'uriArgs.id']),
                function ($a) {
                    $res = Team::removeTeamMemberById($a->int("uriArgs.id"), $a->int("uriArgs.member_id"));
                    $a->set("success", $res);
                },
                Generic::set("json",  function ($a) {
                    return json_encode(['data' => [
                        "success" => $a->get("success", false)
                    ]]);
                })
            ]
        ],
        [
            "key" => "getActions$",
            "method" => "GET",
            "middleware" => [
                function ($a) {
                    $dateFilter = $a->getRoute()->getRequest()->getArgs()->get('filter', 'all');
                    $today = new DateTime();
                    $startOfWeek = (clone $today)->modify('-6 days')->setTime(0,0,0);
                    $endOfWeek   = (clone $today)->setTime(23,59,59);

                    $startOfLastWeek = (clone $startOfWeek)->modify('-7 days');
                    $endOfLastWeek   = (clone $endOfWeek)->modify('-7 days');
                    $filter = [];
                    switch ($dateFilter) {
                        case 'this_week':
                            $filter['start_date'] = $startOfWeek->format('Y-m-d H:i:s');
                            $filter['end_date'] = $endOfWeek->format('Y-m-d H:i:s');
                            break;
                        case 'previous_week':
                            $filter['start_date'] = $startOfLastWeek->format('Y-m-d H:i:s');
                            $filter['end_date'] = $endOfLastWeek->format('Y-m-d H:i:s');
                            break;
                        case 'older':
                            $filter['end_date'] = $startOfLastWeek->format('Y-m-d H:i:s');
                            break;
                        default:
                            break;
                    }

                    $pendingData = Manager::getService("project")->fetch("order_approver/required-actions/" . $a->get("user.id"), $filter)->getCollection("data")->getItemsAsArray();
                    $completedData = Manager::getService("project")->fetch("order_approver/completed-actions/" . $a->get("user.id"), $filter)->getCollection("data")->getItemsAsArray();

                    $ids = [];
                    $userIds = array_merge($pendingData, $completedData);
                    foreach ($userIds as $value) {
                        $ids[] = $value['requester_user_id'];
                        $ids[] = $value['approver_user_id'];
                    }
                    $uniqueIds = array_values(array_unique($ids));
                    $filteredIds = array_values(array_filter($uniqueIds, function ($id) use ($a) {
                        return $id != $a->get("user.id");
                    }));
                    $a->set("filteredIds", $filteredIds);
                    UserMiddleware::loadUsersByIdArray("filteredIds")($a);
                    // Convert users array to associative array for fast lookup
                    $userMap = [];
                    foreach ($a->get('users') as $user) {
                        $user['display_name'] = $user['display_name'] ?: $user['firstname'] . ' ' . $user['lastname'];
                        $userMap[$user['id']] = $user;
                    }
                    foreach ($pendingData as &$txn) {
                        $data = Manager::getService("document")->fetch("category", ['entity_type' => 'order_template', 'entity_id' => $txn['package_id']])->getCollection('data');
                        $a->set('category', $data->getItemsAsArray());
                        DocumentMiddleware::extractDataFromOrder('category')($a);
                        $order_data = $a->get('order_data');
                        $filtered = array_filter($order_data['quotes'], function($record) {
                            return !empty($record['subcontractor_id']);
                        });

                        $did = max(array_keys($filtered));
                        $orderUrl = sprintf("%s/document-creator/template/%s/order/%s", Config::get('clink.site_url'), $did, $txn['package_id']);
                        $txn['order_url'] = $orderUrl;

                        if (isset($userMap[$txn['approver_user_id']])) {
                            $txn['approver_user_data'] = $userMap[$txn['approver_user_id']];
                        } else {
                            $txn['approver_user_data'] = $a->get('user');
                        }
                        if (isset($userMap[$txn['requester_user_id']])) {
                            $txn['requester_user_data'] = $userMap[$txn['requester_user_id']];
                        } else {
                            $txn['requester_user_data'] = $a->get('user');
                        }
                    }
                    foreach ($completedData as &$value) {
                        $data = Manager::getService("document")->fetch("category", ['entity_type' => 'order_template', 'entity_id' => $value['package_id']])->getCollection('data');
                        $a->set('category', $data->getItemsAsArray());
                        DocumentMiddleware::extractDataFromOrder('category')($a);
                        $order_data = $a->get('order_data');
                        $filtered = array_filter($order_data['quotes'], function($record) {
                            return !empty($record['subcontractor_id']);
                        });

                        $did = max(array_keys($filtered));
                        $orderUrl = sprintf("%s/document-creator/template/%s/order/%s", Config::get('clink.site_url'), $did, $value['package_id']);
                        $value['order_url'] = $orderUrl;
                        if (isset($userMap[$value['approver_user_id']])) {
                            $value['approver_user_data'] = $userMap[$value['approver_user_id']];
                        } else {
                            $value['approver_user_data'] = $a->get('user');
                        }
                        if (isset($userMap[$value['requester_user_id']])) {
                            $value['requester_user_data'] = $userMap[$value['requester_user_id']];
                        } else {
                            $value['requester_user_data'] = $a->get('user');
                        }
                    }
                    unset($txn, $value); // Unset references to avoid accidental modification
                    $a->set('pending', $pendingData);
                    $a->set('completed', $completedData);
                },
                Generic::set("json",  function ($a) {
                    return json_encode(['data' => [
                        "success" => $a->get("success", true),
                        "actions" => [
                            "pending" => $a->get("pending", []),
                            "completed" => $a->get("completed", []),
                        ]
                    ]]);
                })
            ]
        ],
        [
            "key" => "updateActions$",
            "method" => "POST",
            "middleware" => [
                function ($action) {
                    $data = $action->getRoute()->getRequest()->getData();
                    $requestData = $data->getShape('json')->get();
                    $action->set("requestData", $requestData);
                },
                OrderMiddleware::fetchOrderApproval("id", "requestData.approver_id"),
                function ($action) {
                    $approval = $action->get("order_approval")->get();
                    $data = [];
                    if ($approval['requester_user_id'] == $action->get('user.id')) {
                        $data['is_requester_read'] = $action->get('requestData.is_read');
                    }
                    if ($approval['approver_user_id'] == $action->get('user.id')) {
                        $data['is_approver_read'] = $action->get('requestData.is_read');
                    }
                    $action->set('postData', $data);
                },
                OrderMiddleware::orderApprovalRejection("postData", "requestData.approver_id"),
                Generic::set("json",  function ($action) {
                    return json_encode([
                        "success" => $action->get("success", true)
                    ]);
                })
            ]
        ],
        [
            "id" => "order-assigned-approvers",
            "key" => "^(?<project_id>[0-9]+)\/order\/assigned-approvers$",
            "method" => "GET",
            "middleware" => [
                function ($shape) use ($convertToUKTime) {
                    $did = $shape->get('request_args.did', false);
                    $filtered = [];
                    if ($did) {
                        DocumentMiddleware::fetchDocument('id', 'request_args.did')($shape);
                        $meta = json_decode($shape->get('document')->first()->get('meta'), true);
                        $filtered[] = $meta['quote']['id'];
                    } else {
                        $data = Manager::getService("document")->fetch("category", ['entity_type' => 'order_template', 'parent_id' => $shape->get('uriArgs.project_id')])->getCollection('data');
                        $shape->set('category', $data->getItemsAsArray());
                        DocumentMiddleware::extractDataFromOrder('category')($shape);
                        $data = $shape->get('order_data');
                        $filtered = array_column($data['quotes'], 'id');
                    }
                    $approvals = Manager::getService("project")->fetch("order_approver/transaction/[" . implode(',', $filtered) . "]",)->getCollection('data');
                    $shape->set('data', (object)[]);
                    $grouped = [];
                    if ($approvals->count() > 0) {
                        $shape->set('approverUserIds', $approvals->values('approver_user_id', true));
                        $uniqueUserIds = $approvals->values('approver_user_id', true);
                        $users = Manager::getService("account")->fetch("user/[" . implode(',', $uniqueUserIds) . "]/account-roles")->getCollection('data');

                        foreach ($approvals->getItemsAsArray() as $item) {
                            $transactionId = $item['transaction_id'];
                            $user = array_filter($users->getItemsAsArray(), function ($user) use ($item) {
                                return $user['id'] == $item['approver_user_id'];
                            });
                            $item['user'] = reset($user);
                            $item['meta'] = ApprovalSatisfactionHelper::resolveResponseFlags(
                                $item['meta'] ?? null,
                                $item['approval_level_workflow']['meta'] ?? null
                            );

                            $grouped[$transactionId][] = $item;
                        }
                        $result = [];
                        foreach ($grouped as $key => $values) {
                            foreach ($values as $item) {
                                $isApprovalLevelWorkflow = isset($item['approval_level_workflow']) && !empty($item['approval_level_workflow']['meta']);
                                $result[$key]['isLevel'] = false;
                                if ($isApprovalLevelWorkflow) {
                                    $result[$key]['isLevel'] = true;
                                    // Decode meta JSON
                                    $meta = json_decode($item['approval_level_workflow']['meta'], true);

                                    $sortOrder = $meta['sort_order'];

                                    // Initialize group
                                    if (!isset($result[$key]['approvals'][$sortOrder])) {
                                        $rule = 'All must approve';
                                        if ($meta['rule_type'] === 'any') {
                                            $rule = 'Anyone can approve';
                                        } elseif ($meta['rule_type'] === 'custom') {
                                            $rule = "Any {$meta['min_required']} from " . count($meta['roles']) . " must approve";
                                        }
                                        $status = $item['approval_level_workflow']['status'];
                                        if ($item['approval_level_workflow']['status'] === 'pending') {
                                            $status = 'locked';
                                        }
                                        $result[$key]['approvals'][$sortOrder] = [
                                            'level' => $sortOrder,
                                            'rule' => $rule,
                                            'status' => $status,
                                            'approvers' => []
                                        ];
                                    }

                                    $item['created_at'] = $convertToUKTime($item['created_at']);
                                    $item['updated_at'] = $convertToUKTime($item['updated_at']);

                                    // Push formatted item
                                    $result[$key]['approvals'][$sortOrder]['approvers'][] = $item;
                                } else {
                                    $result[$key]['approvals'][] = $item;
                                }
                            }
                        }
                        $shape->set('data', $result);
                    }
                },
                Generic::set("json",  function ($action) {
                    return json_encode($action->get("data"));
                })
            ]
        ],
        [
            "key" => "^ifs-projects$",
            "method" => "GET",
            "middleware" => [
                IfsProjectMiddleware::listAvailable()
            ]
        ],
        [
            "key" => "^(?<id>[0-9]+)\/ifs-project$",
            "method" => "GET",
            "middleware" => [
                IfsProjectMiddleware::linkedForProject()
            ]
        ],
    ],

    include_once("tender_recommendation/v1.php"),
    include_once("procurement_schedule_overview_v2/v1.php"),
    include_once("tender_inquiry_approval/v1.php"),
    include_once("shortlisted_subcontractor/v1.php"),
    include_once("group/v1.php")
    )
];
