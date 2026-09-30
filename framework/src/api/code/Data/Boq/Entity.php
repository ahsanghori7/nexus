<?php

namespace Api\Data\Boq;

use \Core\Data\Shape;
use Api\Data\Transaction\QuoteCollection;

class Entity extends Shape
{

    const SECTION_TYPE = "section";

    const ITEM_TYPE = "item";

    /**
     * @param QuoteCollection $quotes
     * @return void
     * @throws \Exception
     *
     * Given a collection of quotes, loop though each boq entry and match up the items by boq_item_id
     * and assign add each of the quotes as well as the breakdown items from the top level transaction
     */
    public function collectQuotes(QuoteCollection $quotes) {

        $entries = [];
        foreach ($this->getCollection("entries") as $entry) {

            foreach ($entry->getCollection("item_mappings") as $mappings) {
                $itemId = $mappings->int("boq_item_id");
                $quoteItems =  $quotes->getItemsAndBreakdownByFilter(function ($quoteItem) use ($itemId) {
                    return $quoteItem->int("boq_item_id") === $itemId;
                });

                $entry->set("item_mappings", $mappings->set("quotes", $quoteItems));
            }
            $entries[] = $entry;
        }
        $this->set("entries", $entries);
        return $this;
    }


    /**
     * @return Shape
     * @throws \Exception
     * Group BOQ entries by section description
     */
    public function getEntriesBySection() : array {

        $entries  = $this->getCollection("entries")->sortBy("item_mapping.position");
        $sections = [];
        $section  = "";
        foreach($entries as $entry) {
            $mapping = $entry->getShape("item_mappings");
            $type = $mapping->get("type");
            if($type === $this::SECTION_TYPE) {
                $section = strtolower(str_replace(" ", "_", trim($mapping->get("description"))));
            }

            if ($type === $this::ITEM_TYPE && $section) {
                $sections[$section][$type][] = $entry;
            }
        }
        return $sections;
    }

    /**
     * @param QuoteCollection $quotes
     * @param $asPenny
     * @return Shape
     * @throws \Exception
     * Return an array with the sum of all quotes for a section headers and
     * a grand total of all sub-totals, also allow for values to be
     * cast as penny value
     */
    public function sumQuotesBySection(QuoteCollection $quotes, $asPenny = false, callable $typeMap = null) : Shape {
       $sections = $this->collectQuotes($quotes)->getEntriesBySection();
       $totals = array_fill_keys(array_keys($sections), 0);
       foreach ($sections as $sectionType => $section) {
           foreach($section[$this::ITEM_TYPE] ?? [] as $item) {
               $quotes = $item->get("item_mappings.quotes");
               $qty    = $item->get("item_mappings.quantity");
               foreach ($quotes as $items) {
                   foreach($items as $item) {
                       $rate  = floatval($item->get("rate", 0.0));
                       $t = ($asPenny) ? ($rate * $qty * 100) : ($rate * $qty);
                       $key = $sectionType;
                       if($typeMap) {
                           $key  = $typeMap($sectionType);
                       }
                       if(isset($totals[$key])) {
                           $totals[$key] += $t;
                       }
                   }
               }
           }
       }

       $totals["price"] = array_sum($totals);
       return new Shape($totals);
    }
}
