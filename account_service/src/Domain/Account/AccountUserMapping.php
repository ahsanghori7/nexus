<?php


namespace App\Domain\Account;

use App\Domain\Account\Account;
use App\Domain\User\User;
use App\Domain\AbstractModel;

class AccountUserMapping extends AbstractModel
{
    /**
     * @var array
     */
    protected $columns = [
        'id' => [
            'type' => 'int',
            'required' => true
        ],
        'user_id' => [
            'type' => 'int',
            'required' => true
        ],
        'account_id' => [
            'type' => 'int',
            'required' => true
        ],
       'mapping_type_id' => [
            'type' => 'int',
            'required' => true
        ],
        'user_firstname' => [
            'type' => 'string',
            'required' => true
        ],
        'user_lastname' => [
            'type' => 'string',
            'required' => true
        ],
        'user_contact_number' => [
            'type' => 'string',
            'required' => true
        ],
        'is_main_contact' => [
            'type' => 'boolean',
            'required' => false,
            'default' => false
        ],
    ];

    /**
     * @return string
     */
    public function getMappingType()
    {
        return $this->mapping_type;
    }

    public function getAccountUserMappings(int $account_id, string $type, array $childIds = []) {

        $sql = "SELECT u.*, au.user_firstname as firstname, au.user_lastname as lastname, au.user_contact_number as contact_number, au.is_main_contact, CONCAT(au.user_firstname, ' ', au.user_lastname) AS display_name ,  ut.label as user_type FROM account_user_mapping au ";
        $sql.= "JOIN account_user_mapping_type aut on aut.id = au.mapping_type_id ";
        $sql.= "JOIN user u on u.id = au.user_id ";
        $sql.= "JOIN role ut on ut.id = u.type_id ";
        $sql.= "WHERE aut.label = '$type' AND au.account_id = $account_id";
        if($childIds) {
            $sql .= " AND u.account_id IN (" . implode(",", $childIds) . ")";
        }
        $result = $this->getDB()::getAll($sql);

        $data = [];
        foreach($result as $row) {
            unset($row["password"]);
            $data[$row['account_id']][] = $row;
        }
        return $data;
    }
}
