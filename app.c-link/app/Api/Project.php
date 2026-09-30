<?php


namespace App\Api;

use App\Api\Client\Response\JsonResponse;
use App\Api\SupplyChain;
use App\Api\Util;
use App\core\Config;
use App\core\Request;
use App\Factory\UserFactory;
use App\Api\Account;
use App\Models\Tender as TenderModel;
use App\Models\User;
use App\Api\S3;
use App\Api\Tender;
use App\Api\Document\Validator as DocValidator;
use App\Api\Project\Validator as ProjectValidator;

use App\Api\Document;
use App\Api\Document\Category as DocCategory;
use App\Models\Document\Category as DocCategoryModel;
use App\Models\Project as ProjectModel;
use App\Api\Email\Email;
use App\Api\BoQ\BoQ as BoQApi;

class Project extends Client
{
    /**
     * @var array
     */
    protected static array $projectConstantsCache = [];

    /** Account feature driving the IFS integration */
    const IFS_FEATURE = "IFS";

    const TENDER_AWARDED_STATUS = 7;

    const TENDER_ENQUIRY_TYPE = "Enquiry";

    const TRANSACTION_STATUS_ACCEPTED = 1;

    const TRANSACTION_QUOTE_KEY = 'Quote';

    const TRANSACTION_QUOTE_ID = 1;

    const PROJECT_PUBLISH_STATUS = 1;

    const PROJECT_ARCHIVED_STATUS = 2;

    const PROJECT_IN_REVIEW_STATUS = 3;

    const SUBCONTRACTOR_DEFAULT_NAME = 'Archived Subcontractor';

    const HUBSPOT_INTEREST_KEY = 'interest___main_contractor';

    const TENDER_STATE = 1;

    const ENTITY_TYPE = "project";

    const DISMISSED_INTEREST_LABEL = 'dismissed';

    const SUBCONTRACTOR_LIST_APPROVAL_LABEL = 'SUBCONTRACTOR_LIST_APPROVAL';

    const ADDED_APPROVED_STATUS = 'Approved & Added';

    const PROJECT_V1 = 1;

    /**
     * @var array
     */
    protected static $forward_address = [];

    /**
     * @var array
     */
    protected static array $typeCache = [];

    /**
     * @var array
     */
    protected static array $historyCache = [];

    /**
     * @var array
     */
    protected static $security = [
        "methods" => [
            "getLiveTenders"  => [
                "type" => 'GET'
            ],
            "getAll"  => [
                "type" => 'GET',
                "requires_session" => true
            ],
            "addProject"  => [
                "type" => "PATCH",
                "requires_session" => true
            ],
            "createDefaultTrades" => [
                "type" => "POST",
                "requires_session" => true,
                "pre_checks" => [
                    "validateProjectOwner"
                ],
                "required_args" => [
                    "pid" => "int"
                ],
            ],
            "updateProject"  => [
                "type" => "PATCH",
                "requires_session" => true
            ],
            "deleteProject"  => [
                "type" => "DELETE",
                "requires_session" => true
            ],
            "dismissInterest" => [
                "type" => "DELETE",
                "requires_session" => true
            ],
            "registerInterest" => [
                "type" => "GET"
            ],
            "updateProjectHistory" => [
                "type" => "GET",
                "requires_session" => true
            ],
            "bulkUpdateProjectHistory" => [
                "type" => "POST",
                "requires_session" => true
            ],
            "getProjectInterests" => [
                "type" => "GET",
                "requires_session" => true
            ],
            "getTenderLog" => [
                "type" => "GET",
                "requires_session" => true,
                "required_args" => [
                    "tid" => "int",
                    "sid" => "int"
                ],
                "pre_checks" => [
                    "validateTenderOwner"
                ]
            ],
            "getProjectProcurement" => [
                "type" => "GET",
                "requires_session" => true
            ],
            "getProjectTenders" => [
                "type" => "GET",
                "requires_session" => true
            ],
            "createProjectTender" => [
                "type" => "POST",
                "requires_session" => true,
                "pre_checks" => [
                    "validateProjectOwner"
                ]
            ],
            "updateProjectTender" => [
                "type" => "PATCH",
                "requires_session" => true
            ],
            "deleteProjectTender" => [
                "type" => "DELETE",
                "requires_session" => true
            ],
            "bulkDeleteProjectTenders" => [
                "type" => "POST",
                "requires_session" => true
            ],
            "getOne" => [
                "type" => "GET",
                "requires_session" => true
            ],
            "getOneGantt" => [
                "type" => "GET",
                "requires_session" => true
            ],
            "getConstants" => [
                "type" => "GET"
            ],
            "addLogo" => [
                "type" => "POST",
                "requires_session" => true
            ],
            "addFile" => [
                "type" => "POST",
                "requires_session" => true,
                "pre_checks" => [
                    [ProjectValidator::class, "isOwner"],
                    [DocValidator::class, "uploadedDocumentPresent"]
                ]
            ],
            "createCategory" => [
                "type" => "POST",
                "requires_session" => true
            ],
            "getPackages" => [
                "type" => 'GET',
                "requires_session" => true
            ],
            "getSlugByName" => [
                "type" => 'GET',
                "requires_session" => true
            ],
            "getEnquiries" => [
                "type" => 'GET',
                "requires_session" => true,
                "pre_checks" => [
                    "validateProjectOwner"
                ],
                "required_args" => [
                    "pid" => "int",
                ]
            ],
            "toggleHistoryArchived" => [
                "type" => 'PATCH',
                "requires_session" => true,
                "pre_checks" => [
                    "validateProjectOwner"
                ],
                "required_args" => [
                    "pid" => "int",
                    "tid" => "int",
                    "sid" => "int"
                ]
            ],
            "publish" => [
                "type" => 'POST',
                "requires_session" => true,
                "pre_checks" => [
                    "validateProjectOwner"
                ],
                "required_args" => [
                    "pid" => "int"
                ]
            ],
            "archived" => [
                "type" => 'PATCH',
                "requires_session" => true,
                "pre_checks" => [
                    "validateProjectOwner"
                ],
                "required_args" => [
                    "pid" => "int"
                ]
            ],
            "restore" => [
                "type" => 'PATCH',
                "requires_session" => true,
                "pre_checks" => [
                    "validateProjectOwner"
                ],
                "required_args" => [
                    "pid" => "int"
                ]
            ],
            "getPackageDependency" => [
                "type" => 'GET',
                "requires_session" => true,
                "pre_checks" => [
                    "validateProjectOwner"
                ],
                "required_args" => [
                    "pid" => "int",
                ]
            ],
            "getTeam" => [
                "type" => 'GET',
                "requires_session" => true,
                "pre_checks" => [
                    "validateProjectOwner"
                ],
                "required_args" => [
                    "pid" => "int",
                ]
            ],
            "updateTeamMember" => [
                "type" => 'PATCH',
                "requires_session" => true,
                "pre_checks" => [
                    "validateProjectOwner"
                ],
                "required_args" => [
                    "pid" => "int",
                ]
            ],
            "removeTeamMember" => [
                "type" => 'DELETE',
                "requires_session" => true,
                "pre_checks" => [
                    "validateProjectOwner"
                ],
                "required_args" => [
                    "pid" => "int",
                    "id"  => "int"
                ]
            ],
            "getActions" => [
                "type" => 'GET',
                "requires_session" => true,
            ],
            "updateActions" => [
                "type" => 'POST',
                "requires_session" => true,
            ],
        ]
    ];

    /**
     * @param string $k
     * @return false|string
     */
    public static function getForwardingAddress(string $k)
    {
        if (isset(self::$forward_address[$k])) {
            return baseUrl() . self::$forward_address[$k];
        }
        return false;
    }

    /**
     * @return array|\array[][]
     */
    public static function getSecurity()
    {
        return self::$security;
    }

    /**
     * @param string $step
     * @param string $url
     */
    public static function setForwardingAddress($step, $url)
    {
        self::$forward_address[$step] = $url;
    }

    /**
     * @param Request $request
     * @throws Exception
     */
    public static function getAll(Request $request, User $user): jsonResponse
    {
        $aid = $user->getAccountId();
        try {
            $params = [
                "group_id" => $aid
            ];

            $type_id = $request->query("type_id") ?? null;
            $query = $request->query("query") ?? "";

            if( $type_id ) {
                $params["type"] = $type_id;
            }

            if( $query ) {
                $params["query"] = $query;
            }

            $features = Account::get("feature/accounts/$aid");
            //Check if the account has ACL Project feature flag is enabled for the account
            $acl_enabled = (bool) array_filter(
                $features,
                fn($f) => strcasecmp($f['feature'], 'acl_project_list') === 0
            );

            if ($acl_enabled) {
                $userType = (string)($user->getData("type"));
                if ($userType === "team_manager") {
                    //If a team manager, only show projects that they have created and projects where they are part of the project team
                    $params["author_id"] = (int)$user->getId();
                    $params["project_team_members"] = "[" . (int)$user->getId() . "]";
                } elseif ($userType === "team_assistant") {
                    //If a team_assistant, only show projects if the user is part of the project team
                    //Project service expects array params to be string
                    $params["project_team_members"] = "[" . (int)$user->getId() . "]";
                }
            }

            $projects = self::get("project", $params);
            return self::jsonResponse($projects);
        } catch (\Exception $e) {
            return self::jsonResponse(["error" => "Api Failure"]);
        }
    }

    /**
     * Attaches the account_service group ids mapped to a project onto its
     * "groups" key, in-place. Failures are swallowed so this enrichment never
     * breaks the underlying project read.
     *
     * @param array $project
     * @param int $aid The account the project (and its groups) belong to
     */
    private static function attachGroupDetails(array &$project, int $aid): void
    {
        $project['groups'] = [];

        if (empty($project['id']) || empty($aid)) {
            return;
        }

        try {
            $mappings = self::get("project/{$project['id']}/account-group-mapping");
            if (empty($mappings)) {
                return;
            }

            $project['groups'] = array_map('intval', array_column($mappings, 'account_group_id'));
        } catch (\Exception $e) {
            error_log("Failed to attach group details for project {$project['id']}: " . $e->getMessage());
        }
    }

