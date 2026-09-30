<?php

namespace App\Models\Tender;

use App\Models\Abstraction;
use App\Models\Tender;

class Quote extends Abstraction
{
    public function getTender() {
        $data = $this->getData("tender", []);
        return new Tender($data, $data["id"] ?? null);
    }

    /**
     * @return array|mixed|null
     */
    public function getCurrentPrice() {
        $price      = $this->getData("price");
        $orderPrice = $this->getData("order_price");
        return ($orderPrice) ? $orderPrice : $price;
    }
}
