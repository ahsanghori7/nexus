<?php

namespace Api\Data\Transaction;

use Api\Model\BoQ;

/**
 * TODO: This should really be called TransactionCollection, in each transaction we have a quote key that has items,
 * the naming is confusing and should be altered to avoid issues
 */
class QuoteCollection extends \Core\Data\Collection
{

    /***
     * Override so we can force a Shape Override
     * @param array $items
     * @param string $objectClass
     * @throws \Exception
     */
    public function __construct(array $items, string $objectClass = Quote::class)
    {
        parent::__construct($items, $objectClass);
    }

    /**
     * Return a list of Quotes and a breakdown by filtered by a callback
     * @param callable $filter
     * @return array
     * @throws \Exception
     */
    public function getItemsAndBreakdownByFilter(callable $filter) : array {
        $items = [];
        foreach($this as $quote) {
            $sid = $quote->get("subcontractor_id");
            foreach($quote->getCollection("quote") as $item) {
                if($filter($item)) {
                    $items[$sid]["items"] = $item;
                    if(!isset($items[$sid]["breakdown"])) {
                        $items[$sid]["breakdown"] = $quote->getBreakDown();
                    }
                }
            }
        }
        return $items;
    }

    /**
     * Return a list of subcontractor ids
     * @return array
     */
    public function getSubcontractorIds(callable $callback = null) : array {
        $sids = array_filter($this->values("subcontractor_id"), function ($id) {
            return $id > 0;
        });
        if($callback) {
            $callback($sids);
        }
        return $sids;
    }
}