    /**
     * @param Request $request
     * @param User $user
     * @return JsonResponse
     */
    public static function getOneGantt(Request $request, User $user)
    {
        $query_value = $request->getQueryValue("slug") ?? $request->getQueryValue("id");
        $isFileManager = $request->getQueryValue("isFileManager");
        try {
            $project = self::ownsProject($user, $query_value);
            $history = self::get(sprintf("project/%s/tender/history", $project['id']));
            if ($history) {
                $history = array_shift($history);
                $ignore_statuses = Tender::getHistoryTypes()->filterByExistInArray("uid", ["dismissed", "deleted", "added"], false);
                self::updateProjectTenderFirstEnquirySentDate($project, $history['tender'], $ignore_statuses->getValues("id"));
            }
            if ($isFileManager) {
                self::updateProjectTenderForFileManager($project);
            }
            self::attachGroupDetails($project, (int) ($project['group_id'] ?? 0));
        } catch (\Exception $e) {
            return self::jsonResponse(["error" => $e->getMessage()]);
        }

        return self::jsonResponse($project);
    }

    /**
     * @param Request $request
     * @param User $user
     * @return JsonResponse
     */
    public static function getOne(Request $request, User $user)
    {

        $query_value = $request->getQueryValue("slug") ?? $request->getQueryValue("id");
        $state       = $request->getQueryValue("state") ?? false;
        try {
            $project = self::ownsProject($user, $query_value);
            //If we have a state flag, then filter the tenders by that state
            if ($state) {
                $tenders = [];
                foreach ($project["tender"] as $tender) {
                    if ((int) $tender["state"] < (int) $state) {
                        continue;
                    }
                    $tenders[] = $tender;
                }
                $project["tender"] = $tenders;
            }
            self::attachGroupDetails($project, (int) ($project['group_id'] ?? 0));
        } catch (\Exception $e) {
            return self::jsonResponse(["error" => $e->getMessage()]);
        }

        return self::jsonResponse($project);
    }

    /**
     * @param array $tenders
     * @param string $type
     * @return array|mixed
     * @throws Exception
     */
    public static function getAccountsFromTenderHistoryByType(array $tenders, string $type)
    {
        $ids = [];
        foreach ($tenders as $tender) {
            $items = $tender[$type] ?? [];
            foreach (array_keys($items) as $id) {
                $ids[$id] = 0;
            }
        }

        return ($ids) ? Account::getAccounts(array_keys($ids)) : [];
    }

    /**
     * Aggregate multilevel approval status for a tender enquiry document.
     * Priority: Rejected > Pending Approval > Approved.
     *
     * @param array $docApprovals
     * @return string
     */
    public static function buildEnquiryApprovalInfo(array $docApprovals): string
    {
        $hasRejected = false;
        $hasPending = false;

        foreach ($docApprovals as $approval) {
            $label = $approval['status']['label'] ?? '';
            if ($label === 'Rejected') {
                $hasRejected = true;
            } elseif ($label === 'Pending') {
                $hasPending = true;
            }
        }

        if ($hasRejected) {
            return 'Rejected';
        }
        if ($hasPending) {
            return 'Pending Approval';
        }

        return 'Approved';
    }

    /**
     * @param int $pid
     * @param string $type
     * @return array
     * @throws Exception
     */
    public static function tenderReport(int $pid, string $type): array
    {
        $report = [
            "tenders" => [],
            "subs" => []
        ];
        // Get current user account id
        $userAccountId = UserFactory::getUser()->getData()['account_id'];

        $data = self::get(
            "project/$pid/tender/history",
            ["tender_history_type" => $type]
        );

        $defaultSub = ['name' => self::SUBCONTRACTOR_DEFAULT_NAME, "type_id" => 4];
        if ($data) {
            $tenders = $data[$pid]["tender"];
            $accounts = self::getAccountsFromTenderHistoryByType($tenders, $type);

            // Get all subcontractor IDs
            $sids = array_keys($accounts);

            // Fetch accounts with their users
            $accountsWithUsers = ($sids) ? Account::getAccountsWithUsers($sids) : [];

            $categories = DocCategory::get("category", [
                "parent_id"   => $pid,
                "entity_type" => "tender_template"
            ]);

            // Optimization: Pre-collect all relevant document IDs for batching approvals
            $docIds = [];
            foreach ($categories as $category) {
                // Fix if the document is created as a draft it fill also be shown in unified tenders page
                $catTid = $category["entity_id"];
                if (!isset($tenders[$catTid])) {
                    $tenders[$catTid] = [
                        "label" => $category["label"] ?? "Work Package #{$catTid}", // Category actual name
                        $type   => []
                    ];
                }
                foreach ($category["documents"] as $doc) {
                    $docIds[] = $doc["id"];
                }
            }

            $emailLogsMap = [];
            if (!empty($docIds) && !empty($sids)) {
                try {
                    $emailLogData = Account::get("email/logs-by-entity-account", [
                        "entity_type"    => 'Enquiry Sent',
                        "enquiry_ids"    => implode(',', $docIds),
                        "account_ids"    => implode(',', $sids),
                        "include_status" => true
                    ]);

                    if (!empty($emailLogData)) {
                        $emailLogsMap = $emailLogData;
                    }
                } catch (\Exception $e) {
                    error_log("Failed to fetch bulk email logs: " . $e->getMessage());
                }
            }

            // Batch fetch approvals for all collected document IDs
            $approvals = [];
            if (!empty($docIds)) {
                try {
                    $res = self::get("approvals/fetchEntitiesByIds", [
                        "entity_type" => 'document',
                        "entity_ids" => $docIds
                    ]);
                    if ($res) {
                        // Group by entity_id — multilevel TI can have many rows per document
                        foreach ($res as $approval) {
                            $entityId = (int) ($approval['entity_id'] ?? 0);
                            if ($entityId <= 0) {
                                continue;
                            }
                            $approvals[$entityId][] = $approval;
                        }
                    }
                } catch (\Exception $e) {
                    // Log or handle API failure; proceed with empty approvals to avoid breaking the report
                    error_log("Failed to fetch approvals: " . $e->getMessage());
                }
            }

            $features = Account::get(sprintf('feature/accounts/%s', $userAccountId));
            // Check feature enabled
            $isSubcontractorListApprovalFeature = in_array(
                self::SUBCONTRACTOR_LIST_APPROVAL_LABEL,
                array_column($features ?? [], 'feature')
            );

            foreach ($tenders as $tid => $tender) {
                // Shortlisted sub contractors response used later on
                $shortlistedResponse = self::get(
                    "project/{$pid}/tender/{$tid}/shortlisted-subcontractors"
                ) ?: [];
                $report["tenders"][$tid] = [
                    "label"    =>  $tender["label"],
                    "templates" => [],
                    "enquries" => [],
                    "subcontractors" => []
                ];

                foreach ($categories as $category) {
                    foreach ($category["documents"] as $doc) {
                        if ($category["entity_id"] == $tid) {
                            $approval_status = null;
                            $docApprovals = $approvals[(int) $doc["id"]] ?? [];
                            if ($docApprovals) {
                                $approval_status = self::buildEnquiryApprovalInfo($docApprovals);
                            }

                            // Find which subcontractors this document was sent to
                            $sent_to_subs = [];
                            $sent_date = '-';
                            $final_status = '-';

                            $emailStatus = '-';
                            $emailSentTo = [];

                            foreach ($tender[$type] as $sid => $enquiry) {
                                $mapKey = "{$doc['id']}_{$sid}";
                                if (isset($emailLogsMap[$mapKey])) {
                                    $emailStatus = $emailLogsMap[$mapKey]['final_status'] ?? 'Failed';
                                    $emailSentTo = $emailLogsMap[$mapKey]['email_sent_to'] ?? [];
                                }

                                foreach ($enquiry['history'] as $item) {
                                    $meta = json_decode($item['meta'], true);
                                    // Check if document array exists and has this subcontractor's entry
                                    if ($meta && isset($meta['document']) && is_array($meta['document'])) {
                                        // Match the document ID
                                        if ($meta['enquiry'] == $doc["id"]) {
                                            $subcontractor_info = $accounts[$sid] ?? $defaultSub;

                                            $entityId = $meta['document'][$sid]['id'] ?? null;

                                            $emailSentDate = null;
                                            $emailFromLog = null;
                                            foreach ($emailSentTo as $emailLog) {
                                                if (
                                                    $entityId &&
                                                    isset($emailLog['meta']['entity_id']) &&
                                                    (int)$emailLog['meta']['entity_id'] === (int)$entityId
                                                ) {
                                                    // Latest sent_date
                                                    if ($emailSentDate === null || strtotime($emailLog['sent_date']) > strtotime($emailSentDate)) {
                                                        $emailSentDate = $emailLog['sent_date'] ?? null;
                                                        $emailFromLog  = $emailLog['email'] ?? null;
                                                    }
                                                }
                                            }

                                            $sent_to_subs[] = [
                                                'id'        => $sid,
                                                'name'      => $subcontractor_info['name'],
                                                'email'     => $meta['email_sent_to'] ?? $emailFromLog,
                                                'sent_date' => $emailSentDate
                                            ];
                                            if (isset($item['created_at'])) {
                                                $sent_date = $item['created_at'];
                                            }
                                        }
                                    }
                                }
                            }

                            if ($sent_date !== '-') {
                                // Document send
                                $final_status = "Sent";
                            } elseif ($approval_status) {
                                // Approval in process
                                $final_status = $approval_status;
                            } else {
                                // Approval not started
                                $final_status = $doc["status"] == 0 ? "Draft" : "Published";
                            }


                            $logs = self::get(
                                "logs",
                                [
                                    "entity_type" => 'document',
                                    "entity_id"   => $doc["id"]
                                ]
                            );

                            $templateId = (int) ($doc['id'] ?? 0); // added this one to avoid repetition:
                            $report["tenders"][$tid]["templates"][$doc["id"]] = [
                                "id"                     => $templateId,
                                "name"                   => $doc["name"] ?? '',
                                "status"                 => $doc["status"] ?? '',
                                "created_at"             => $doc["created_at"] ?? null,
                                "final_status"           => $final_status,
                                "email_status"           => $emailStatus,
                                "email_sent_to"          => $emailSentTo,
                                "sent_date"              => $sent_date,
                                "history"                => $logs,
                                "sent_to_subcontractors" => empty($sent_to_subs) ? '-' : $sent_to_subs,
                                "can_send_tender"        => self::canSendTender(
                                                                $isSubcontractorListApprovalFeature,
                                                                $shortlistedResponse,
                                                                $tender[$type]
                                                            ) // function to check the cases and responses as required
                            ];
                        }
                    }
                }

                foreach ($tender[$type] as $sid => $enquiry) {
                    foreach ($enquiry['history'] as &$item) {
                        $meta = json_decode($item['meta'], true);
                        if (isset($accounts[$sid], $meta['email_sent_to'])) {
                            $item['sent_to']  = $meta['email_sent_to'];
                        }
                        if ($meta) {
                            //@TODO clean up the database table tender_history meta column that have their s3 key document in
                            $item['document_id'] = $meta['document'][$sid]['id'] ?? 0;
                        }
                    }
                    unset($item);

                    // Add subcontractor with users to THIS tender's subcontractors array
                    if (!isset($report["tenders"][$tid]["subcontractors"][$sid])) {
                        $accountData = $accountsWithUsers[$sid] ?? $accounts[$sid] ?? $defaultSub;

                        // Extract users if available
                        $users = [];
                        if (isset($accountData['users']) && is_array($accountData['users'])) {
                            $token = app()->Cookie->getCookie('token');
                            $supply_chain_users = Api::get("account/supply-chain/$sid/users", [], ['Authorization' => "Bearer $token"]);
                            $users = $supply_chain_users;
                        }

                        $report["tenders"][$tid]["subcontractors"][$sid] = [
                            'id' => $sid,
                            'name' => $accountData['name'] ?? $defaultSub['name'],
                            'type_id' => $accountData['type_id'] ?? $defaultSub['type_id'],
                            'email' => $accountData['email'] ?? '',
                            'users' => $users
                        ];
                    }

                    // Also keep in global subs for backward compatibility
                    if (!isset($report["subs"][$sid])) {
                        $accountData = $accountsWithUsers[$sid] ?? $accounts[$sid] ?? $defaultSub;

                        // Extract users if available
                        $users = [];
                        if (isset($accountData['users']) && is_array($accountData['users'])) {
                            foreach ($accountData['users'] as $user) {
                                $users[] = [
                                    'id' => $user['id'] ?? null,
                                    'firstname' => $user['firstname'] ?? '',
                                    'lastname' => $user['lastname'] ?? '',
                                    'email' => $user['email'] ?? '',
                                    'job_title' => $user['job_title'] ?? '',
                                    'mobile' => $user['mobile'] ?? ''
                                ];
                            }
                        }

                        $report["subs"][$sid] = [
                            'name' => $accountData['name'] ?? $defaultSub['name'],
                            'type_id' => $accountData['type_id'] ?? $defaultSub['type_id'],
                            'email' => $accountData['email'] ?? '',
                            'users' => $users
                        ];
                    }
                    $report["tenders"][$tid]["enquries"][$sid] = $enquiry;
                }
            }
        }

        if ($report["tenders"] === []) {
            $report["tenders"] = new \stdClass();
        }
        if ($report["subs"] === []) {
            $report["subs"] = new \stdClass();
        }

        return $report;
    }

