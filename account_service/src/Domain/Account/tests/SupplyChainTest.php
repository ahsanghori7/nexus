<?php

use \App\Domain\Account\SupplyChain;


class SupplyMock extends SupplyChain {

    public function setTradeIndex(array $idx) {
        $this->tradeIndex = $idx;
    }

    public function getTradeIndex() : array {
        return $this->tradeIndex;
    }
}

class SupplyChainTest extends \PHPUnit\Framework\TestCase
{

    public function testCanMapRegions(){

        $model = new SupplyMock();
        $model->setTradeIndex([
            1 => [
                ["id" => 5],
                ["id" => 10]
            ]
        ]);
        $model->addRegionMapping([
            5 => [1,3,4]
        ]);
        $idx = $model->getTradeIndex();
        $this->assertEquals($idx[1][0]["region"], [1,3,4]);
        $this->assertEquals($idx[1][1]["region"], ["*"]);
    }
}
