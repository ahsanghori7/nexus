<?php

namespace App\Domain\Account\Attribute;

use App\Domain\AbstractModel;

class Category extends AbstractModel
{

    const NAME = "attribute_category";

    protected $columns = [
        'id' => [
            'type' => 'int',
            'required' => true
        ],
        'label' => [
            'type' => 'string',
            'required' => true
        ],
        'type' => [
            'type' => 'string',
            'required' => true
        ],
        'group_id' => [
            'type' => 'int',
            'required' => false
        ],
        'region_code' => [
            'type' => 'string',
            'required' => false
        ]
    ];

    /**
     * @param array $filter
     * @param bool $return_only_attributes
     * @return array
     */
    public function getCategoryMappings(array $filter = [], bool $return_only_attributes = false): array
    {
        $accountId = (int) ($filter['group_id'] ?? 0);

        $sql = "SELECT ac.label as 'cat_label', ac.id as 'cat_id', ac.type, ac.region_code, ac.group_id, a.id, a.label, a.attribute_type_id FROM `attribute_category` ac ";
        $sql.= "JOIN attribute_category_mapping acm ON ac.id = acm.category_id ";
        $sql.= "JOIN attribute a ON acm.attribute_id = a.id";

        if(!empty($filter)){
            $sql .= " WHERE 1 = 1 ";
        }

        if(isset($filter['type'])){
            $sql .= " AND ac.type = '".$filter['type']."' ";
        }
        if(isset($filter['region_code'])){
            $sql .= " AND ac.region_code = '".$filter['region_code']."' ";
        }
        if($accountId){
            $sql .= sprintf(
                " AND (a.restricted_account_id IS NULL OR a.restricted_account_id = %d) ",
                $accountId
            );
        }

        $result = $this->getDB()::getAll($sql);
        $data   = [];
        foreach($result as $value){
            if($return_only_attributes){
                $data[] = [
                    "id"       => $value['id'],
                    "label"    => $value['label'],
                    "category" => $value['cat_label']
                ];
                continue;
            }
            $data[$value['cat_id']]['category']  = [
                "id"          => $value['cat_id'],
                "type"        => $value['type'],
                "label"       => $value['cat_label'],
                "region_code" => $value['region_code'],
                "group_id"    => $value['group_id'],
            ];
            $data[$value['cat_id']]['attributes'][] = [
                "id"    => $value['id'],
                "label" => $value['label']
            ];
        }

        return array_values($data);
    }
}