    /**
     * @param Request $request
     * @param User $user
     * @param array $args
     * @return JsonResponse
     * @throws Exception
     */
    public static function getEnquiries(Request $request, User $user, array $args): jsonResponse
    {
        return self::jsonResponse(self::tenderReport($args["pid"], self::TENDER_ENQUIRY_TYPE));
    }

    /**
     * @param int $accountId
     * @param string $feature
     * @return bool
     */
    protected static function hasFeature(int $accountId, string $feature): bool
    {
        try {
            $features = Account::get("feature/accounts/{$accountId}");
        } catch (\Exception $e) {
            return false;
        }

        foreach (is_array($features) ? $features : [] as $row) {
            if (strcasecmp((string) ($row['feature'] ?? ''), $feature) === 0) {
                return true;
            }
        }

        return false;
    }

    /**
     * @param Request $request
     * @param User $user
     * @return JsonResponse
     */
    public static function addProject(Request $request, User $user)
    {
        $data = $request->getJson();
        if (!$data) {
            return self::jsonResponse(["error" => "bad_request"]);
        }
        $aid = $user->getAccountId();
        $data["group_id"] = $aid;
        $data["author_id"] = $user->getId();

        $groupIds = null;
        if (array_key_exists('account_group_id', $data)) {
            $groupIds = $data['account_group_id'];
            unset($data['account_group_id']);
        }
        /*
         * The browser may only nominate a catalogue record id; which records
         * this account may link is resolved here
         */
        $catalogueId = (int) ($data['partner_project_catalogue_id'] ?? 0);
        if ($catalogueId > 0 && self::hasFeature($aid, self::IFS_FEATURE)) {
            try {
                $mappings = Account::get("api_client/business_unit/account/{$aid}");
            } catch (\Exception $e) {
                return self::jsonResponse(["error" => "Failed to resolve IFS business units"]);
            }

            $mappingIds = [];
            foreach (is_array($mappings) ? $mappings : [] as $mapping) {
                $mappingIds[] = (int) ($mapping['id'] ?? 0);
            }
            $mappingIds = array_values(array_filter($mappingIds));

            if (!$mappingIds) {
                return self::jsonResponse(["error" => "This account has no active IFS business units"]);
            }

            $data['authorised_business_unit_mapping_ids'] = $mappingIds;
        } else {
            unset($data['partner_project_catalogue_id']);
        }

        // Resolve Asite provider_id only when integration data is provided
        $hasIntegration = isset($data['integration_id']) || isset($data['integration_name']) || isset($data['integration_uri']);
        if ($hasIntegration) {
            try {
                $providerData = Account::get("account/{$aid}/provider/asite");
                $providerId = (int)($providerData['provider_id'] ?? 0);
                if ($providerId) {
                    $data['provider_id'] = $providerId;
                }
            } catch (\Exception $e) {
                return self::jsonResponse(["error" => "Failed to get provider Id"]);
            }
        }

        $res = self::post("project", $data);
        if ($res->getStatus() === 200) {
            $project = $res->json();
            $pid = isset($project['data']['id']) ? (int) $project['data']['id'] : null;
            /*
             * Create the default categories for the project
             */
            if ($pid) {
                //Create the Default set of categories
                DocCategory::createDefaults(
                    $pid,
                    self::ENTITY_TYPE,
                    [
                        'all_project_inc' => true
                    ]
                );

                if ($groupIds !== null) {
                    $syncResult = self::syncAccountGroupMapping($aid, $pid, $groupIds, false);
                    if (is_string($syncResult)) {
                        return self::jsonResponse(["error" => $syncResult]);
                    }
                }

                return self::jsonResponse($project["data"]);
            }

            if (!$pid && isset($project["data"]["status"]) && !$project["data"]["status"]) {
                $error = isset($project["data"]["error"]) ? $project["data"]["error"] : "Api Failure";
                return self::jsonResponse(["error" => $error]);
            }
        }
        return self::jsonResponse(["error" => "Api Failure"]);
    }

    /**
     * @param Request $request
     * @param User $user
     * @return JsonResponse
     */
    public static function createDefaultTrades(Request $request, User $user, $args): jsonResponse
    {

        //if the user has a whitelist of trades we WILL NOT create any default trades
        if ($user->getAccountMetaKey(Account::WHITELIST_META_TRADE)) {
            return self::jsonResponse(["success" => true]);
        }

        $data = $request->getJson();
        $pid = $args["pid"];
        $type = $data["type"];

        $packages = Account::getPackages();
        $trades = Account::get('trade_group/' . $type);
        $minumumTrades = [];
        foreach ($trades as $trade) {
            $minumumTrades[] = (int) $trade["trade_id"];
        }

        $newTrades = self::getTrades($packages, $minumumTrades);
        foreach ($newTrades as $trade) {
            //Patch for bug with change of response format from trades endpoint, info found here: https://c-link.atlassian.net/browse/CLP-2435
            if (isset($trade["send_date"])) {
                unset($trade["send_date"]);
            }
            self::post(
                "project/" . $pid . '/tender',
                $trade
            );
        }

        return self::jsonResponse(["success" => true]);
    }

    /**
     * @param Request $request
     * @param User $user
     * @return JsonResponse
     */
    public static function getProjectTenders(Request $request, User $user): jsonResponse
    {
        $pid = $request->getQueryValue("id");
        if (!$pid) {
            return self::jsonResponse(["error" => "bad_request"]);
        }

        try {
            self::ownsProject($user, $pid);
            $packages_groups = [];
            $packages = Account::getPackages();

            if (is_array($packages)) {
                foreach ($packages as $package) {
                    if (isset($package['trades']) && is_array($package['trades'])) {
                        foreach ($package['trades'] as $trade) {
                            $packages_groups[$trade] = $package['label'];
                        }
                    }
                }
            }

            $tenders = self::get("project/" . $pid . "/tender");

            $group_tenders = [
                'groups' => [],
                'custom_tenders' => [],
            ];
            foreach ($tenders as $key => $tender) {
                if ($tender['is_custom']) {
                    $group_tenders['custom_tenders'][$key] = $tender;
                } else {
                    $label = $packages_groups[$tender['label']];
                    $group_tenders['groups'][$label]['label'] = $label;
                    $group_tenders['groups'][$label]['tenders'][$key] = $tender;
                }
            }
            if (isset($group_tenders['custom_tenders'])) {
                ksort($group_tenders['custom_tenders']);
                $group_tenders['custom_tenders'] = array_values($group_tenders['custom_tenders']);
            }
            if (isset($group_tenders['groups'])) {
                ksort($group_tenders['groups']);
                $group_tenders['groups'] = array_values($group_tenders['groups']);
            }
        } catch (\Exception $e) {
            return self::jsonResponse(["error" => $e->getMessage()]);
        }

        return self::jsonResponse($group_tenders);
    }

