<?php

namespace Api\Middleware;

use App\Domain\Account\Manage;
use Core\Data\Shape;
use Core\Service\Manager;
use Core\Middleware\Exception as MiddlewareException;
use Core\Middleware\Rest;

class LogsMiddleware{

    /**
     * Create Tender Recommendation log
     * @param string $postDataKey
     * @return \Closure
    */
    public static function createLogs(string $postDataKey = 'logData'): \Closure
    {
        return function (Shape $action) use ($postDataKey) {
            try {
                $logData = $action->get($postDataKey);

                if (empty($logData)) {
                    throw new MiddlewareException("MissingLogData", "No log data provided");
                }

                // Handle multiple logs
                if (isset($logData[0]) && is_array($logData[0])) {
                    foreach ($logData as $logEntry) {
                        Manager::getService("project")->write("/logs", new Shape(['data' => $logEntry]));
                    }
                } else {
                    Manager::getService("project")->write("/logs", new Shape(['data' => $logData]));
                }
            } catch (\Exception $e) {
                throw new MiddlewareException("TenderRecommendationLogError", $e->getMessage());
            }
        };
    }

}
