<?php
namespace App\Utility;

class Arrays{

    public static function safe_json_encode(array $array = [])
    {
        array_walk_recursive(
          $array,
          function (&$entry) {
            $entry = mb_convert_encoding(
                $entry,
                'UTF-8'
            );
          }
        );

        return json_encode($array);
    }

    public static function sort(&$array = [], $keys = [], $sort_types = [], $sort_natural = false){

        if(!is_array($array)){
            return $array;
        }

        if(empty($sort_types))
        {
            $sort_types = SORT_ASC;
        }

        if(is_array($keys)){
            if(count($keys) == 1){
                if($sort_natural == true){
                    array_multisort(array_column($array, $keys[0]), $sort_types[0], SORT_NATURAL|SORT_FLAG_CASE, $array);
                }else{
                    array_multisort(array_column($array, $keys[0]), $sort_types[0], $array);
                }
            }else if(count($keys) == 2){
                if($sort_natural == true){
                    array_multisort(
                        array_column($array, $keys[0]), $sort_types[0], SORT_NATURAL|SORT_FLAG_CASE,
                        array_column($array, $keys[1]), $sort_types[1],
                    $array);
                }else{
                    array_multisort(
                        array_column($array, $keys[0]), $sort_types[0],
                        array_column($array, $keys[1]), $sort_types[1],
                    $array);
                }
            }else if(count($keys) == 3){
                if($sort_natural == true){
                    array_multisort(
                        array_column($array, $keys[0]), $sort_types[0], SORT_NATURAL|SORT_FLAG_CASE,
                        array_column($array, $keys[1]), $sort_types[1],
                        array_column($array, $keys[2]), $sort_types[1],
                    $array);
                }else{
                    array_multisort(
                        array_column($array, $keys[0]), $sort_types[0],
                        array_column($array, $keys[1]), $sort_types[1],
                        array_column($array, $keys[2]), $sort_types[1],
                    $array);
                }
            }
        }else{
            if($sort_natural == true){
                array_multisort(array_column($array, $keys), $sort_types, SORT_NATURAL|SORT_FLAG_CASE ,$array);
            }else{
                array_multisort(array_column($array, $keys), $sort_types ,$array);
            }
        }

        return $array;

    }
}