    /**
     * @param Request $request
     * @return JsonResponse
     * @throws \Exception
     */
    public static function createProjectTender(Request $request, User $user, array $args)
    {
        $data    = $request->getRequiredJson();
        $project = $args["project"];

        //Check if the added trade is part of the whitelist trades
        if ($user->getAccountMetaKey(Account::WHITELIST_META_TRADE)) {
            //get whitelist trades
            if ($trades_whitelist = Account::get("account/" . $user->getAccountId() . "/trades")) {
                $trades = [];
                foreach ($data['packages'] as $package) {
                    $trades[] = ['id' => $package];
                }
                $data['packages'] = array_map(function ($item) {
                    return $item['id'];
                }, self::filterTradesByWhitelist($trades, $trades_whitelist));
            }
            if (empty($data['packages'])) {
                return self::jsonResponse(["success" => true, 'id' => null]);
            }
        }


        $res = self::post(
            "project/" . $project["id"] . '/tender',
            $data
        );

        $json = $res->json();
        $tid = $json["data"]['id'] ?? null;

        $success = !is_null($tid);
        $isSuggestion = $data["was_suggestion"] ?? false;
        if ($success) {
            // Normally we add the default cats when a tender is changed from suggestion to draft, but as
            // custom tenders start as draft we need to do that here, also we need the default cats for a suggestion from
            // File analyser to assign the files to as per the A/C. This needs to be refactored really...
            if ($data["is_custom"] || !$isSuggestion) {
                DocCategory::createDefaults(
                    $tid,
                    Tender::ENTITY_TYPE,
                    [
                        'parent_id' => $project["id"],
                        'inherit_parent' => true
                    ]
                );
                /*
                 * Assing documents based on categories custom rules
                */
                $tender = new TenderModel($data, $tid);
                $tender->setData('project_id', $project["id"]);
                DocCategory::assignDocumentsByTenderRules($tender);

                // CREATE DEFAULT MILESTONES
                if (($data["is_custom"] || $data["is_state"]) && $project['version'] > self::PROJECT_V1) {
                    $accountMilestones = self::get("milestones/accounts/" . $user->getAccountId());
                    $milestoneStatuses = self::get("milestones/statuses");
                    // Get 'Not Started' status id
                    $pendingStatus = array_filter($milestoneStatuses, fn($item) => $item['label'] === 'Not Started');
                    $pendingStatusId = array_shift($pendingStatus)['id'] ?? null;
                    $packageMilestoneData = [];
                    foreach ($accountMilestones as $milestone) {
                        $packageMilestoneData[] = [
                            'account_milestone_mapping_id'  => $milestone['id'],
                            'package_id'                    => $tid,
                            'sort_order'                    => $milestone['sort_order'],
                            'package_milestone_status_id'   => $pendingStatusId,
                            'lead_time'                     => $milestone['lead_time']
                        ];
                    }
                    self::post("milestones/package-milestones", $packageMilestoneData);
                }
            }
        } else {
            if ($isSuggestion) {
                /*
                 * If the suggestions was already being found from file analyser we need to just return the existing tender id
                 */
                $tender = self::get("project/" . $project["id"] . "/tender?label=" . urlencode($data['label']));
                if ($tender) {
                    $tender = array_shift($tender);
                    $tid = $tender['id'] ?? null;
                    $success = !is_null($tid);
                }
            }
        }

        return self::jsonResponse(["success" => $success, 'id' => $tid]);
    }

    /**
     * @param Request $request
     * @return JsonResponse
     * @throws \Exception
     * Note: Deprecated by App/Api/Tender::update
     */
    public static function updateProjectTender(Request $request, User $user)
    {
        $pid = (int) $request->getQueryValue("id");
        $tid = (int) $request->getQueryValue("tid");

        $data = $request->getRequiredJson();

        try {
            self::ownsProject($user, $pid);

            $res = self::patch(
                "project/" . $pid . '/tender/' . $tid,
                $data
            );

            if ($res->getStatus() === 203) {
                return self::jsonResponse(["success" => true]);
            }

            return self::jsonResponse(["success" => false]);
        } catch (\Exception $e) {
            return self::jsonResponse(["error" => $e->getMessage()]);
        }
    }

    /**
     * Validation Method to be used in pre checks
     * @param Request $request
     * @param User $user
     * @throws \Exception
     */
    public static function validateProjectOwner(Request $request, User $user, array &$args)
    {

        $pid = (int) $request->getQueryValue("pid");
        if (!$pid) {
            throw new \Exception("Bad Request: Missing arguments");
        }

        $args["project"] = self::ownsProject($user, $pid);
    }

    /**
     * @param Request $request
     * @param User $user
     * @param array $args
     * @throws Exception
     */
    public static function validateTenderOwner(Request $request, User $user, array &$args)
    {
        $tid = $args["tid"] ?? false;
        if (!$tid) {
            throw new \Exception("No Tender Id Supplied");
        }
        $data = self::get("tender/$tid");
        $tender = new TenderModel($data[$tid], $tid);
        self::ownsProject($user, $tender->getData("project_id"));
    }

    /**
     * @param Request $request
     * @param User $user
     * @return JsonResponse
     * Note: Deprecated by App/Api/Tender::remove
     */
    public static function deleteProjectTender(Request $request, User $user)
    {
        $pid = (int) $request->getQueryValue("id");
        $tid = (int) $request->getQueryValue("tid");

        try {
            self::ownsProject($user, $pid);
            $res = self::delete("project/" . $pid . '/tender/' . $tid);
            if (!$res->getStatus() === 203) {
                throw new \Exception("Api Failure");
            }
        } catch (\Exception $e) {
            return self::jsonResponse(["error" => $e->getMessage()]);
        }
    }

    /**
     * @param Request $request
     * @param User $user
     * @throws Exception
     */
    public static function bulkDeleteProjectTenders(Request $request, User $user): JsonResponse
    {
        $pid = (int) $request->getQueryValue("pid");

        $data = $request->getJson();

        if (!isset($data['tenders']) || !is_array($data['tenders'])) {
            throw new \Exception("No tender provided");
        }

        try {
            self::ownsProject($user, $pid);

            foreach ($data['tenders'] as $tender) {
                self::delete("project/" . $pid . '/tender/' . $tender);
            }

            return self::jsonResponse(["success" => true]);
        } catch (\Exception $e) {
            return self::jsonResponse(["success" => false, "error" => $e->getMessage()]);
        }
    }

    /**
     * Validates account_group_id(s) against the caller's account, then syncs the
     * account_group_project_mapping table for a project.
     *
     * @param int $aid
     * @param int|string $pid
     * @param mixed $groupIds
     * @param bool $replaceExisting When true, existing mappings for the project are deleted before the new ones are created
     * @return array|string Array of valid group ids on success, or an error message string on validation failure
     */
    private static function syncAccountGroupMapping(int $aid, $pid, $groupIds, bool $replaceExisting = true)
    {
        if (!is_array($groupIds)) {
            $groupIds = [$groupIds];
        }

        $validGroupIds = [];
        foreach ($groupIds as $groupId) {
            $groupId = (int) $groupId;

            if (empty($groupId)) {
                continue;
            }

            $group = Account::get("account/{$aid}/group/{$groupId}");
            if (isset($group['data'])) {
                $group = $group['data'];
            }

            if (empty($group) || (int)$group['account_id'] !== (int)$aid) {
                return "Invalid account_group_id: {$groupId} for this account";
            }

            $validGroupIds[] = $groupId;
        }

        if (!empty($validGroupIds)) {
            if ($replaceExisting) {
                // Bulk Deletion By Project Id
                self::delete("project/{$pid}/account-group-mapping");
            }

            self::post("project/{$pid}/account-group-mapping", [
                "account_group_id" => $validGroupIds
            ]);
        }

        return $validGroupIds;
    }

    /**
     * @param Request $request
     * @param User $user
     */
    public static function updateProject(Request $request, User $user)
    {
        $pid = $request->getQueryValue("pid");
        $aid = $user->getAccountId();
        try {
            $project = self::get("project", ["group_id" => $aid, "id" => $pid]);
            if (!$project) {
                return self::jsonResponse(["error" => "Project Not Found"]);
            }

            $data = $request->getRequiredJson();
            if (isset($data['name']) && $data['name'] !== $project[0]["name"]) {
                $slug = self::get("project/slug/" . urlencode($data['name']));
                //If the project name has changed, then we need to validate the slug is unique
                $projectCheck = self::get("project", ["slug" => $slug]);
                if (count($projectCheck) !== 0) {
                    return self::jsonResponse(["error" => "Project name already exists"]);
                }

                $data['slug'] = $slug;
            }

            // Handle Account Group Project Mapping
            if (array_key_exists('account_group_id', $data)) {
                $syncResult = self::syncAccountGroupMapping($aid, $pid, $data['account_group_id']);
                if (is_string($syncResult)) {
                    return self::jsonResponse(["error" => $syncResult]);
                }

                unset($data['account_group_id']);
            }

            $res = self::patch("project/" . $pid, $data);
            if (!$res->getStatus() === 203) {
                throw new \Exception("Api Failure");
            }

            return self::jsonResponse(["success" => true]);
        } catch (\Exception $e) {
            error_log("Failed to update project $pid : " . $e->getMessage());
            return self::jsonResponse(["error" => "Api Failure"]);
        }
    }

    /**
     * @param Request $request
     * @param User $user
     */
    public static function deleteProject(Request $request, ?User $user = null)
    {
        $pid = $request->getQueryValue("pid");
        $aid = $aid = $user->getAccountId();
        try {
            $project = self::get("project", ["group_id" => $aid, "id" => $pid]);
            if (!$project) {
                return self::jsonResponse(["error" => "Project Not Found"]);
            }
            $res = self::delete("project/" . $pid);
            if (!$res->getStatus() === 203) {
                throw new \Exception("Api Failure");
            }
            return self::jsonResponse(["success" => true]);
        } catch (\Exception $e) {
            return self::jsonResponse(["error" => "Api Failure"]);
        }
    }

    /**
     * @param User $user
     * @param $pid
     * @return array
     * @throws \Exception
     */
    public static function ownsProject(User $user, $pid)
    {

        if (is_numeric($pid)) {
            $project = self::getProject($pid);
        } else {
            $project = self::getProjectBySlug($pid);
        }

        if (!$project) {
            throw new \Exception("Invalid Project Id", 400);
        }

        $ids = $user->getUserIds();
        if (!in_array($project['group_id'], $ids)) {
            throw new \Exception("You don't have access to this project.", 403);
        }

        return $project;
    }

