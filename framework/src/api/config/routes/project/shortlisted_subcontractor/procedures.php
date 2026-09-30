<?php

use Core\Middleware\Procedure;
use Api\Middleware\ProjectMiddleware;
use Core\Service\Manager;
use Core\Middleware\Exception as MiddlewareException;

/**
 * Validate that package belongs to project
 */
Procedure::registerActions("fetchAndValidatePackageByProject", [
    function ($a) {
        $projectId = (int) $a->get("uriArgs.project_id");
        $tenderId = (int) $a->get("uriArgs.tender_id");

        if (!$projectId || !$tenderId) {
            throw new MiddlewareException(
                "InvalidRouteParams",
                "Project ID and Tender ID are required"
            );
        }

        $project = $a->get("project");
        $tenders = $project?->get("tender");
        $matched = false;

        if (is_array($tenders)) {
            foreach ($tenders as $tender) {
                if ((int)$tender["id"] === $tenderId) {
                    $matched = true;
                    break;
                }
            }
        }

        if (!$matched) {
            throw new MiddlewareException(
                "PackageNotInProject",
                "Package does not belong to this project"
            );
        }

        return true;
    }
]);
