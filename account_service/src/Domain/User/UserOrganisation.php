<?php


namespace App\Domain\User;

use App\Domain\AbstractTypedModel;

class UserOrganisation extends AbstractTypedModel
{
    /**
     * @var string
     */
    protected $typeModel = UserOrganisationType::class;

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
            'isNull' => true,
            'required' => true
        ],
        'account_id' => [
            'type' => 'int',
            'required' => false
        ],
            'ur.account_id' => [
            'type' => 'int',
            'required' => false
        ],
        "user_firstname" => [
            "type" => "string",
            "required" => false
        ],
        "user_lastname" => [
            "type" => "string",
            "required" => false
        ],
        "user_email" => [
            "type" => "string",
            "required" => false
        ],
        "user_phone" => [
            "type" => "string",
            "required" => false
        ],
        "type_id" => [
            'type' => 'int',
            'required' => true
        ],
        "custom_type_label" => [
            "type" => "string",
            "required" => false
        ],
    ];

    /**
     * @param array|string[] $cols
     * @return string
     * @throws \ReflectionException
     */
    public function getSelect (array $cols = ["*"]): string
    {
        $columns = [
            'ur.*',
            'u.email',
            'u.firstname',
            'u.lastname',
            'u.contact_number',
            'urt.label'
        ];
        $sql = sprintf("SELECT %s FROM %s",
            implode(",", $columns), $this->getName() . " ur"
        );
        $sql .= ' left join user u on ur.user_id = u.id';
        $sql .= ' left join user_organisation_type urt on urt.id = ur.type_id';

        return $sql;
    }
}
