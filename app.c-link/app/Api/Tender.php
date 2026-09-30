<?php

namespace App\Api;

use App\Api\Aws\Sqs;
use App\Api\Client\Response\JsonResponse;
use App\Api\Document\Category as DocCategory;
use App\Api\Email\Email;
use App\Api\Tender as TenderApi;
use App\core\Request;
use App\Api\Project as ProjectApi;
use App\Models\Collection;
use App\Models\Tender as TenderModel;
use App\Models\Project as ProjectModel;
use App\Models\User;
use App\Api\Project\Validator as ProjectValidator;
use App\Models\Tender\History\Type as History;
use DateTime;

class Tender extends ProjectApi
{
    /**
     * Allow Config to be overridden
     */
    const API_CONFIG_KEY = "project";

    const SUGGESTED_STATE_LABEL = 'suggested';

    const PUBLISHED_STATE_LABEL = 'published';

    const DRAFT_STATE_LABEL = 'draft';

    CONST DEFAULT_SIZE = 559;

    CONST DEFAULT_SERVICE = 27;

    CONST ENTITY_TYPE = "tender";

    /**
     * @var array
     */
    protected static array $typeCache = [];

    /**
      * @var array
    */
    protected static array $tenderStateCache = [];

    /**
     * @var array
     */
    protected static $forward_address = [];