    /**
     * @param int $pid
     * @param int $tid
     * @param string $email
     * @return array
     * @throws Exception
     */
    public static function hasTenderConnection(int $pid, int $tid, string $email): array
    {
        $allowed      = false;
        $projectModel = self::getProject($pid);
        $aid          = $projectModel['group_id'];
        $aids[]       = $aid;
        $data        = Tender::get("tender/$tid");
        $tenderModel = new TenderModel($data[$tid], (string)$tid);
        //get all the subcontractor aids that are part of the tender history
        foreach (['Enquiry', 'Order'] as $type) {
            $aids = [...$aids, ...array_keys($data[$tid][$type] ?? [])];
        }

        // Check if the email is related to the main contractor supply chain
        $supplyChain             = Account::get("account/$aid/supply_chain_v2");
        $supplyChainAccounts     = Account::getAccounts(array_column($supplyChain, 'child_id'));
        $supplyChainAccountsMeta = array_column($supplyChainAccounts, 'meta');

        $user_name = "";
        foreach ($supplyChainAccountsMeta as $meta) {
            $meta = json_decode($meta, true);
            if (isset($meta[$aid]) && $meta[$aid]['email'] === $email) {
                $user_name = $meta[$aid]['user']['firstname'];
                $allowed = true;
                break;
            }
        }

        // If not found in supply chain search for user or account email
        if (!$allowed) {
            $users     = Account::get("user",    ["email" => $email]);
            $accounts  = Account::get("account", ["email" => $email]);
            $all_users = $users + $accounts;
            $found_email = count($all_users);
            if ($found_email) {
                foreach ($all_users as $user) {
                    $key = array_search($user['account_id'] ?? $user['id'], $aids);
                    if ($key !== false) {
                        $allowed = true;
                        $user_name = $all_users[$key]['firstname'] ?? $all_users[$key]['name'];
                        break;
                    }
                }
            }
        }

        return [
            "allowed"   => $allowed,
            "user_name" => $user_name
        ];
    }

    /**
     * @param Request $request
     * @param string $type
     * @param string $status
     * @param int|null $uid
     * @param array $meta
     * @return JsonResponse
     */
    public static function addHistory(Request $request, string $type, string $status, ?int $uid = null, array $meta = [])
    {
        $pid = (int) $request->getQueryValue("pid");
        $tid = (int) $request->getQueryValue("tid");
        $sid = (int) $request->getQueryValue("sid");
        if ($pid && $tid && $sid) {
            try {
                $response = self::post("project/$pid/tender/$tid/history", [
                    "specialist_id" => $sid,
                    "tender_history_type" => $type,
                    "author_id" => $uid,
                    "status_id" => self::getTenderHistoryTypeId($status),
                    "meta" => $meta
                ]);

                if (!$response->isSuccess()) {
                    throw new \Exception("Api Error");
                }

                if ($type === "Interest" && $status === "accepted") {
                    $project = self::getProject($pid);
                    SupplyChain::mapInfo(
                        (int) $project["group_id"],
                        (int) $sid,
                        ["trade", "region"],
                        [
                            "trades"  => self::getTenderTrades($pid, $tid),
                            "regions" => [$project["region"]],
                        ],
                        true
                    );
                }

                return self::jsonResponse(["success" => true]);
            } catch (\Exception $e) {
                return self::jsonResponse(["error" => $e->getMessage()]);
            }
        }
        return self::jsonResponse(["error" => "Project Not Found"]);
    }

    /**
     * @param int $pid
     * @param int $tid
     * @return mixed
     * @throws Exception
     * Note: Deprecated by App/Api/Tender::fetch
     */
    public static function getTender(int $pid, int $tid)
    {
        $response = self::get("project/$pid/tender/$tid");
        if ($response) {
            return $response[0];
        }
    }

    /**
     * @param int $pid
     * @param int $tid
     * @return array
     * Note: Deprecated by App/Models/Tender::tradeIds
     */
    public static function getTenderTrades(int $pid, int $tid): array
    {
        $tender = self::getTender($pid, $tid);
        $trades = [];
        if ($tender) {
            foreach ($tender["packages"] as $trade) {
                $trades[] = $trade["package_id"];
            }
        }
        return $trades;
    }

    /**
     * @param Request $request
     * @return JsonResponse|bool
     * @throws \Exception
     */
    public static function dismissInterest(Request $request, User $user)
    {
        return self::addHistory(
            $request,
            "Interest",
            "dismissed",
            $user->getId()
        );
    }

    /**
     * @param Request $request
     */
    public static function registerInterest(Request $request)
    {
        $history = self::addHistory(
            $request,
            "Interest",
            "sent"
        );

        /*
         * Add the interest to Hubspot
        */
        self::updateHubspotAccount($request);

        return $history;
    }

    /**
     * @param Request $request
     * @throws Exception
     */
    public static function updateHubspotAccount(Request $request): void
    {
        $pid = (int) $request->getQueryValue("pid");
        $sid = (int) $request->getQueryValue("sid");

        $user_data = Account::getAccount($sid);
        $project_data = self::getProject($pid);
        $hubspot_interests_list[$project_data['name']] = $project_data['name'];
        foreach (self::getSpecialistHistory($sid, 'Interest') as $key => $value) {
            $hubspot_interests_list[$value['name']] = $value['name'];
        }

        $hubspot_interests_list = implode("\n", $hubspot_interests_list);
        $hubspot_interests_list = str_replace('&amp;', '&', $hubspot_interests_list);

        Hubspot::prosperUpdateAccount($user_data['email'], [self::HUBSPOT_INTEREST_KEY => $hubspot_interests_list]);
    }

    /**
     * @param int $pid
     * @param array $filters
     * @return false|mixed
     */
    public static function getProject(int $pid, $filters = [])
    {
        $project = false;
        $filters["id"] = $pid;
        try {
            $project = self::get("project", $filters)[0];
        } catch (\Exception $e) {
            $project = false;
        }
        return $project;
    }

    /**
     * @param string $slug
     * @param array $filters
     * @return false|mixed
     */
    public static function getProjectBySlug(string $slug, $filters = [])
    {
        $project = false;
        $filters["slug"] = $slug;
        try {
            $project = self::get("project", $filters)[0];
        } catch (\Exception $e) {
            $project = false;
        }
        return $project;
    }

    /**
     * @param array $packages
     * @param array $minumumTrades
     * @return array
     */
    public static function getTrades(array $packages, array $minumumTrades): array
    {
        $newTrades = [];
        foreach ($packages as $package) {
            if (isset($package['trades']) && is_array($package['trades'])) {
                foreach ($package['trades'] as $idTrade => $trade) {
                    if (in_array($idTrade, $minumumTrades)) {
                        $newTrades[] = [
                            "is_custom" => 0,
                            "label" => $trade,
                            "packages" => [$idTrade],
                            "service" => null,
                            "size" => null,
                            "send_date" => "",
                            "start_on_site" => "",
                            "state" => 0,
                            "tender_return" => ""
                        ];
                    }
                }
            }
        }
        return $newTrades;
    }

    /**
     * @return array|mixed
     * @throws Exception
     */
    public static function getTenderHistoryTypes()
    {
        if (empty(self::$typeCache)) {
            self::$typeCache = self::get("tender/history/type");
        }
        return self::$typeCache;
    }

    /**
     * @return array|mixed
     * @throws Exception
     */
    public static function getTenderHistoryType(int $id): array
    {
        $types = self::getTenderHistoryTypes();
        foreach ($types as $type) {
            if ($id === (int) $type["id"]) {
                return $type;
            }
        }
        return [];
    }

    /**
     * @param string $label
     * @return mixed
     * @throws Exception
     */
    public static function getTenderHistoryTypeId(string $label)
    {

        $types = self::getTenderHistoryTypes();
        foreach ($types as $type) {
            if (strcasecmp($type["uid"], $label) === 0) {
                return $type["id"];
            }
        }

        throw new \Exception("Invalid Status Label $label");
    }

    /**
     * @param array $labels
     * @return array
     * @throws Exception
     */
    public static function getTenderHistoryTypeIds(array $labels)
    {
        $ids = [];
        foreach ($labels as $label) {
            if ($id = self::getTenderHistoryTypeId($label)) {
                $ids[] = $id;
            }
        }
        return $ids;
    }

    /**
     * @param array $sids
     * @param array $status
     * @return array
     */
    public static function filterIdsByStatus(array $sids, array $statusList, $boolFilter = true)
    {
        return array_keys(array_filter($sids, function ($v) use ($statusList, $boolFilter) {
            $check = [];
            foreach ($v as $tid => $status) {

                if (in_array($status, $statusList) === $boolFilter) {
                    $check[] = $status;
                }
            }
            return !empty($check);
        }));
    }

    /**
     * @param Request $request
     * @return JsonResponse
     * @throws Exception
     * Example Response
     * [{
     *   id: tender_id
     *   label: package label
     *   name: company_name
     *   logo: company_logo
     *   cid: company_id
     *  ]}
     */
    public static function getProjectInterests(Request $request, User $user)
    {
        $pid = (int) $request->getQueryValue("pid");
        try {
            $project = self::ownsProject($user, $pid);
        } catch (\Exception $e) {
            return self::jsonResponse(["error" => $e->getMessage()]);
        }

        $response = [];
        $data = self::get("project/" . $project["id"] . "/interests");
        if ($data) {
            $sids = array_values(array_unique(array_column($data, 'cid')));
            if ($sids) {
                $accounts = Account::getAccounts($sids);
                foreach ($data as $interest) {
                    $sid = (int) $interest['cid'];
                    $account = $accounts[$sid] ?? [];
                    if (!$account) {
                        continue;
                    }

                    $response[] = [
                        'id' => (int) $interest['id'],
                        'label' => $interest['label'],
                        'name' => $account["name"],
                        'logo' => str_replace("logo.png", "company.png", $account["logo"]),
                        'cid' => $sid,
                    ];
                }
            }
        }
        return self::jsonResponse($response);
    }

