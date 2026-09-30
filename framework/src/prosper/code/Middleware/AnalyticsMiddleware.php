<?php

namespace Prosper\Middleware;

use Core\Data\Shape;
use Core\Middleware\ServiceMiddleware;
use Core\Service\Manager;

class AnalyticsMiddleware extends ServiceMiddleware
{

    public const SERVICE = 'analytics';

    /**
     * @param string $typeKey
     * @param string $accountIdKey
     * @param string $relatedAccountIdKey
     * @param string $accountUserIdKey
     * @param string $relatedAccountUserIdKey
     * @return callable
     */
    public static function track(string $typeKey, string $accountIdKey, string $relatedAccountIdKey, string $accountUserIdKey = '', string $relatedAccountUserIdKey = ''): callable
    {
        return function (Shape $action) use ($typeKey, $accountIdKey, $relatedAccountIdKey, $accountUserIdKey, $relatedAccountUserIdKey){
            try{
                $data = [
                    'account_id'              => $action->get($accountIdKey),
                    'related_account_id'      => $action->get($relatedAccountIdKey),
                    'account_user_id'         => ($accountUserIdKey)        ? $action->get($accountUserIdKey)        : null,
                    'related_account_user_id' => ($relatedAccountUserIdKey) ? $action->get($relatedAccountUserIdKey) : null,
                    'action_type'             => $typeKey
                ];
                $res = Manager::getService('analytics')->write("analytics/tracking", new Shape(['data' => $data]));
                $content = $res->get("content");
                $json    = is_string($content) ? json_decode($content, true) : [];
                $success = $json['success'] ?? false;
                $messsage = $res;
            }catch (\Exception $e){
                $success = false;
                $messsage = $e;
            }

            if(!$success){
                Manager::getService('sns')->sendException('tracking_error', 'Tracking error', new Shape(array_merge(
                    $data,
                    ['message' => $messsage],
                )));
            }
        };
    }
}
