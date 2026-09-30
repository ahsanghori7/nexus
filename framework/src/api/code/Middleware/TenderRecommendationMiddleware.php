<?php

namespace Api\Middleware;

use App\Domain\Account\Manage;
use Core\Data\Shape;
use Core\Service\Manager;
use Core\Middleware\Exception as MiddlewareException;
use Core\Middleware\Rest;
use Core\Router\Route\Action;
use Api\Service\TenderRecommendationAttachmentService;

class TenderRecommendationMiddleware{

    /**
     * @param string $trIdKey
     * @param string $resultKey
     * @return \Closure
     *
     * Usage:
     * $action->get('tender_recommendation')
     */
    public static function fetchTenderRecommendation(string $trIdKey = "uriArgs.tr_id", string $resultKey = 'tender_recommendation'): \Closure
    {
        return function (Shape $action) use ($trIdKey, $resultKey) {
            try {
                return Rest::fetchDynamic(
                    "project",
                    sprintf("project/{project.id}/tender_recommendation/{%s}", $trIdKey),
                    [],
                    $resultKey,
                    postProcessor: function ($res, $a) use ($resultKey) {
                        if ($res) {
                            $dataShape = $res->getCollection("data")->first();
                            $a->set($resultKey, $dataShape);
                        }
                    })($action);
            } catch (\Exception $e) {
                throw new MiddlewareException("noEntityFound", $e->getMessage());
            }
        };
    }

    /**
     * @param string $trIdKey
     * @param string $trDataKey
     * @param string $resultKey
     * @return \Closure
     *
     */
    public static function updateTenderRecommendation(string $trIdKey = "uriArgs.tr_id", string $trDataKey = "payload", string $resultKey = 'tender_recommendation'): \Closure
    {
        return function (Shape $action) use ($trIdKey, $trDataKey, $resultKey) {
            try {
                return Rest::update(
                    "project",
                    sprintf("project/{project.id}/tender_recommendation/{%s}", $trIdKey),
                    $trDataKey,
                    responseKey: $resultKey)($action);
            } catch (\Exception $e) {
                throw new MiddlewareException("noEntityFound", $e->getMessage());
            }
        };
    }


    /**
     * @param string $trUserIdKey
     * @param string $testKey
     * @return \Closure
     */
    public static function checkTenderRecommendationOwnershipById(string $trUserIdKey = "tender_recommendation.author_id", string $testKey = 'user.id'): \Closure
    {
        return function (Shape $action) use ($trUserIdKey, $testKey) {
            if ($trUserIdKey) {
                if ($action->int($trUserIdKey) === $action->int($testKey)) {
                    return true;
                }

                throw new MiddlewareException("tenderRecommendationOwnershipError", "You don't have access to the Tender Recommendation.");

            }
        };
    }

    public static function uploadAttachments(Action $a): void
    {
        $service = new TenderRecommendationAttachmentService();
        $service->upload($a);
    }

    public static function uploadExisting(Action $a): void
    {
        $service = new TenderRecommendationAttachmentService();
        $service->uploadExisting($a);
    }

    public static function getAttachments(Action $a): void
    {
        $service = new TenderRecommendationAttachmentService();
        $service->getAttachments($a);
    }

    public static function removeAttachments(Action $a): void
    {
        $service = new TenderRecommendationAttachmentService();
        $service->removeAttachments($a);
    }

    public static function getAttachmentsForDownloadManager(Action $a): void
    {
        $service = new TenderRecommendationAttachmentService();
        $service->getAttachmentsForDownloadManager($a);
    }

    public static function downloadAttachment(Action $a): void
    {
        $service = new TenderRecommendationAttachmentService();
        $service->downloadAttachment($a);
    }

    public static function downloadAttachmentsAsZip(Action $a): void
    {
        $service = new TenderRecommendationAttachmentService();
        $service->downloadAttachmentsAsZip($a);
    }
}