    /**
     * @param Request $request
     * @return JsonResponse
     * @throws Exception
     */
    public static function getLiveTenders(Request $request)
    {
        $label = $request->getQueryValue("project");
        //Should clean up this as a slug really.
        $label = urldecode($label);
        $project = self::getProjectBySlug(urldecode($label));
        if (!$project) {
            return self::jsonResponse([]);
        }
        $pid = $project["id"];
        $history = self::get("project/$pid/tender/history", ["state" => Tender::getStateIdByLabel(Tender::PUBLISHED_STATE_LABEL)]);
        return self::jsonResponse($history);
    }

    /**
     * @param int $specialist_id
     * @param string $type
     * @return array|mixed
     */
    public static function getSpecialistHistory(int $specialist_id, string $type): array
    {
        return self::get("tender?specialist_id=$specialist_id&tender_history_type=$type");
    }

    /**
     * @param Request $request
     * @param User $user
     * @return JsonResponse|bool
     * @throws \Exception
     */
    public static function updateProjectHistory(Request $request, User $user)
    {
        $pid = (int) $request->getQueryValue("pid");
        $status = $request->getQueryValue("status");
        $type   = ucwords(strtolower($request->getQueryValue("type")));

        $json = $request->getJson();
        $meta = [];
        if ($json && isset($json['meta'])) {
            $meta = $json['meta'];
        }

        try {
            $project = self::ownsProject($user, $pid);
            if (!$status) {
                throw new \Exception("Missing Argument Status");
            }
            if (!in_array($type, ["Interest", "Enquiry"])) {
                throw new \Exception("Invalid History Type");
            }
            if (!in_array($type, ["Interest", "Enquiry"])) {
                throw new \Exception("Invalid History Type");
            }
        } catch (\Exception $e) {
            return self::jsonResponse(["error" => $e->getMessage()]);
        } catch (\Exception $e) {
            return self::jsonResponse(["error" => $e->getMessage()]);
        }

        /*
         * Need to check if the subcontractor has a token membership
         * and we need to refund 1 token if the main contractor dismissed the interest
         */
        if ($type === "Interest" && $status == self::DISMISSED_INTEREST_LABEL) {
            $sid = (int) $request->getQueryValue("sid");
            $meta = Account::getMembershipMeta($sid);
            if (isset($meta['tokens'])) {
                ++$meta['tokens'];
                Account::updateMembershipMeta($sid, $meta);
            }
        }

        return self::addHistory($request, $type, (string) $status, $user->getId(), $meta);
    }

    /**
     * @param Request $request
     * @param User $user
     * @return JsonResponse
     * @throws Exception
     */
    public static function bulkUpdateProjectHistory(Request $request, User $user): JsonResponse
    {
        $pid = (int) $request->getQueryValue("pid");
        try {
            self::ownsProject($user, $pid);
        } catch (\Exception $e) {
            return self::jsonResponse(["error" => $e->getMessage()]);
        }
        $status = $request->getQueryValue("status");
        $type   = ucwords(strtolower($request->getQueryValue("type")));

        $tenders = $request->getJson();
        if (!$tenders) {
            throw new \Exception("No tender provided");
        }

        try {
            if (!$status) {
                throw new \Exception("Missing Argument Status");
            }
            if (!in_array($type, ["Interest", "Enquiry"])) {
                throw new \Exception("Invalid History Type");
            }
        } catch (\Exception $e) {
            return self::jsonResponse(["error" => $e->getMessage()]);
        }

        return self::addBulkHistory($pid, $status, $type, $tenders);
    }

    /**
     * @param int $pid
     * @param string $status
     * @param string $type
     * @param array $bulk
     * @param array $meta
     * @param int|null $uid
     * @return JsonResponse
     * @throws Exception
     */
    public static function addBulkHistory(int $pid, string $status, string $type, array $bulk, $meta = [], ?int $uid = null): JsonResponse
    {
        if (!($pid && $status && $type)) {
            return self::jsonResponse(["error" => "Project Not Found"]);
        }

        $statusId = self::getTenderHistoryTypeId($status);
        $metaValue = $meta ?: null;

        /*
         * Flatten the tender => subcontractors map into a single payload so the
         * project service creates every history row in one request and one insert.
         */
        $records = [];
        foreach ($bulk as $tid => $sids) {
            foreach ($sids as $sid) {
                $records[] = [
                    "tender_id"            => $tid,
                    "specialist_id"        => $sid,
                    "tender_history_type"  => $type,
                    "author_id"            => $uid ?? $sid,
                    "status_id"            => $statusId,
                    "meta"                 => $metaValue,
                ];
            }
        }

        if (!$records) {
            return self::jsonResponse(["success" => true]);
        }

        $error = [];
        $requestCompleted = false;
        try {
            $response = self::post("project/$pid/tender/history/bulk", ["records" => $records]);
            if (!$response->isSuccess()) {
                $error["bulk"] = 'Not found';
            } else {
                $skipped = $response->json()["data"]["skipped"] ?? [];
                if ($skipped) {
                    $error["skipped"] = $skipped;
                }
            }
            $requestCompleted = true;
        } catch (\Exception $e) {
            $error["bulk"] = $e->getMessage();
        }

        if ($requestCompleted && $type === "Interest" && $status === "accepted") {
            $project = self::getProject($pid);
            if ($project) {
                $tenderTrades = [];
                foreach ($bulk as $tid => $sids) {
                    $tid = (int) $tid;
                    if (!array_key_exists($tid, $tenderTrades)) {
                        $tenderTrades[$tid] = self::getTenderTrades($pid, $tid);
                    }
                    foreach ($sids as $sid) {
                        try {
                            SupplyChain::mapInfo(
                                (int) $project["group_id"],
                                (int) $sid,
                                ["trade", "region"],
                                [
                                    "trades"  => $tenderTrades[$tid],
                                    "regions" => [$project["region"]],
                                ],
                                true
                            );
                        } catch (\Exception $e) {
                            $error[$sid] = $e->getMessage();
                        }
                    }
                }
            }
        }

        return self::jsonResponse(["success" => !$error]);
    }

    /**
     * @param User $user
     * @param int $pid
     * @param int $tid
     */
    public static function ownsTender(User $user, int $pid, int $tid)
    {
        $data = self::get(
            "tender",
            ["project_id" => $pid, "tender_id" => $tid]
        );

        if ($data) {
            $data = array_shift($data);
            if (in_array($data['group_id'], $user->getUserIds())) {
                return $data;
            }
        }

        throw new \Exception("User Does not own tender");
    }

    /**
     * @return array
     * @throws \Exception
     */
    public static function getProjectTeamRoles(): array
    {
        $data = self::get("project/team/role");
        $teamRoles = [];
        foreach ($data as $value) {
            $teamRoles[] = [
                'id'    => $value['id'],
                'label' => $value['label']
            ];
        }
        return $teamRoles;
    }

    /**
     * @return JsonResponse
     * @throws Exception
     */
    public static function getConstants()
    {
        $constants =  self::getProjectConstants();
        $constants['project']['team_role'] = self::getProjectTeamRoles();
        return self::jsonResponse($constants);
    }

    /**
     * @return array
     */
    public static function getProjectConstants(): array
    {
        if (empty(self::$projectConstantsCache)) {
            self::$projectConstantsCache = self::get("project/constants");
        }

        return self::$projectConstantsCache;
    }

    /**
     * @param Request $request
     * @param User $user
     * @param array $args
     * @return JsonResponse
     * @throws Exception
     */
    public static function getTenderLog(Request $request, User $user, array $args)
    {
        list("tid" => $tid, "sid" => $sid) = $args;
        return self::jsonResponse(self::get("project/tender_history/" . $tid . "/" . $sid));
    }

