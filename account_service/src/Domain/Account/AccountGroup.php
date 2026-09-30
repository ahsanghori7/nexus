<?php
    declare(strict_types=1);

    namespace App\Domain\Account;

    use App\Domain\AbstractTypedModel;

    class AccountGroup extends AbstractTypedModel
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
      protected $table = 'account_group';

      protected $fillable = [
        'account_id',
        'label',
        'logo',
        'address'
      ];

      /**
       * @var array
       */
      protected $columns = [
        'id' => [
          'type' => 'int'
        ],
        'account_id' => [
          'type' => 'int',
          'required' => true
        ],
        'label' => [
          'type' => 'string',
          'required' => true
        ],
        'logo' => [
          'type' => 'string',
          'required' => false
        ],
        'address' => [
          'type' => 'string',
          'required' => false
        ]
      ];

    }
