<?php


namespace App\Domain\Approval;


use App\Domain\AbstractTypeModel;

class ApprovalLevelAccountRoleMapping extends AbstractTypeModel
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
  protected $table = 'approval_level_account_role_mapping';

  /**
   * The attributes that are mass assignable.
   *
   * @var string[]
   */
  protected $fillable = [
    'approval_level_id',
    'account_role_id',
  ];

  /**
   * @var array
   */
  protected $columns = [
    'approval_level_id' => [
      'type' => 'int',
      'required' => true
    ],
    'account_role_id' => [
      'type' => 'int',
      'required' => true
    ],
  ];
}
