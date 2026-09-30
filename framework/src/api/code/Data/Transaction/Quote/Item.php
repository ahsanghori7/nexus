<?php

namespace Api\Data\Transaction\Quote;
use Core\Data\Shape;

class Item extends Shape
{

    /**
     * @param array $data
     * @return void
     * If the Item has data already check to see if it has changes and crete a child with an updated version,
     * if is in draft state then just update
     * ToDo: I think there is some weakness with this logic and it doesnt work when you update a status, write some tests to cover
     */
    public function setItems(array $data) {
        if($this->hasData()) {
            $status  = $this->get("status_id", 1);
            $rate    = $this->get("rate");
            $newRate = $data["rate"] ?? false;
            //Handle rate changes
            if($newRate && ($rate !== $newRate)) {
                //ToDo: Incorperate ProjectEntity Status here
                //If the item has been published, and the rate changes, create a child with an incremented version
                //else set the flag as updated
                if($status > 2) {
                    $this->set("child",
                        $this->createNewVersion($this->int("version") + 1, ["rate" => $newRate])
                    );
                }
                else {
                    $this->set("rate",     $newRate);
                    $this->set("updated", true);
                }
            }
        }
        else {
            parent::setItems($data);
        }
        return $this;
    }


    /**
     * @param int $version
     * @return Shape
     * @throws \Exception
     * Clone the shape with a new version
     */
    public function createNewVersion(int $version, array $updates = []) {
        $child = new Item(
            array_merge($this->keys(["boq_item_id", "transaction_id"])->toArray(),
                ["version" => $version, "parent_id" => $this->get("id")],
                $updates
            )
        );
        return $child;
    }
}
