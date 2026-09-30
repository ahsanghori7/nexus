<?php

namespace App\Models\Trade;

use App\Models\Abstraction;
use App\Models\Collection;
use App\Models\Base;
use App\Api\Project as ProjectApi;

class Category extends Abstraction
{
    public function getTrades() {
        $trades = $this->data["trades"] ?? [];
        return new Collection(
            array_map(function($k, $v) { return ["id" => $k, "label" => $v]; },
                array_keys($trades), $trades),
            Base::class
        );
    }

    /**
     * @param string $category_rules
     * @param array $categories
     * @return array
     * @throws \App\Api\Exception
     */
    public function parseRules(string $category_rules, array $categories = []): array
    {
        $rules = [];
        if(!$categories){
            $categories = ProjectApi::getConstants()->getData()['default_categories'] ?? [];
        }
        foreach($categories as $key => $value){
            $rules[$value] = true;
        }
        foreach(str_split($category_rules) as $key => $trade){
            $keys = array_keys($rules);
            if(isset($keys[$key])) {
                $rules[$keys[$key]] = (bool)$category_rules[$key];
            }
        }
        return $rules;
    }

    /**
     * @return Collection
     * @throws \App\Api\Exception
     */
    public function getRules(): Collection
    {

        $rules = $this->parseRules($this->data['rules'] ?? '');
        $trades = [];
        foreach($this->data["trades"] as $key => $trade){
            $trades[$key] = $rules;
        }

        return new Collection(
            array_map(function($k, $v) { return ["id" => $k, "rules" => $v]; },
                array_keys($trades), $trades),
            Base::class
        );
    }
}