    /**
     * @param Request $request
     * @param User $user
     * @return JsonResponse
     */
    public static function getProjectProcurement(Request $request, User $user)
    {
        $pid = (int) $request->getQueryValue("pid");
        $view = strtolower((string) $request->getQueryValue("view"));
        $view = in_array($view, ['summary', 'full'], true) ? $view : 'full';
        $isSummaryView = $view === 'summary';
        try {
            $project = self::ownsProject($user, $pid);
            $data = self::get("project/" . $project["id"] . "/procurement", ['history' => 'latest']);
            if ($data) {

                $procurement = $data[$project["id"]];
                $excludeStatus["Interest"] = self::getTenderHistoryTypeIds(["dismissed", "sent"]);
                $excludeStatus["Enquiry"]  = self::getTenderHistoryTypeIds(["deleted"]);
                $response = [];
                $sids = self::filterIdsByStatus($procurement["sids"], self::getTenderHistoryTypeIds(["dismissed", "deleted"]), false);
                $accounts = ($sids) ? Account::getAccountsWithUsers($sids) : [];
                $tenders = self::get("project/" . $project["id"] . "/tender");
                $tenders = array_values(array_filter($tenders, static function ($tender) {
                    return !Tender::isState($tender['state'], Tender::SUGGESTED_STATE_LABEL);
                }));
                $isSubcontractorListApprovalFeature = false;
                if (!$isSummaryView) {
                    $features = Account::get(sprintf('feature/accounts/%s', $user->getAccountId()));
                    $isSubcontractorListApprovalFeature = in_array(
                        self::SUBCONTRACTOR_LIST_APPROVAL_LABEL,
                        array_column($features, 'feature')
                    );
                }

                $services = [];
                $sizes = [];
                $boq_tenders = [];
                if (!$isSummaryView) {
                    $tenderConstants = self::getProjectConstants()['tender'] ?? [];
                    $services = $tenderConstants["service"] ?? [];
                    $sizes = $tenderConstants["size"] ?? [];

                    // BOQ
                    $token = app()->Cookie->getCookie('token');
                    $boq = BoQApi::get("boq/" . $project["id"], [], ['Authorization' => "Bearer $token"]);
                    if ($boq) {
                        foreach ($boq as $item) {
                            $boq_tenders[$item['tender']['id']] = $item['status'];
                        }
                    }
                }

                $shortlistedByTenderId = [];
                $shortlistContext = [
                    'accounts' => [],
                    'users' => [],
                ];
                if (!$isSummaryView) {
                    $shortlistedByTenderId = self::getShortlistedSubcontractorsByTenderId(
                        (int) $project['id'],
                        $tenders
                    );
                    $shortlistContext = self::getShortlistedContext($shortlistedByTenderId);
                }

                foreach ($tenders as $tender) {
                    $tid = $tender["id"];

                    $response[$tid] = [
                        "id" => $tid,
                        "label"   => $tender["label"],
                        "awarded" => $tender["awarded"],
                        "has_document" => $tender['has_document'],
                        "state" => $tender['state'],
                        "start_on_site" => $tender['start_on_site'],
                        "tender_return" => $tender['tender_return'],
                        "procurement" => []
                    ];

                    if (!$isSummaryView) {
                        $trades = [];
                        foreach ($tender["packages"] as $package) {
                            $trades[] = $package["package_id"];
                        }

                        $response[$tid] = array_merge($response[$tid], [
                            "is_custom" => $tender['is_custom'],
                            "size_label" => $sizes[intval($tender["size"])] ?? "",
                            "service_label" => $services[intval($tender["service"])] ?? "",
                            "has_tender_addendum" => $tender['has_tender_addendum'] ?? "",
                            "has_boq" => isset($boq_tenders[$tid]),
                            "packages" => $trades,
                        ]);
                    }

                    /**
                     * If the awarded is for older tenders we dont know to whom the tender was awarded
                     */
                    if (!$isSummaryView && $tender["awarded"]) {
                        $response[$tid]['awarded_to'] = [
                            'name' => 'Non C-Link Subcontractor',
                            'id' => null
                        ];
                    }

                    if (!isset($procurement["tender"][$tid])) {
                        continue;
                    }

                    $types = [
                        "Interest" => $procurement["tender"][$tid]["Interest"] ?? [],
                        "Enquiry"  => $procurement["tender"][$tid]["Enquiry"]  ?? []
                    ];

                    foreach ($types as $k => $type) {
                        foreach ($type as $sid => $schedule) {
                            if (in_array($schedule["last_status"], $excludeStatus[$k])) {
                                continue;
                            }
                            //Account may of been deleted
                            $account = $accounts[$sid] ?? [];
                            if ($k == 'Enquiry') {
                                if ($schedule["last_status"] == self::TENDER_AWARDED_STATUS) {
                                    $lastItem = self::formatHistoryItem($schedule["last_history"] ?? []);
                                    $name = $lastItem['meta']->subcontractor ?? $lastItem['meta']->contact_name;
                                    if (!$sid) {
                                        $sid = $lastItem['meta']->user_id ?? null;
                                    }
                                    if (!$isSummaryView) {
                                        $response[$tid]['awarded_to'] = [
                                            'name' => $name,
                                            'id' => $sid
                                        ];
                                    }
                                }
                            }

                            if (!$account) {
                                continue;
                            }
                            $lastStatus = self::getTenderHistoryType((int) $schedule["last_status"]);
                            if ($isSubcontractorListApprovalFeature && $lastStatus['uid'] === 'added') {
                                $lastStatus['clink_label'] = self::ADDED_APPROVED_STATUS;
                            }
                            $procurementEntry = [
                                'name'   => $account["name"],
                                'subscription_id' => $account['membership']['subscription_id'] ?? 0,
                                'sub_id' => $sid,
                                "status" => $lastStatus,
                            ];

                            if (!$isSummaryView) {
                                $procurementEntry = array_merge($procurementEntry, [
                                    'email' => $account['email'],
                                    'type_id' => $account['type_id'],
                                    'type'   => $k,
                                    'logo'   => str_replace("logo.png", "company.png", $account["logo"]),
                                    "last_action" => self::formatHistoryItem($schedule["last_history"] ?? []),
                                ]);
                            }

                            $response[$tid]["procurement"][$sid] = $procurementEntry;
                        }
                    }

                    if ($isSummaryView) {
                        continue;
                    }

                    $shortlisted = [];
                    $shortlistedResponse = $shortlistedByTenderId[$tid] ?? [];

                    if ($shortlistedResponse) {
                        foreach ($shortlistedResponse as $item) {
                            $approverName = null;
                            if (strtolower($item['status'] ?? '') === 'approved') {
                                continue;
                            }
                            $name = $item["name"] ?? "";

                            // Load account name if account_id exists
                            if (!empty($item["account_id"])) {
                                if (isset($shortlistContext['accounts'][$item["account_id"]])) {
                                    $name = $shortlistContext['accounts'][$item["account_id"]]["name"] ?? $name;
                                }
                            }

                            $submittedBy = null;
                            if (!empty($item['author_id'])) {
                                $authorAccountData = $shortlistContext['users'][$item['author_id']] ?? null;
                                if ($authorAccountData) {
                                    $submittedBy = [
                                        "id" => $authorAccountData['id'],
                                        "display_name" => $authorAccountData['display_name'] ?? null
                                    ];
                                }
                            }

                            if (!empty($item['approver_user_id'])) {
                                $approverData = $shortlistContext['users'][$item['approver_user_id']] ?? null;
                                if ($approverData) {
                                    $approverName = $approverData['display_name'] ?? null;
                                }
                            }

                            $shortlisted[] = [
                                "id" => $item["id"],
                                "subcontractor_id" => $item["account_id"] ?? null,
                                "name" => $name,
                                "submitted_by" => $submittedBy,
                                "status" => $item["status"] ?? "",
                                "approver_id" => $item["approver_id"] ?? null,
                                "approver_user_id" => $item["approver_user_id"] ?? null,
                                "approver_name" => $approverName,
                                "approver_notes" => $item["approver_notes"] ?? ""
                            ];
                        }
                    }

                    $response[$tid]['shortlisted_subcontractors'] = $shortlisted;
                }

                usort($response, function ($a, $b) {
                    return strcmp($a["label"], $b["label"]);
                });
                return self::jsonResponse($response);
            }
        } catch (\Exception $e) {
            return self::jsonResponse(["error" => $e->getMessage()], $e->getCode() ?: 500);
        }
    }

    /**
     * Load shortlisted subcontractors for the provided tenders in a single request.
     *
     * @param int $projectId
     * @param array $tenders
     * @return array
     */
    private static function getShortlistedSubcontractorsByTenderId(int $projectId, array $tenders): array
    {
        $tenderIds = [];
        foreach ($tenders as $tender) {
            $tenderIds[] = (int) $tender['id'];
        }

        if (!$tenderIds) {
            return [];
        }

        $rows = self::get(
            sprintf(
                "project/%s/shortlisted-subcontractors/[%s]",
                $projectId,
                implode(",", $tenderIds)
            )
        );

        $grouped = [];
        foreach ($rows as $row) {
            $tid = (int) ($row['tender_id'] ?? 0);
            if (!$tid) {
                continue;
            }
            $grouped[$tid][] = $row;
        }

        return $grouped;
    }

    /**
     * Build lookup maps for shortlisted subcontractor accounts and related users.
     *
     * @param array $shortlistedByTenderId
     * @return array
     */
    private static function getShortlistedContext(array $shortlistedByTenderId): array
    {
        $accountIds = [];
        $userIds = [];

        foreach ($shortlistedByTenderId as $items) {
            foreach ($items as $item) {
                if (!empty($item['account_id'])) {
                    $accountIds[] = (int) $item['account_id'];
                }
                if (!empty($item['author_id'])) {
                    $userIds[] = (int) $item['author_id'];
                }
                if (!empty($item['approver_user_id'])) {
                    $userIds[] = (int) $item['approver_user_id'];
                }
            }
        }

        $accounts = !empty($accountIds)
            ? Account::getAccountsWithUsers(array_values(array_unique($accountIds)))
            : [];

        $users = self::getUsersById($userIds);

        return [
            'accounts' => $accounts,
            'users' => $users,
        ];
    }

    /**
     * Resolve users by id into an id-indexed lookup map.
     *
     * @param array $userIds
     * @return array
     */
    private static function getUsersById(array $userIds): array
    {
        $userIds = array_values(array_unique(array_filter(array_map('intval', $userIds))));
        if (!$userIds) {
            return [];
        }

        $items = Account::get(sprintf('user/[%s]', implode(",", $userIds)));
        $userMap = [];
        foreach ($items as $item) {
            if (!isset($item['id'])) {
                continue;
            }
            $userMap[(int) $item['id']] = $item;
        }

        return $userMap;
    }

    /**
     * @param array $itemHistory
     * @return array
     */
    public static function getLastItem(array $itemHistory): array
    {
        $last = [];
        foreach ($itemHistory as $item) {
            if (!$last || strtotime($item["created_at"]) > strtotime($last["created_at"])) {
                $last = $item;
                $last["created_at"] = (new \DateTime($item["created_at"]))->format("jS M o");
                $last["meta"] = json_decode($item["meta"]);
            }
        }
        return $last;
    }

    /**
     * Format a single pre-resolved "last" history item (e.g. procurement's "last_history"),
     * matching the transform getLastItem() applies to the latest entry of a full history array.
     *
     * @param array $item
     * @return array
     */
    public static function formatHistoryItem(array $item): array
    {
        if (!$item) {
            return [];
        }
        $item["created_at"] = (new \DateTime($item["created_at"]))->format("jS M o");
        $item["meta"] = json_decode($item["meta"]);
        return $item;
    }

    /**
     * @param Request $request
     * @param User $user
     * @return JsonResponse
     */
    public static function addLogo(Request $request, User $user): jsonResponse
    {
        $pid = $request->getQueryValue("pid");
        try {
            if ($_FILES && $pid) {
                self::ownsProject($user, $pid);
                $file = array_shift($_FILES);

                $path = S3::getKey($pid . ".jpg", "project", ["logo"]);
                S3::upload(
                    "asset",
                    $path,
                    $file["tmp_name"],
                    "image/jpg"
                );
                return self::jsonResponse(["success" => true]);
            }
            throw new \Exception("Bad Request");
        } catch (\Exception $e) {
            return self::jsonResponse(["success" => false]);
        }
    }


    /**
     * @param Request $request
     * @return JsonResponse
     */
    public static function addFile(Request $request, User $user, $args): jsonResponse
    {

        $document = $args["documents"][0];
        $pid = $args["pid"];
        $res = Document::create($request, $user, $args)->getData();
        $doc_id = $res['id'] ?? null;
        $data = $request->getData();
        $suggestions = [];

        if ($doc_id) {
            //Map the new document to a category
            DocCategory::addDocument(
                $request,
                $user,
                ["category" => new DocCategoryModel([], $data['category']), "document" => $document]
            );

            if (!isset($data["skip_analyse"]) || $data["skip_analyse"] == "false") {
                try {
                    list($suggestions, $tenders) = Tender::createFromAnalyser($document, $pid, $data['category']);
                } catch (\Exception $e) {
                    error_log("Analyser Failed: " . $e->getMessage());
                    return self::jsonResponse(["error" => "bad_request"]);
                }
            }
        }

        return self::jsonResponse([
            "success" => !is_null($doc_id),
            'id' => $doc_id,
            'file' => $document->getData(),
            'suggestions' => $suggestions
        ]);
    }

