<?php

use Api\Middleware\ApprovalMiddleware;
use Core\Middleware\Procedure;
use Api\Middleware\ProjectMiddleware;
use Core\Service\Manager;
use Api\Middleware\TenderRecommendationMiddleware;
use Core\Middleware\Service\AccountMiddleware;
use Core\Middleware\Exception as MiddlewareException;

//ToDo: Store Actions as a Class Method reference, rather than a call back so that args can be override later on
Procedure::registerActions("fetchAndValidateProjectOwnershipById",
    [
       "fetchProject"    => ProjectMiddleware::fetchProject("id", "uriArgs.project_id"),
       "accountIsTypeOf" => AccountMiddleware::ifIsATypeOf(AccountMiddleware::MAIN_CONTRACTOR_TYPE, function($a, $isType) {
            ProjectMiddleware::checkProjectOwnershipById()($a);
        }, onlyCallbackOnTrue:true)
    ]
);

Procedure::registerActions("fetchAndValidateProjectById",
    [
       "fetchProject"    => ProjectMiddleware::fetchProject("id", "uriArgs.project_id")
    ]
);

Procedure::registerActions("fetchTenderRecommendations", [
    ProjectMiddleware::fetchProject("id", "uriArgs.project_id"),
    function ($a) {
        return $a->httpRequest([
            "uri"         => "project/{$a->get('project.id')}/tender_recommendation",
            "method"      => "GET",
            "responseKey" => "data",
        ]);
    }
]);

Procedure::registerActions("fetchTenderRecommendationById", [
    ProjectMiddleware::fetchProject("id", "uriArgs.project_id"),
    function ($a) {
        return $a->httpRequest([
            "uri"         => "project/{$a->get('project.id')}/tender_recommendation/{$a->get('uriArgs.id')}",
            "method"      => "GET",
            "responseKey" => "data",
        ]);
    }
]);

Procedure::registerActions("fetchAndValidateTenderRecommendationById", [
    "validateInput" => function ($a) {
        $tenderRecId = $a->get('uriArgs.id');

        // Validate input parameters
        if (!is_numeric($tenderRecId) || $tenderRecId <= 0) {
            throw new \Exception("Invalid tender recommendation ID");
        }
    },
    "fetchTenderRecommendation" => function ($a) {
        $tenderRecId = $a->get('uriArgs.id');
        $projectId = $a->get('project.id');

        try {
            // Fetch tender recommendation using the project service
            $response = Manager::getService("project")->fetch(
                "project/{$projectId}/tender_recommendation/{$tenderRecId}"
            );

            // Get the tender recommendation data
            $tenderRec = $response->get('data');
            if (!$tenderRec || empty($tenderRec)) {
                throw new \Exception("Tender recommendation not found or access denied");
            }

            // Additional validation: ensure the tender recommendation belongs to the project
            $tenderRecData = is_array($tenderRec) ? $tenderRec : $tenderRec->toArray();
            if (isset($tenderRecData['project_id']) && (int)$tenderRecData['project_id'] !== (int)$projectId) {
                throw new \Exception("Tender recommendation does not belong to the specified project");
            }

            // Store the tender recommendation in the action for later use
            $a->set('tender_recommendation', $tenderRec);

        } catch (\Exception $e) {
            throw new \Exception("Failed to fetch tender recommendation: " . $e->getMessage());
        }
    }
]);

Procedure::registerActions("validateUniqueTenderRecommendation", [
    function ($a) {
        $projectId = $a->get('project.id');
        $request = $a->getRoute()->getRequest();
        $json = $request->getData()->getShape('json');
        $response = Manager::getService("project")->fetch(
            "project/{$projectId}/tender_recommendation/active", ['tender_id'=> $json->get('tender_id')]
        );

        if($response->getShape("data")->count() > 0){

            throw new MiddlewareException(
                "TenderRecommendationAlreadyActive",
                "A tender recommendation for this package already exists with an active status. Please cancel existing recommendations before creating a new one."
            );
        }

        return true;
    }
]);

Procedure::registerActions("fetchAndValidateTenderRecommendationOwnershipById",
    [
       "fetchTenderRecommendation"              => TenderRecommendationMiddleware::fetchTenderRecommendation(),
       "checkTenderRecommendationOwnership"     => TenderRecommendationMiddleware::checkTenderRecommendationOwnershipById()
    ]
);

Procedure::registerActions("fetchAndValidateApprovalById",
    [
       "fetchApproval" => ApprovalMiddleware::fetchApproval()
    ]
);
