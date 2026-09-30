<?php
    declare(strict_types=1);

    namespace App\Domain\Account;

    use App\Domain\AbstractTypedModel;

    class AccountGroupUserMapping extends AbstractTypedModel
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
      protected $table = 'account_group_user_mapping';

      protected $fillable = [
      'user_id',
      'account_group_id'
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
        'account_group_id' => [
          'type' => 'int',
          'required' => true
        ]
      ];

      public function getMappedAccountGroupsForUser(int $userId)
      {
          $sql = "SELECT ag.id, ag.label FROM account_group_user_mapping AS agum ";
          $sql .= "JOIN account_group AS ag ON agum.account_group_id = ag.id ";
          $sql .=  "WHERE agum.user_id = ".$userId;
          $result = $this->getDB()::getAll($sql);
          return $result;
      }

    }
