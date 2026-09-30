<?php
namespace App\DocCreator;

class MiniBoq extends Table{

    /**
     * @var int
     */
    public CONST VAT = 20;

    /**
     * @var float
     */
    public static float $subtotal_cost = 0.00;

    /**
     * @var string
     */
    public const CLONE_HEADER_REMOVE_CLASS = 'light-purple';

    /**
     * @var string[]
     */
    public array $column = [
        'description',
        'quantity',
        'unit_price',
        'total'
    ];

    /**
     * @return array
     */
    public function getRows(): array
    {
        $index = self::APPEND_INDEX;
        $json = json_decode($this->getContent(), true);
        if($json){
            $currency_symbol = config('currency.symbol');
            $this->saveData("children", [$this->getData('children')[0]]);
            foreach($json as $k => $value){
                $children = $this->getFirstChildren();
                if(isset($children['columns'])){
                    $this->setColumns($children['columns']);
                }
                foreach ($this->getColumns() as $key => $column_key) {
                    $quantity   = (float)($json[$k]['quantity'] ?? null);
                    $unit_price = (float)($json[$k]['unit_price'] ?? null);
                    if($column_key === 'unit_price'){
                        $value[$column_key] = $currency_symbol . number_format($unit_price, 2);
                        if(!$unit_price){
                            self::childrenSetValue($children, $key, '&nbsp;');
                            continue;
                        }
                    }
                    elseif($column_key === 'quantity' && (!$quantity)){
                        self::childrenSetValue($children, $key, '&nbsp;'); //force the row to have space height
                        continue;
                    }
                    elseif($column_key === 'total' && ($unit_price || $quantity)){
                        $subtotal_cost = $quantity * $unit_price;
                        self::$subtotal_cost += $subtotal_cost;
                        $value[$column_key] = $currency_symbol . number_format($subtotal_cost, 2);
                    }
                    self::childrenSetValue($children, $key, $value[$column_key] ?? '');
                }
                $this->appendChildren($index, $children);
                $index++;
            }
            return $this->getData();
        }
        return [];
    }

    /**
     * @return array
     */
    public function getRowsTotal(): array
    {
        $subtotal = self::$subtotal_cost;
        $total    = $subtotal + (($subtotal * self::VAT) / 100);
        $this->data['children'][0]['children'][1]['children'][0] = config('currency.symbol') . number_format($subtotal, 2);
        $this->data['children'][2]['children'][1]['children'][0] = config('currency.symbol') . number_format($total, 2);
        return $this->getData();
    }
}