    /**
     * @var array
     */
    protected static $security = [
        "methods" => [
            "fetch" => [
                "type" => "GET",
                "requires_session" => true,
                "pre_checks" => [
                    "validateOwner"
                ],
                "required_args" => [
                    "tid" => "int"
                ]
            ],
            "create" => [
                "type" => "POST",
                "requires_session" => true,
                "pre_checks" => [
                    [ProjectValidator::class, "isOwner"]
                ],
                "required_args" => [
                    "pid" => "int"
                ]
            ],
            "update" => [
                "type" => "PATCH",
                "requires_session" => true,
                "pre_checks" => [
                    "validateOwner"
                ],
                "required_args" => [
                    "tid" => "int"
                ]
            ],
            "remove" => [
                "type" => "DELETE",
                "requires_session" => true,
                "pre_checks" => [
                    "validateOwner"
                ],
                "required_args" => [
                    "tid" => "int"
                ]
            ],
            "updatePackages" => [
                "type" => "PATCH",
                "requires_session" => true,
                "pre_checks" => [
                    "validateOwner"
                ],
                "required_args" => [
                    "tid" => "int"
                ]
            ],
            "publishMarketplace" => [
                "type" => 'PATCH',
                "requires_session" => true,
                "pre_checks" => [
                    "validateOwner"
                ],
                "required_args" => [
                    "tid" => "int"
                ]
            ],
            "projectSummary" => [
              "type" => "GET",
              "requires_session" => true,
              "pre_checks" => [
                [ProjectValidator::class, "isOwner"]
              ],
              "required_args" => [
                "pid" => "int"
              ]
            ],
            "mapPackageDependency" => [
                "type" => 'POST',
                "requires_session" => true,
                "pre_checks" => [
                    "validateOwner"
                ],
                "required_args" => [
                    "tid" => "int"
                ]
            ],
            "updateAwardedStatus" => [
                "type" => 'PATCH',
                "requires_session" => true,
                "required_args" => [
                    "pid" => "int",
                    "tid" => "int"
                ]
            ]
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
    public static function getSecurity() {
        return self::$security;
    }

    /**
     * @param string $step
     * @param string $url
     */
    public static function setForwardingAddress($step, $url) {
        self::$forward_address[$step] = $url;
    }

    /**
     * @param Request $request
     * @param User $user
     * @param array $args
     */
    public static function validateOwner(Request $request, User $user, array &$args) {
        $tid = $args["tid"] ?? false;
        if(!$tid) {
            throw new \Exception("No Tender Id Supplied");
        }

        $data = self::get("tender/$tid");
        $tender = new TenderModel($data[$tid], $tid);
        $project = new ProjectModel($data["project"], $tender->getData("project_id"));

        if(!$project->isOwner($user)) {
            throw new \Exception("Permission Denied");
        }

        $args["project"] = $project;
        $args["tender"] = $tender;
    }

    /**
     * @param Request $request
     * @param User $user
     * @param $args
     * @return JsonResponse
     */
    public static function create(Request $request, User $user, $args) : JsonResponse {

        $data = $request->getRequiredJson();
        $res = self::post("project/" . $args["project"]->getId() . '/tender',
            $data
        );

        $json = $res->json();
        $tid = $json["data"]['id'] ?? null;
        return self::jsonResponse(["success" => !is_null($tid), 'id' => $tid]);
    }

    /**
     * @param Request $request
     * @param User $user
     * @param $args
     * @return JsonResponse
     */
    public static function fetch(Request $request, User $user, $args) : JsonResponse {
        $response = self::get($args["tender"]->getApiUrl());
        return self::jsonResponse($response[0] ?? []);
    }

  /**
   * @param Request $request
   * @param User $user
   * @param $args
   * @return JsonResponse
   * @throws Exception
   */
    public static function projectSummary(Request $request, User $user, $args) : JsonResponse {
      $pid = $args["pid"];

      try{
        self::ownsProject($user, $pid);
        $summary = Project::get("project/$pid/tender/dashboard-summary");
      }catch (\Exception $e){
        $summary = null;
      }

      return self::jsonResponse(['data' => $summary ?? null]);
    }

    /**
     * @param Request $request
     * @param User $user
     * @param $args
     * @return JsonResponse
     * @throws \Exception
     */
    public static function mapPackageDependency(Request $request, User $user, $args) : JsonResponse
    {
        $tid = $args["tender"]->getId();
        $data = $request->getJson();
        $res = self::post("tender/$tid/dependency",
            $data
        );
        return self::jsonResponse(["success" => ($res->getStatus() === 203)]);
    }

/**
     * @param int $tid
     * @throws Exception
     */
    public static function getTenderById(int $tid) {
        $data = self::get("tender/$tid");
        return $data;
    }

    /**
     * @param $pid
     * @param $tid
     * @param $data
     * @throws \Exception
     */
    public static function addTenderHistory($pid, $tid, $data)
    {
        return Transactions::post("project/{$pid}/tender/{$tid}/history", $data);
    }

    /**
     * @param Request $request
     * @param User $user
     * @param $args
     * @TODO this will be deprecated once the BOQ will be LIVE
     */
    public static function update(Request $request, User $user, $args) : JsonResponse {
        $json   = $request->getJson();
        $tender = $args["tender"];
        /*
         * We cannot change a normal package label
         */
        if(!$tender->getData("is_custom")){
          unset($json['label']);
        }

        /**Create Default Cats for a tender if it goes from pending to published or draft */
        $currentState = (int) $tender->getData("state");
        $stateExists = isset($json["state"]);
        if(self::isState($currentState, self::SUGGESTED_STATE_LABEL) && $stateExists && (int) $json["state"] > $currentState) {
            DocCategory::createDefaults(
                $args["tid"], self::ENTITY_TYPE, [
                    'parent_id' => $tender->getData("project_id"),
                    'inherit_parent' => true
                ]
            );

            /*
             * Assing documents based on categories custom rules
             */
            DocCategory::assignDocumentsByTenderRules($tender);
        }

        /*
         * Update tenders the published_at column that are in draft state for projects that are published
         * and automatically set the tender state to published
        */
        if($stateExists && $currentState > (int) $json["state"]){
            $json["state"] = $currentState;
        }
        if(self::isState($currentState, self::DRAFT_STATE_LABEL)) {
            $project = Project::getProject((int)$tender->getData("project_id"));
            if ( $project['status'] == 1 ) {
                $json['published_at'] = date("Y-m-d");
                $json['state'] = (int)self::getStateIdByLabel(self::PUBLISHED_STATE_LABEL);
            }
        }

        $tenderModel = self::load((int)$tender->getData("project_id"), $args["tid"]);
        if($decision_date = $tenderModel->getDefaultDecisionDate($json)) {
            $json['decision_date'] = $decision_date;
        }

        $res = self::patch($tender->getApiUrl(),
          $json
        );

        return self::jsonResponse(["success" => ($res->getStatus() === 203)]);
    }

    /**
     * @param Request $request
     * @param User $user
     * @param $args
     */
    public static function updatePackages(Request $request, User $user, $args) : JsonResponse {
        $json   = $request->getJson();
        $tender = $args["tender"];
        /*
         * We cannot change a normal package label
         */
        if(!$tender->getData("is_custom")){
            unset($json['label']);
        }

        /**
         * Added validation for duplicate reference number within same project
        */
        if (!empty($json['reference_no'])) {

            $projectId = (int) $tender->getData('project_id');
            $tenderId  = (int) $args['tid'];

            // Fetching all tenders for this project
            $tenders = self::get("project/$projectId/tender");

            foreach ($tenders as $id => $tenderData) {
                if (
                    (int) $id !== $tenderId &&
                    isset($tenderData['reference_no']) &&
                    $tenderData['reference_no'] === $json['reference_no']
                ) {
                    return self::jsonResponse([
                        'success' => false,
                        'error'   => 'Review Reference numbers for a duplicate. Reference numbers must be unique.'
                    ], 422);
                }
            }
        }

        if($args["project"]->getData('version') > Project::PROJECT_V1)
        {
            $packageMilestones = $json["milestones"] ?? [];
            $packageMilestonesExistingData = Project::get(sprintf("milestones/package-milestones/packages/%s", $tender->getId()));
            $milestones = !empty($packageMilestones) ? $packageMilestones : $packageMilestonesExistingData;

            $updatedMilestonesData = !empty($packageMilestones)
                ? array_map(fn($milestone) => ['id' => $milestone['id'], 'lead_time' => $milestone['lead_time']], $packageMilestones)
                : [];

            $startOnSite = ($json['start_on_site'] ?? null) ?: $tender->getData("start_on_site");
            $logMilestoneChanges = (bool) $startOnSite;

            if($logMilestoneChanges) {
                $updatedMilestonesData = self::calculatePlannedDates($milestones, $startOnSite);
            }

            self::patch(sprintf("milestones/package-milestones/packages/%s", $tender->getId()), $updatedMilestonesData);

            if($logMilestoneChanges) {
                self::logMilestoneChanges($user, $updatedMilestonesData, $packageMilestonesExistingData);
            }
        }

        $tenderModel = self::load((int)$tender->getData("project_id"), $args["tid"]);
        if($decision_date = $tenderModel->getDefaultDecisionDate($json)) {
            $json['decision_date'] = $decision_date;
        }

        // unset milestone data from request json before passing it to the next request
        if(isset($json["milestones"])) {
            unset($json['milestones']);
        }

        $res = self::patch($tender->getApiUrl(),
            $json
        );

        return self::jsonResponse([
            "success" => ($res->getStatus() === 200),
            "data" => $res->json()["data"] ?? []
        ]);
    }

    public static function calculatePlannedDates(array $data, string $startOnSite): array
    {
        $lastIndex = count($data) - 1;

        if ($lastIndex < 0) {
            return $data;
        }

        // Start on Site calculation
        $leadWeeks = (int)$data[$lastIndex]['lead_time'];
        $start = new DateTime($startOnSite);
        $end = (clone $start)->modify('+' . ($leadWeeks * 7) . ' days');

        $data[$lastIndex]['planned_start_date'] = $start->format('Y-m-d');
        $data[$lastIndex]['planned_end_date']   = $end->format('Y-m-d');

        $nextValidIndex = $lastIndex; // Start from the last milestone

        // Calculate previous milestones backwards
        for ($i = $lastIndex - 1; $i >= 0; $i--) {
            // Skip completed milestones
            if ($data[$i]['status'] === 'Completed') {
                unset($data[$i]);
                continue;
            }
            $nextStart = new DateTime($data[$nextValidIndex]['planned_start_date']);
            $endDate   = (clone $nextStart)->modify('-1 day');

            $leadWeeks = (int)$data[$i]['lead_time'];
            $startDate = (clone $endDate)->modify('-' . ($leadWeeks * 7) . ' days');

            $data[$i]['planned_start_date'] = $startDate->format('Y-m-d');
            $data[$i]['planned_end_date']   = $endDate->format('Y-m-d');

            $nextValidIndex = $i; // Only update when we actually processed a milestone
        }

        return $data;
    }

    private static function logMilestoneChanges(User $user, array $updatedMilestonesData, array $previousMilestonesData) {
        foreach ($updatedMilestonesData as $updatedMilestoneData) {
            $previousMilestoneData = array_values(array_filter($previousMilestonesData, fn($d) => isset($d['id']) && $d['id'] === $updatedMilestoneData["id"]))[0] ?? null;
            $logData = [
                'user_id'     => $user?->getId() ?? 0,
                'entity_id'   => $updatedMilestoneData["id"],
                'entity_type' => 'package_milestone',
                'type'        => sprintf("%s Updated", $previousMilestoneData["label"]),
                'meta'        => json_encode([
                    'message'   => sprintf("Milestone %s Updated", $previousMilestoneData["label"]),
                    'user' => $user?->getFullName() ?? 'system',
                    'data' => [
                        'previous' => [
                            'planned_start_date' => $previousMilestoneData["planned_start_date"] ?? null,
                            'planned_end_date' => $previousMilestoneData["planned_end_date"] ?? null,
                            'lead_time' => $previousMilestoneData["lead_time"] ?? null,
                        ],
                        'current' => [
                            'planned_start_date' => $updatedMilestoneData["planned_start_date"],
                            'planned_end_date' => $updatedMilestoneData["planned_end_date"],
                            'lead_time' => $updatedMilestoneData["lead_time"],
                        ]
                    ]
                ])
            ];
            Project::post('logs', $logData);
        }
    }

    /**
     * @param Request $request
     * @param User $user
     * @param $args
     * @return JsonResponse
     * @throws Exception
     */
    public static function remove(Request $request, User $user, $args) : JsonResponse {

        // This needs to be refactored so the frontend makes two calls rather than fudge all the logic
        //in here and tight couple tenders and document categories
        try{
            //Clean up cats of deleted tenders
            DocCategory::delete("/category/entity/" . $args["tender"]->getId());
        }
        catch (\Exception $e) {
            if($e->getMessage() !== "Not found.") {
                self::errorLog($e->getMessage());
            }
        }

        return self::jsonResponse([
            "success" => (self::delete($args["tender"]->getApiUrl())->getStatus() === 203)
        ]);
    }

    /**
     * @param int $pid
     * @param int $tid
     * @return TenderModel
     * @throws Exception
     */
    public static function load(int $pid, int $tid) {
        $data = self::get("project/$pid/tender/$tid");
        $tender = $data[0] ?? [];
        return new TenderModel($tender, $tender ? (string) $tid : null);
    }

    /**
     * @return array
     */
    public static function getState(): array
    {
      if (!self::$tenderStateCache) {
        $constants = self::get("project/constants");
        self::$tenderStateCache = $constants['tender']['state'] ?? [];
      }

      return self::$tenderStateCache;
    }

    /**
     * @param int $id
     * @return string|null
     */
    public static function getStateLabelById(int $id): ?string
    {
      $state = self::getState();
      return $state[$id] ?? null;
    }

  /**
   * @param string $state
   * @return string|null
   */
    public static function getStateIdByLabel(string $state): ?string
    {
      $states = self::getState();
      return array_search($state, $states, true);
    }

    /**
     * @param int $id
     * @param string $state
     * @return bool
     */
    public static function isState(int $id, string $state): bool
    {
        return (self::getStateLabelById($id) === constant('self::' . strtoupper($state) . '_STATE_LABEL'));
    }

    /**
     * @return Collection|mixed
     * @throws Exception
     */
    public static function getHistoryTypes(): Collection
    {
        if(!isset(self::$typeCache["history"])) {
            self::$typeCache["history"] = new Collection(
                self::get("tender/history/type"),
                History::class
            );
        }

        return self::$typeCache["history"];
    }

    /**
     * @param $labels
     * @return array
     * @throws Exception
     */
    public static function getHistoryTypeIds($labels) : array {
        return self::getHistoryTypes()
            ->filterByModelFunction("uidIn", true, $labels)
            ->getIds();
    }

    /**
     * @param Request $request
     * @param User $user
     * @param $args
     */
    public static function updateAwardedStatus(Request $request, User $user, $args) : JsonResponse {
        $pid = (int) $request->getQueryValue("pid");
        $tid = (int) $request->getQueryValue("tid");
        $data = $request->getRequiredJson();

        $res = self::patch("project/$pid/tender/$tid", $data);

        return self::jsonResponse(["success" => ($res->getStatus() === 203)]);
    }

    /**
     * @param Request $request
     * @param User $user
     * @param array $args
     * @return JsonResponse
     * @throws \Exception
     */
    public static function publishMarketplace(Request $request, User $user, array $args): JsonResponse
    {
        $project = $args['project'];
        $tender  = $args['tender'];
        $pid     = $tender->getData("project_id");

        /*
         * Before publishing the tender we need to make sure that the project is published
         */
        if((int)$project->getData("status") !== self::PROJECT_PUBLISH_STATUS){
            self::patch("project/$pid", ["status" => self::PROJECT_PUBLISH_STATUS]);
        }

        /*
         * Publish tender to marketplace
         */
        $res = self::patch($tender->getApiUrl(),
            [
                'state'        => (int)self::getStateIdByLabel(self::PUBLISHED_STATE_LABEL),
                'published_at' => date("Y-m-d")
            ]
        );

        //Send emails to subcontractors to notify the new published tender
        try {
            if(self::getConfig()["publish_marketplace_email_enabled"]) {

                $offerings = Account::getAccountOfferings([
                    'region' => $project->getData("region"),
                    'trade' => implode(",", $tender->getData("packages"))
                ]);
                $subcontractors = [];
                $data = [];
                foreach ($offerings as $offering) {
                    if (
                        in_array($project->getData("region"), $offering['offerings']['region'] ?? []) &&
                        array_intersect($offering['offerings']['trade'] ?? [], $tender->getData("packages"))
                    ) {
                        $subcontractors[] = $offering['account_id'];
                        $data[$offering['account_id']] = [
                            "sid" => $offering['account_id'],
                            "date" => date("Y-m-d H:i:s"),
                            "tender" => json_encode([
                                'tender' => [
                                    'return_date' => $tender->getData("tender_return"),
                                    'size' => $tender->getData("size"),
                                    'label' => $tender->getData("label"),
                                ],
                                'project' => [
                                    'name' => $project->getData("name"),
                                    'id' => $project->getId(),
                                    'type' => $project->getData("type"),
                                    'gia' => $project->getData("gia"),
                                ]
                            ])
                        ];
                    }
                }
                $accounts = Account::getAccounts($subcontractors);
                foreach ($accounts as $account) {
                    if ( !Account::isTypeOf($account['type_id'], Account::getSpecialistExternalTypes()) ) {
                        Sqs::send(json_encode($data[$account['id']]), 'publish_marketplace');
                    }
                }
            }

            Email::send([
                'sender'   => ['id' => $user->getId()],
                'template' => 'Project Review',
                'to'       => self::getConfig()["email_to"],
                'extra'    => [
                    "project_name" => $project->getData("name"),
                    "tender_name"  => $tender->getData("label"),
                    "company_name" => $user->getAccountData("name")
                ]
            ],'clink');
        }
        catch(\Exception $e) {
            self::errorLog("Failed to send publish project emails: " . $e->getMessage());
        }


        return self::jsonResponse(["success" => ($res->getStatus() === 203)]);
    }
}
