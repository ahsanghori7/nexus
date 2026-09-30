<?php


namespace Prosper\Middleware\Relay;

class TradeMiddleware
{
    /**
     * @param string $categoriesKey
     * @return callable
     */
    public static function loadTradeCategories(string $categoriesKey = 'trades_categories'): callable
    {
        return function ($action) use ($categoriesKey) {
            $action->get($categoriesKey)->map(function($item){
                return [
                    'id'    => $item->get("category_id"),
                    'label' => $item->get("label")
                ];
            });
        };
    }

    /**
     * @param string $categoriesIds
     * @param string $categoriesTrades
     * @param string $tradesResultKey
     * @return callable
     */
    public static function getTradesForParentCategory(string $categoriesIds, string $categoriesTrades, string $tradesResultKey = 'trades'): callable
    {
        return function ($action) use ($categoriesIds, $categoriesTrades, $tradesResultKey) {
            $categories_ids = $action->get($categoriesIds);
            $categories = $action->get($categoriesTrades)->getItems();
            $trades = [];
            foreach($categories_ids as $id){
                if(isset($categories[$id])){
                    foreach($categories[$id]->get("trades") as $trade_id => $trade){
                        $trades[] = $trade_id;
                    }
                }
            }
            $action->set($tradesResultKey, $trades);
        };
    }

    /**
     * @param string $ids
     * @param string $categoriesTrades
     * @param string $tradesResultKey
     * @return callable
     */
    public static function getTradesParentFromTradeIds(string $ids, string $categoriesTrades, string $tradesResultKey = 'trades'): callable
    {
        return function ($action) use ($ids, $categoriesTrades, $tradesResultKey) {
            try{
                $ids = $action->get($ids);
                $categories = $action->get($categoriesTrades)->getItems();
                foreach($categories as $key => $trades){
                    foreach($trades->get("trades", []) as $key_trade => $trade){
                        if(in_array($key_trade, $ids)){
                            $cids[] = $key;
                        }
                    }
                }
            }catch (\Exception $e){
                $cids = [];
            }
            $action->set($tradesResultKey, array_unique($cids ?? []));
        };
    }
}