    /**
     * @param Request $request
     * @return JsonResponse
     * @throws Exception
     */
    public static function getPackages(Request $request, User $user)
    {
        $packages = [];
        $clink_packages = Account::get('trade_category', ['account_id' => (int) $user->getAccountId()]);
        if (is_array($clink_packages)) {
            foreach ($clink_packages as $key => $values) {
                foreach ($values['trades'] as $tid => $trade) {
                    $packages[$trade] = [
                        'id' => $tid,
                        'label' => $trade
                    ];
                }
            }
            ksort($packages);
            $packages = array_values($packages);

            if ($user->getAccountMetaKey(Account::WHITELIST_META_TRADE)) {
                //get whitelist trades
                if ($trades_whitelist = Account::get("account/" . $user->getAccountId() . "/trades")) {
                    $packages = self::filterTradesByWhitelist($packages, $trades_whitelist);
                }
            }

            return self::jsonResponse($packages);
        }
        return self::jsonResponse(["error" => "bad_request"]);
    }

    /**
     * //THIS NEEDS TO BE MOVED TO API
     * @param array $trades
     * @param array $trades_whitelist
     * @return array
     */
    public static function filterTradesByWhitelist(array $trades, array $trades_whitelist): array
    {
        $trades_ids = [];
        foreach ($trades_whitelist as $trade) {
            $trades_ids[] = $trade['id'];
        }
        if ($trades_ids) {
            $result = array_intersect($trades_ids, array_column($trades, 'id'));
            $trades = array_values(array_filter($trades, function ($item) use ($result) {
                return in_array($item['id'], $result);
            }));
        }

        return $trades;
    }

    /**
     * @param Request $request
     * @return JsonResponse
     * @throws Exception
     */
    public static function getSlugByName(Request $request): JsonResponse
    {
        $name = $request->getQueryValue("name");

        if ($name) {
            $slug = self::get("project/slug/" . $name);
            return self::jsonResponse(['slug' => $slug]);
        }

        return self::jsonResponse(["error" => "bad_request"]);
    }

    /**
     * @param Request $request
     * @param User $user
     * @param array $args
     * @return JsonResponse
     */

    public static function toggleHistoryArchived(Request $request, User $user, array $args): JsonResponse
    {
        list("tid" => $tid, "sid" => $sid) = $args;
        $res = self::patch("project/tender/$tid/history/$sid/archive", []);
        return self::jsonResponse(["success" => ($res->getStatus() === 203)]);
    }

    /**
     * @param Request $request
     * @param User $user
     * @param array $args
     * @return JsonResponse
     */
    public static function archived(Request $request, User $user, array $args): JsonResponse
    {
        $pid = $args['pid'];
        $res = self::patch("project/" . $args["pid"], ["status" => self::PROJECT_ARCHIVED_STATUS]);
        $project = self::get("project/" . $args["pid"], ["status" => self::PROJECT_PUBLISH_STATUS]);
        $tenders = $project["tender"];
        $draft = 1;
        foreach ($tenders as $tender) {
            self::patch("project/$pid/tender/" . $tender["id"], ["state" => $draft]);
        }
        return self::jsonResponse(["success" => ($res->getStatus() === 203)]);
    }

    /**
     * @param Request $request
     * @param User $user
     * @param array $args
     * @return JsonResponse
     */
    public static function restore(Request $request, User $user, array $args): JsonResponse
    {
        $pid = $args['pid'];
        $res = self::patch("project/" . $args["pid"], ["status" => self::PROJECT_PUBLISH_STATUS]);
        $project = self::get("project/" . $args["pid"], ["status" => self::PROJECT_PUBLISH_STATUS]);
        $tenders = $project["tender"];
        $published = 2;
        foreach ($tenders as $tender) {
            self::patch("project/$pid/tender/" . $tender["id"], ["state" => $published]);
        }
        return self::jsonResponse(["success" => ($res->getStatus() === 203)]);
    }

    /**
     * @param Request $request
     * @param User $user
     * @param array $args
     * @return JsonResponse
     */
    public static function publish(Request $request, User $user, array $args): JsonResponse
    {
        $id = $args["pid"];
        $data = $request->getRequiredJson();
        $project = $args["project"];

        /*
         * If the project was already published we don't need to do anything
         */
        if ((int)$project['status'] == self::PROJECT_PUBLISH_STATUS) {
            return self::jsonResponse(["success" => true]);
        }

        if (isset($data["pricingDocument"]) && (int) $data["pricingDocument"] === 1) {
            try {
                PricingDoc::send($user, $project);
            } catch (\Exception $e) {
                error_log("Pricing Doc send for project id $id failed: " . $e->getMessage());
            }
        }

        try {
            Email::send([
                'sender'   => ['id' => $user->getId()],
                'template' => 'Project Review',
                'to'       => self::getConfig()["email_to"],
                'cc'       => [
                    self::getConfig()["email_cc_to"]
                ],
                'extra'    => [
                    "project_name" => $project["name"],
                    "company"      => $user->getAccountData("name")
                ]
            ], 'clink');
            Email::send([
                'sender'   => ['id' => $user->getId()],
                'template' => 'Your project is under review',
                'to'       => $user->getData("email"),
                'extra'    => [
                    "display_name" => $user->getData("display_name"),
                    "project_name" => $project["name"]
                ]
            ], 'clink');
        } catch (\Exception $e) {
            self::errorLog("Failed to send publish project emails: " . $e->getMessage());
        }

        $res = self::patch("project/$id", ["status" => self::PROJECT_IN_REVIEW_STATUS]);
        return self::jsonResponse(["success" => ($res->getStatus() === 203)]);
    }


    /**
     * @param Request $request
     * @param User $user
     * @param array $args
     * @return JsonResponse
     */
    public static function getPackageDependency(Request $request, User $user, array $args): JsonResponse
    {
        $pid = (int)$args['pid'];
        $type = $request->getQueryValue("type", "parent");
        try {
            $dependencies = self::get("project/$pid/tender/dependency", ['type' => $type]);
            return self::jsonResponse(['data' => (object)$dependencies]);
        } catch (\Exception $e) {
            error_log("Failed to get package dependencies: " . $e->getMessage());
            return self::jsonResponse(["error" => "Api Failure"]);
        }
    }

    /**
     * @param array $project
     * @param array $history
     * @param array $ignore_statuses
     */
    public static function updateProjectTenderFirstEnquirySentDate(array &$project, array $history, array $ignore_statuses = []): void
    {
        if ($history) {
            foreach ($history as $tid => $tender) {
                if (isset($tender['Enquiry'])) {
                    $enquiry_sent_date = [];
                    foreach ($tender['Enquiry'] as $enquiry) {
                        if (!in_array($enquiry['last_status'], $ignore_statuses, true)) {
                            $enquiry_history = end($enquiry['history']);
                            if (isset($enquiry_history['created_at'])) {
                                $enquiry_sent_date[] = strtotime($enquiry_history['created_at']);
                            }
                        }
                    }
                    if ($enquiry_sent_date) {
                        $first_sent_date = min($enquiry_sent_date);
                        $project["tender"] = array_map(function ($item) use ($tender, $first_sent_date) {
                            if ($tender['label'] === $item['label']) {
                                $item['enquiry_sent_date'] = date("Y-m-d", $first_sent_date);
                            }
                            return $item;
                        }, $project["tender"]);
                    }
                }
            }
        }
    }

    /**
     * @param Request $request
     * @throws Exception
     */
    public static function getActions(Request $request): jsonResponse
    {
        try {
            $token = app()->Cookie->getCookie('token');
            $filter = $request->getQuery()['filter'] ?? '';
            $response = Api::get("project/getActions", ['filter' => $filter], ['Authorization' => "Bearer $token"]);
            return self::jsonResponse($response);
        } catch (\Exception $e) {
            return self::jsonResponse(["error" => $e->getMessage()], 400);
        }
    }

    /**
     * @param Request $request
     * @throws Exception
     */
    public static function updateActions(Request $request): jsonResponse
    {
        try {
            $requestData = $request->getJson();
            $token = app()->Cookie->getCookie('token');
            $response = Api::post("project/updateActions", $requestData, ['Authorization' => "Bearer $token"]);
            return self::jsonResponse($response->json(), $response->getInfo()['http_code']);
        } catch (\Exception $e) {
            return self::jsonResponse(["error" => $e->getMessage()], 400);
        }
    }

    /**
     * @param array $project
     */
    public static function updateProjectTenderForFileManager(array &$project): void
    {
        if (isset($project['tender']) && is_array($project['tender'])) {
            $project['tender'] = array_values(
                array_filter($project['tender'], function ($tender) {
                    // remove if state == 0
                    if ($tender['state'] == 0) {
                        return false;
                    }

                    // if state == 1, keep only if fields are filled
                    if ($tender['state'] == 1) {
                        return !empty($tender['size']);
                    }

                    // any other state e.i: 2 -> keep as is
                    return true;
                })
            );
        }
    }

    /**
     * @param int $userId
     */
    public static function deleteProjectTeamMemberRoleMappingByUserId(int $userId): void
    {
        self::delete("project/mappings/team_member/$userId");
    }

    private static function canSendTender(
        bool  $isApprovalFeatureEnabled,
        array $shortlistedResponse,
        array $tenderEnquiries = []
    ): bool {
        // Feature OFF - true for every enquiry in tender
        if (!$isApprovalFeatureEnabled) {
            return !empty($tenderEnquiries);
        }

        // Feature ON - no approver assigned - false
        $hasApproved    = false;

        foreach ($shortlistedResponse as $item) {
            if (strtolower($item['status'] ?? '') === 'approved') {
                $hasApproved = true;
            }
        }

        // Case: approver assigned - true
        return $hasApproved;
    }
}
