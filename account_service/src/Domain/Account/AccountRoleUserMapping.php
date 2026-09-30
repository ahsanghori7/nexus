<?php
    namespace App\Domain\Account;

    use App\Domain\AbstractTypedModel;

    class AccountRoleUserMapping extends AbstractTypedModel
    {
      /**
       * Indicates if the model should be timestamped.
       *
       * @var bool
       */
      public $timestamps = false;

      /**
       * The table associated with the model.
       *
       * @var string
       */
      protected $table = 'account_role_user_mapping';

      protected $fillable = [
      'user_id',
      'account_role_id'
      ];

      /**
       * @var array
       */
      protected $columns = [
        'id' => [
          'type' => 'int'
        ],
        'user_id' => [
          'type' => 'int',
          'required' => true
        ],
        'account_role_id' => [
          'type' => 'int',
          'required' => true
        ]
      ];

      public function getMappedAccountRolesForUser(int $userId)
      {
          $sql = "SELECT ar.id, ar.account_id, ar.label, ar.description FROM account_role_user_mapping AS arm ";
          $sql .= "JOIN account_role AS ar ON arm.account_role_id = ar.id ";
          $sql .=  "WHERE arm.user_id = ".$userId;
          return $this->getDB()::getAll($sql);
      }

    }
