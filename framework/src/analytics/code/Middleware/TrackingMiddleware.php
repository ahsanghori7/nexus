<?php

namespace Analytics\Middleware;

use Analytics\EloquentService;
use Analytics\Model\TrackingAction;
use App\Models\Util;
use Core\Data\Shape;
use Core\Middleware\Collection as CollectionMiddleware;
use Core\Service\Manager;
use Core\Middleware\Exception as MiddlewareException;
use DateTime;

class TrackingMiddleware
{

    /**
     * @return EloquentService
     * @throws \Exception
     */
    public static function getEloquent(): EloquentService
    {
        $service = Manager::getService("eloquent");
        if ($service instanceof EloquentService) {
            return $service;
        }
        throw new \Exception("Invalid service class for Eloquence Service");
    }

    /**
     * @return callable
     */
    public static function track(): callable
    {
        return function ($action) {
            $data        = $action->getRoute()->getRequest()->getData();
            $json        = $data->getShape("json");
            $eloquent    = self::getEloquent();
            try{
                $type_id = (int)$eloquent->getModel("trackingActionType")
                    ->where("label", $json->get("type"))
                    ->first()->toArray()['id'];
                $eloquent->getModel("trackingAction")->create([
                    'account_id'              => $action->get("subcontractor.aid"),
                    'account_user_id'         => $action->get("subcontractor.id"),
                    'related_account_id'      => $json->get("user_account_id", $action->get("subcontractor.aid")),
                    'related_account_user_id' => $json->get("user_id"),
                    'action_type'             => $type_id
                ]);
            }catch (\Exception $e){
                throw new MiddlewareException(
                    "relayError",
                    $e->getMessage()
                );
            }
        };
    }

    /**
     * @param string $startDateKey
     * @param string $endDateKey
     * @return \Closure
     */
    public static function loadCollection(string $startDateKey = "args.start_date", string $endDateKey = "args.end_date")
    {
        return function ($action) use ($startDateKey, $endDateKey)  {
            $model = self::getEloquent()->getModel("trackingAction")
                ->with("type")->orderBy('action_date', 'ASC');
            if($action->get($startDateKey)){
                $model = $model->whereDate("action_date", ">=", $action->get($startDateKey));
            }
            if($action->get($endDateKey)){
                $model = $model->whereDate("action_date", "<=", $action->get($endDateKey));
            }
            $action->set("collection", $model->get()->toArray());
        };
    }

    /**
     * @param string $excludeAccountsKey
     * @param string $excludeRelatedAccountsKey
     * @return \Closure
     */
    public static function excludeAccounts(string $excludeAccountsKey = 'exclude_accounts', string $excludeRelatedAccountsKey = 'exclude_related_accounts')
    {
        return function ($action) use ($excludeAccountsKey, $excludeRelatedAccountsKey){
            CollectionMiddleware::reduce(function ($item) use ($action, $excludeAccountsKey, $excludeRelatedAccountsKey) {
                if($action->get($excludeAccountsKey)){
                    return in_array($item->get("account_id"), $action->get($excludeAccountsKey));
                }
                if($action->get($excludeRelatedAccountsKey)){
                    return in_array($item->get("related_account_id"), $action->get($excludeRelatedAccountsKey));
                }
                return true;
            })($action);
        };
    }

    /**
     * @param string $typeKey
     * @return \Closure
     */
    public static function trackingActions(string $typeKey = ''): \Closure
    {
        return function ($action) use($typeKey) {
            $data = [];
            $tracking  = [];
            $collection = $action->getCollection("collection");
            if ($collection->count()) {
                $trackingModel = new TrackingAction();
                foreach ($collection->getItems() as $item) {
                   $action_type = $item->get("type.label");
                   if(!str_starts_with($action_type, $action->get($typeKey))){
                       continue;
                   }
                   $trackingModel->setTrackingActionType($action_type);
                   $trackingModel->setTrackingCurrentItem($item);
                   $trackingModel->prepareActionData($data);

                   $ref = &$tracking;
                   $action_items = explode('.', $action_type);
                   $count = count($action_items) - 1;
                   foreach ($action_items as $key => $action_item) {
                       if ($key < $count){
                           $ref = &$ref[$action_item];
                           continue;
                       }
                       $data = $trackingModel->parseTrackingConfig();
                       $info = $data[$action_type]['info'];
                       $ref[$action_item]['info'][] = $info;
                       $ref[$action_item]['total']  = count($ref[$action_item]['info']);
                       $ref = $trackingModel->getTrackingAverageResponseTime($ref, $action_item);
                   }
                }
                $tracking = $trackingModel->setTrackingAverageDays($tracking);
            }
            $action->set("data", $tracking);
        };
    }
}
