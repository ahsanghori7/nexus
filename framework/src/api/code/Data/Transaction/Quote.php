<?php

namespace Api\Data\Transaction;

use Core\Data\Collection;
use Core\Data\Shape;
use Api\Data\Transaction\Quote\Item;

class Quote extends Shape
{
    const NEW_QUOTE_ITEMS_KEY = "newItems";

    const EXISTING_QUOTE_ITEMS_KEY = "updateItems";

    //This should be quote_items really, but for now the front end expects quote
    const ITEMS_KEY = "quote";

    /**
     * @TODO store this in a table so we can retrieve them dynamically
     */
    public const TRANSACTION_MAIN_SECTIONS = [
        ["label" => 'Prelims',        "slug" => 'prelims',       "map" => "prelims"],
        ["label" => 'Measured work', "slug" => 'measured_work', "map" => "measured_work"],
        ["label" => 'Other items',    "slug" => 'other_items',   "map" => "other_items"]
    ];

    protected $breakdownKeys = [
        "tender_id",
        "type_id",
        "compliant",
        "price",
        "price_selected",
        "measured_work",
        "prelims",
        "other_items",
        "programme",
        "order_price",
        "status_id",
        "meta",
        "order_number",
        "archive",
        "quote_created",
        "order_created",
        "order_updated"
    ];

    public function getBreakDown() : Shape {
        return $this->keys($this->breakdownKeys);
    }

    /**
     * @return Collection
     */
    static public function getMainSectionHeadersCollection() : Collection {
        return new Collection(self::TRANSACTION_MAIN_SECTIONS, Shape::class);
    }

    /**
     * @return Collection
     * @throws \Exception
     */
    public function getItemsCollection() : Collection {
        return $this->getCollection(self::ITEMS_KEY, Item::class);
    }

    /**
     * @param Collection $items
     * @return $this
     * @throws \Exception
     *  Update the internal state of the shape for the quote key, which should be quote_items really as a TODO
     *  Flag which items have been changed
     *  We presume that if there is no id for a item it is new, and as such must not have a quote item for a boq_item
     *  This isnt handled here as this scenario should never happen, but would end up with two quote items for one boq_item
     */
    public function updateItems(Collection $items) : Quote {
        $quoteItemCollection = $this->getItemsCollection();
        $items = array_map(function($item){
            $result = [];
            foreach($item as $key => $value) {
                $value = $value === 'null' ? null : $value;
                $result[str_replace("'", "", $key)] = $value;
            }
            return new Shape($result);
        }, $items->getItemsAsArray());
        $new = [];
        foreach($items as $item) {
            $boqQuoteItemId      = $item->get("id", 0);
            if(!$boqQuoteItemId) { $quoteItemCollection->append($item); }
            else {
                $quoteItemCollection->map(function($quoteItem) use($boqQuoteItemId, &$item, &$new) {
                    if($quoteItem->int("id") === (int) $boqQuoteItemId) {
                        $quoteItem->setItems(array_merge($item->toArray()));
                        if($quoteItem->has("child")) {
                            $new[] = $quoteItem->get("child");
                        }
                    }
                    return $quoteItem;
                });
            }
        }

        //Add any newly created items to the collection
        foreach ($new as $newItem) {
            $quoteItemCollection->append($newItem->toArray());
        }

        $this->set(self::ITEMS_KEY, $quoteItemCollection);
        return $this;
    }

    /**
     * @param int $newStatus
     * @param int $filterStatus
     * @return $this
     * @throws \Exception
     */
    public function updateItemsStatus(int $newStatus, int $filterStatus ) : Quote {

        $this->set(self::ITEMS_KEY,
            $this->getItemsCollection()->map(function($i) use($newStatus, $filterStatus) {
                if($i->int("status_id") === $filterStatus) {
                    $i->set("status_id", $newStatus)->set("updated", true);
                }
                return $i;
            })
        );

        return $this;
    }

    /**
     * @return int
     * @throws \Exception
     */
    public function countUpdatedItems() : int {
        return $this->getItemsCollection()
                ->filterByField("updated", true, cast:"bool")
                ->count();
    }


    /**
     * @param $filterOnlyUpdated
     * @param $excludeNew
     * @return array[]
     * @throws \Exception
     * Return the quote items segmented by if they are new or existing, allow for filtering of both segments
     */
    public function getItemsForSave($filterOnlyUpdated=false) : array {

        $items = [
            self::NEW_QUOTE_ITEMS_KEY => [],
            self::EXISTING_QUOTE_ITEMS_KEY => [],
        ];

        foreach($this->getCollection("quote") as $item) {
            $id        = $item->get("id", false);
            $isNew     = !$id;
            $isUpdated = $item->get("updated", false);
            //If the $filterOnlyUpdated is true if the item has not been updated via the updateItems method or is new, i.e has no id
            if(($filterOnlyUpdated && !$isUpdated && !$isNew)) {
                continue;
            }
            $items[$isNew ? self::NEW_QUOTE_ITEMS_KEY : self::EXISTING_QUOTE_ITEMS_KEY][] = $item;
        }

        return $items;
    }
}
