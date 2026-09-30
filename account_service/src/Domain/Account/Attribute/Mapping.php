<?php

namespace App\Domain\Account\Attribute;

use App\Domain\AbstractModel;

class Mapping extends AbstractModel
{
    const NAME = "account_attribute_mapping";

    protected $columns = [
        'id' => [
            'type' => 'int',
            'required' => true
        ],
        "account_id" => [
            'type' => 'int',
            'required' => true
        ],
        "group_id" => [
            'type' => 'int',
            'required' => true
        ],
        "attribute_id" => [
            'type' => 'int',
            'required' => true
        ],
        "created_at" => [
            'type' => 'datetime',
            'required' => true
        ]
    ];

    /**
     * @param int $accountId
     * @param array $groupIds
     * @param string $type
     * @return array
     */
    public function getAccountAttributeMappings(int $accountId, array $groupIds = [], ?string $type = null) {

        $sql = "SELECT a.id, aam.account_id, aam.group_id, a.label, at.label as attribute_type FROM account_attribute_mapping aam";
        $sql .= " JOIN attribute a on a.id = aam.attribute_id";
        $sql .= " JOIN attribute_type at on at.id = a.attribute_type_id";
        $sql .= " WHERE aam.account_id = $accountId";
        if ($groupIds) {
            $sql .= " AND aam.group_id IN (" . implode(",", $groupIds) . ")";
        }
        if($type) {
            $sql .= " AND at.label = '$type'";
        }
        $sql .= ";";


        if(method_exists($this->getDb(), 'getAll')) {
            $results = $this->getDb()::getAll($sql);
        }
        else {
            throw new \Exception("Database not found");
        }

        $data = [];
        foreach($results as $result) {
            $type = $result['attribute_type'];
            $data[$result['group_id']][$type][] = ["id" => $result['id'], "label" => $result['label']];
        }

        return $data;
    }
}
