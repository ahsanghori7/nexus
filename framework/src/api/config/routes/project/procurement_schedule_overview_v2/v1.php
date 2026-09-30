<?php

use Api\Middleware\DocumentMiddleware;
use Api\Middleware\LogsMiddleware;
use Api\Middleware\MilestoneMiddleware;
use Api\Middleware\ProjectMiddleware;
use Api\Middleware\TenderMiddleware;
use Api\Middleware\Relay\BoqMiddleware;
use Api\Service\ProcurementScheduleOverview\ExcelService as PsoExcelService;
use Core\Middleware\Procedure;
use Core\Middleware\Generic;
use Core\Middleware\Service\AccountMiddleware;
use Core\Service\Manager;
use Core\Data\Shape;
use Core\Middleware\Exception as MiddlewareException;
use Core\Service\Exception\RestException;

return [
    [
        "id" => "procurement_schedule_overview",
        "key" => "(?<project_id>[0-9]+)\/procurement_schedule_overview$",
        "method" => "GET",
        "description" => "Get Procurement Schedule Overview",
        "response_keys" => "data",
        "middleware" => [
            Procedure::get("fetchAndValidateProjectOwnershipById"),
            ProjectMiddleware::fetchProjectProcurement(),
            ProjectMiddleware::generatePSOResponse(),
            Generic::set("json", function ($a) {
                return json_encode($a->get("response"));
            }),
        ],
    ],
    [
        "id"          => "procurement_schedule_overview_export",
        "key"         => "(?<project_id>[0-9]+)\/procurement_schedule_overview\/export$",
        "method"      => "GET",
        "description" => "Export Procurement Schedule Overview to Excel",
        "middleware"  => [
            Procedure::get("fetchAndValidateProjectOwnershipById"),
            function ($a){
                $getProjectVersion = $a->get('project')->get('version') ?? null;
                if($getProjectVersion != 2){
                    throw new MiddlewareException(
                        "restError",
                        "Excel export is not available in the older project"
                    );
                }
            },
            ProjectMiddleware::fetchProjectProcurement(),
            ProjectMiddleware::generatePSOResponse(),
            function ($a) {

                $packages = $milestones = $allMilestonesList = [];

                $data = $a->get("response");

                try {

                    $accountMilestones = Manager::getService("project")
                    ->fetch(sprintf("milestones/accounts/%s", $a->get("account.id") ?? 0))
                    ->getShape('data')->get();

                    if (!empty($accountMilestones)) {
                        usort($accountMilestones, fn($a, $b) => $a['sort_order'] <=> $b['sort_order']);
                        foreach ($accountMilestones as $mstone) {
                            if ($mstone['label'] != 'START_ON_SITE') {
                                $milestones[] = $mstone['label'];
                            }
                        }
                    }
                } catch (\Throwable) {
                    // milestone fetch failed — columns will be missing
                }

                foreach ($data as $tender) {
                    $tenderCoverage = $tender['tender_coverage'] ?? '';

                    list($covered, $total) = explode('/', $tenderCoverage);
                    $tenderPercentage = ($total > 0) ? round(($covered / $total) * 100) : 0;

                    $milestonesByLabel = [];
                    $currentMilestone = $currentMilestoneStatus = $nextMilestone = '';
                    if (isset($tender['milestones']) && is_array($tender['milestones'])) {
                        foreach ($tender['milestones'] as $milestoneKey => $milestone) {

                            switch ($milestoneKey) {
                                case 'current':
                                    $currentMilestone = $milestone['label'] ?? '';
                                    $currentMilestoneStatus = $milestone['status'] ?? '';
                                    break;
                                case 'next':
                                    $nextMilestone = $milestone['label'] ?? '';
                                    break;
                                default:
                                    break;
                            }
                        }
                    }

                    $allMilestones = $milestonesByLabel = [];
                    try {
                        $allMilestones = Manager::getService("project")
                            ->fetch(sprintf("milestones/package-milestones/packages/%s", $tender['id']))
                            ->getCollection('data')->getItemsAsArray();

                        if (!empty($allMilestones)) {
                            usort($allMilestones, fn($a, $b) => $a['sort_order'] <=> $b['sort_order']);
                            foreach ($allMilestones as $m) {
                                $milestonesByLabel[$m['label']] = $m;
                            }
                        }
                    } catch (\Throwable) {
                        // milestone fetch failed — row will have blank date columns
                    }

                    $subcontractor = 'TBC';
                    if(!empty($tender['awarded_to']['name'])){
                        $subcontractor = $tender['awarded_to']['name'];
                    } else{
                        $procurementCount = !empty($tender['procurement']) ? count($tender['procurement']) : 0;
                        $subcontractorsCount = !empty($tender['shortlisted_subcontractors']) ? count($tender['shortlisted_subcontractors']) : 0;
                        $totalSuppliers = $procurementCount + $subcontractorsCount;
                        $totalSuppliersText = $totalSuppliers > 1 ? $totalSuppliers . ' Suppliers' : $totalSuppliers . ' Supplier';
                        $subcontractor = $totalSuppliers > 0 ? $totalSuppliersText : $subcontractor;
                    }

                    $packages[] = [
                        'reference_no'             => $tender['reference_no'],
                        'label'                    => $tender['label'],
                        'subcontractor'            => $subcontractor,
                        'tender_coverage'          => $tenderCoverage . ' (' . $tenderPercentage . '%)',
                        'current_milestone_label'  => $currentMilestone,
                        'current_milestone_status' => $currentMilestoneStatus,
                        'next_milestone_label'     => $nextMilestone,
                        'budget'                   => $tender['budget'],
                        'order_value'              => $tender['order_value'],
                        'variance'                 => $tender['variance'],
                        'variance_percent'         => $tender['variance_percent'] ?? 0,
                        'order_issue_date'         => $tender['order_issue_date'] ?? '-',
                        'start_on_site'            => $tender['start_on_site'] ?? '',
                        'milestones_by_label'      => $milestonesByLabel
                    ];
                }

                $a->set('pso_export_packages', $packages);
                $a->set('pso_export_milestones', $milestones);
            },
            function ($a) {
                $packages     = $a->get('pso_export_packages') ?? [];
                $milestones     = $a->get('pso_export_milestones') ?? [];

                usort($packages, function ($a, $b) {
                    if (empty($a['start_on_site']) && empty($b['start_on_site'])) {return 0;}
                    if (empty($a['start_on_site'])) {return -1;}
                    if (empty($b['start_on_site'])) {return 1;}
                    $dateA = !empty($a['start_on_site']) ? new \DateTime($a['start_on_site']) : '';
                    $dateB = !empty($b['start_on_site']) ? new \DateTime($b['start_on_site']) : '';
                    return $dateA <=> $dateB;
                });

                $projectName  = $a->get('project.name') ?? 'Project';

                $exportDate   = date('j M Y');
                $filename     = "{$projectName} - Procurement Schedule Overview - {$exportDate}.xlsx";

                $service = new PsoExcelService($packages, $milestones);
                $service->render();
                $service->download($filename);
            },
        ],
    ],
    [
        "key" => "^(?<project_id>[0-9]+)\/milestone\/(?<package_milestone_id>[0-9]+)\/start$",
        "method" => "PATCH",
        "response_keys" => ["data"],
        "middleware" => [
            Procedure::get("fetchAndValidateProjectOwnershipById"),
            function($a) {
                $date = date("Y-m-d");
                $payload = ["actual_start_date" => $date];
                try {
                    $accountMilestone = Manager::getService("project")
                            ->fetch(sprintf("milestones/package-milestones/%s", $a->get("uriArgs.package_milestone_id")))
                            ->getShape('data')->get();

                    if(empty($accountMilestone)) {
                        throw new MiddlewareException("noEntityFound", "Package Milestone not found");
                    }

                    $milestoneLabel = $accountMilestone && isset($accountMilestone["label"]) ? $accountMilestone["label"] : "";

                    $res = Manager::getService('project')->write(
                        sprintf("milestones/package-milestones/%s/start", $a->get("uriArgs.package_milestone_id")),
                        new Shape(["data" => $payload])
                    );

                    $json = $res->get('json');

                    if($json->has("error")){
                        throw new MiddlewareException("updateMilestoneFailed", "failed to update the milestone because ".$json->get("error.friendly"));
                    }
                    if ($json) {
                        $a->set('logData', [
                            'user_id'     => $a->get('user.id') ?? 0,
                            'entity_id'   => $a->get('uriArgs.package_milestone_id'),
                            'entity_type' => 'package_milestone',
                            'type'        => sprintf("%s Started", $milestoneLabel),
                            'meta'        => json_encode([
                                'message'   => sprintf("Milestone %s Started", $milestoneLabel),
                                'user' => $a->get('user.display_name') ?? 'system',
                                'data' => [
                                    'previous' => [
                                        'planned_start_date' => $accountMilestone["planned_start_date"],
                                        'planned_end_date' => $accountMilestone["planned_end_date"],
                                        'actual_start_date' => $accountMilestone["actual_start_date"],
                                        'status' => MilestoneMiddleware::MILESTONE_NOT_STARTED_STATUS,
                                    ],
                                    'current' => [
                                        'actual_start_date' => $date,
                                        'status' => MilestoneMiddleware::MILESTONE_IN_PROGRESS_STATUS
                                    ]
                                ]
                            ]),
                        ]);
                        LogsMiddleware::createLogs('logData')($a);

                        $data = $json->get("data");
                        $a->set('data', $data);
                    }
                } catch (RestException $e) {
                    throw new MiddlewareException(
                        "restError",
                        $e->getMessage()
                    );
                }

            }
        ]
    ],
    [
        "key" => "^(?<project_id>[0-9]+)\/milestone\/(?<package_milestone_id>[0-9]+)\/complete$",
        "method" => "PATCH",
        "response_keys" => ["data"],
        "middleware" => [
            Procedure::get("fetchAndValidateProjectOwnershipById"),
            function($a) {
                $data = $a->getRoute()->getRequest()->getData();
                $requestData = $data->getShape('json')->get();

                if(!(isset($requestData['actual_end_date']) && $requestData['actual_end_date'])) {
                    throw new MiddlewareException("validationError", "Completion date is required.");
                }

                $payload = ["actual_end_date" => $requestData['actual_end_date']];

                try {
                    $accountMilestone = Manager::getService("project")
                        ->fetch(sprintf("milestones/package-milestones/%s", $a->get("uriArgs.package_milestone_id")))
                        ->getShape('data')->get();

                    if(empty($accountMilestone)) {
                        throw new MiddlewareException("noEntityFound", "Package Milestone not found");
                    }

                    $milestoneLabel = $accountMilestone && isset($accountMilestone["label"]) ? $accountMilestone["label"] : "";

                    $res = Manager::getService('project')->write(
                        sprintf("milestones/package-milestones/%s/complete", $a->get("uriArgs.package_milestone_id")),
                        new Shape(["data" => $payload])
                    );

                    $json = $res->get('json');

                    if($json->has("error")){
                        throw new MiddlewareException("updateMilestoneFailed", "failed to update the milestone because ".$json->get("error.friendly"));
                    }
                    if ($json) {
                        $a->set('logData', [
                            'user_id'     => $a->get('user.id') ?? 0,
                            'entity_id'   => $a->get('uriArgs.package_milestone_id'),
                            'entity_type' => 'package_milestone',
                            'type'        => sprintf("%s Completed", $milestoneLabel),
                            'meta'        => json_encode([
                                'message'   => sprintf("%s Completed", $milestoneLabel),
                                'user' => $a->get('user.display_name') ?? 'system',
                                'data' => [
                                    'previous' => [
                                        'planned_start_date' => $accountMilestone["planned_start_date"],
                                        'planned_end_date' => $accountMilestone["planned_end_date"],
                                        'actual_start_date' => $accountMilestone["actual_start_date"],
                                        'actual_end_date' => $accountMilestone["actual_end_date"],
                                        'status' => MilestoneMiddleware::MILESTONE_IN_PROGRESS_STATUS,
                                    ],
                                    'current' => [
                                        'actual_end_date' => $payload["actual_end_date"],
                                        'status' => MilestoneMiddleware::MILESTONE_COMPLETED_STATUS
                                    ]
                                ]
                            ]),
                        ]);
                        LogsMiddleware::createLogs('logData')($a);

                        $data = $json->get("data");

                        $packageMilestones = $data['milestones'] ?? [];

                        $milestone = [
                            "current" => [],
                            "next" => [],
                            "completed" => []
                        ];

                        if($packageMilestones) {
                            $pendingMilestones = array_values(array_filter($packageMilestones, fn($milestone) => $milestone['status'] !== 'Completed'));

                            $milestone["completed"] = array_values(array_filter($packageMilestones, fn($milestone) => $milestone['status'] === 'Completed'));

                            if(empty($pendingMilestones)) {
                                $milestone["current"] = $packageMilestones[count($packageMilestones) - 1];
                            } else {
                                $current = $pendingMilestones[0];
                                $milestone["current"] = $current;

                                // Find the next milestone by sort_order, regardless of status
                                $nextMilestones = array_values(array_filter(
                                    $packageMilestones,
                                    fn($m) => $m['sort_order'] > $current['sort_order']
                                ));

                                $milestone["next"] = $nextMilestones[0] ?? [];
                            }

                            $today = new DateTime();
                            foreach($milestone as &$m) {
                                if(isset($m['id'])) {
                                    $planned_end_date = new DateTime($m["planned_end_date"]);
                                    $interval = $today->diff($planned_end_date);
                                    $days_difference = (int)$interval->format('%R%a');

                                    if($milestone["next"] && $milestone["next"] !== 'Completed') {
                                        if ($days_difference < 0) {
                                            $m['lead_time_status'] = 'Overdue';
                                        } elseif ($days_difference <= 14) {
                                            $m['lead_time_status'] = 'Approaching';
                                        } else {
                                            $m['lead_time_status'] = 'On Track';
                                        }
                                    }

                                    $m['days_overdue'] = $m['lead_time_status'] === 'Overdue' ? abs($days_difference) : 0;
                                    $m['days_remaining'] = $days_difference;
                                }
                            }

                        }
                        $data['milestones'] = $milestone;
                        $a->set('data', $data);
                    }
                } catch (RestException $e) {
                    throw new MiddlewareException(
                        "restError",
                        $e->getMessage()
                    );
                }

            }
        ]
    ],
    [
        "id" => "fetch_project_package_milestones",
        "key" => "^(?<project_id>[0-9]+)\/package-milestones$",
        "method" => "GET",
        "description" => "Fetch all package milestones of a project",
        "response_keys" => "data",
        "middleware" => [
            function($a) {
                $packageIds = Manager::getService("project")
                        ->fetch(sprintf("project/%s/tender", $a->get("uriArgs.project_id")))
                        ->getCollection('data')->filterByField('state', 0, '!=')->getIds();

                $accountMilestones = Manager::getService("project")
                        ->fetch(sprintf("milestones/accounts/%s", $a->get("account.id")))
                        ->getShape('data')->get();

                $packageMilestones = Manager::getService("project")
                        ->fetch("milestones/package-milestones", ["package_ids" => implode(',', $packageIds)])
                        ->getShape('data')->get();

                $milestones = [];

                if($packageMilestones) {
                    foreach ($packageMilestones as $row) {
                        $milestones[$row['package_id']]["milestones"][] =  [
                            'id'        => $row['id'],
                            'label'     => $row['label'],
                            'sort_order'=> $row['sort_order'],
                            'lead_time' => $row['lead_time'],
                            'status'    => $row['status'],
                            'type' => $row['type'],
                        ];
                    }

                    foreach ($milestones as $packageId => $data) {
                        usort($milestones[$packageId]["milestones"], fn($a, $b) => $a['sort_order'] <=> $b['sort_order']);

                        $startedCount = count(array_filter($data["milestones"], fn($m) => $m['status'] !== 'Not Started'));
                        $milestones[$packageId]["started"] = $startedCount > 0;

                        // Remove status from each milestone
                        $milestones[$packageId]["milestones"] = array_map(function($m) {
                            unset($m['status']);
                            return $m;
                        }, $milestones[$packageId]["milestones"]);
                    }
                }

                $data = [
                    "package_milestones" => $milestones,
                    "account_milestones" => $accountMilestones
                ];

                $a->set("data", $data);
            }
        ]
    ]

];
