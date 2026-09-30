<?php

use App\Models\Trade\Category as TradeCategory;
use PHPUnit\Framework\TestCase;

class TradeCategoryMock extends TradeCategory
{

    public function parseRules(string $category_rules, array $categories = []): array
    {
        return parent::parseRules($category_rules, [
            'Architectural',
            'Structural',
            'M&E'
        ]);
    }
}

class TestTradeCategory extends TestCase {


    public function setRules(string $rules)
    {
        $category = new TradeCategoryMock;

        $category->setData('trades', [
            35
        ]);
        $category->setData('rules', $rules);

        $rules = $category->getRules()->getValues('rules');
        $rules = array_shift($rules);
        return $rules;
    }

    public function parseRules(string $rules)
    {
        $category = new TradeCategoryMock;

        $category->setData('trades', [
            35
        ]);
        $category->setData('rules', $rules);
        return $category->parseRules($rules,[
            'Architectural',
            'Structural',
            'M&E'
        ]);
    }

    public function testParseRules() {


        $rules = $this->parseRules('111');
        $this->assertEquals(1, $rules['Architectural']);
        $this->assertEquals(1, $rules['Structural']);
        $this->assertEquals(1, $rules['M&E']);

        $rules = $this->parseRules('110');
        $this->assertEquals(1, $rules['Architectural']);
        $this->assertEquals(1, $rules['Structural']);
        $this->assertEquals(0, $rules['M&E']);


        $rules = $this->parseRules('100');
        $this->assertEquals(1, $rules['Architectural']);
        $this->assertEquals(0, $rules['Structural']);
        $this->assertEquals(0, $rules['M&E']);


        $rules = $this->parseRules('101');
        $this->assertEquals(1, $rules['Architectural']);
        $this->assertEquals(0, $rules['Structural']);
        $this->assertEquals(1, $rules['M&E']);


        $rules = $this->parseRules('000');
        $this->assertEquals(0, $rules['Architectural']);
        $this->assertEquals(0, $rules['Structural']);
        $this->assertEquals(0, $rules['M&E']);


        $rules = $this->parseRules('011');
        $this->assertEquals(0, $rules['Architectural']);
        $this->assertEquals(1, $rules['Structural']);
        $this->assertEquals(1, $rules['M&E']);


        $rules = $this->parseRules('010');
        $this->assertEquals(0, $rules['Architectural']);
        $this->assertEquals(1, $rules['Structural']);
        $this->assertEquals(0, $rules['M&E']);


        $rules = $this->parseRules('001');
        $this->assertEquals(0, $rules['Architectural']);
        $this->assertEquals(0, $rules['Structural']);
        $this->assertEquals(1, $rules['M&E']);

    }

    public function testGetRules() {


        $rules = $this->setRules('111');
        $this->assertEquals(1, $rules['Architectural']);
        $this->assertEquals(1, $rules['Structural']);
        $this->assertEquals(1, $rules['M&E']);

        $rules = $this->setRules('110');
        $this->assertEquals(1, $rules['Architectural']);
        $this->assertEquals(1, $rules['Structural']);
        $this->assertEquals(0, $rules['M&E']);


        $rules = $this->setRules('100');
        $this->assertEquals(1, $rules['Architectural']);
        $this->assertEquals(0, $rules['Structural']);
        $this->assertEquals(0, $rules['M&E']);


        $rules = $this->setRules('101');
        $this->assertEquals(1, $rules['Architectural']);
        $this->assertEquals(0, $rules['Structural']);
        $this->assertEquals(1, $rules['M&E']);


        $rules = $this->setRules('000');
        $this->assertEquals(0, $rules['Architectural']);
        $this->assertEquals(0, $rules['Structural']);
        $this->assertEquals(0, $rules['M&E']);


        $rules = $this->setRules('011');
        $this->assertEquals(0, $rules['Architectural']);
        $this->assertEquals(1, $rules['Structural']);
        $this->assertEquals(1, $rules['M&E']);


        $rules = $this->setRules('010');
        $this->assertEquals(0, $rules['Architectural']);
        $this->assertEquals(1, $rules['Structural']);
        $this->assertEquals(0, $rules['M&E']);


        $rules = $this->setRules('001');
        $this->assertEquals(0, $rules['Architectural']);
        $this->assertEquals(0, $rules['Structural']);
        $this->assertEquals(1, $rules['M&E']);

    }

}
