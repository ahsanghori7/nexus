<?php
declare(strict_types=1);

namespace App\Domain\Approval;

use App\Domain\AbstractModel;

class ApprovalConditionAccountRoleMapping extends AbstractModel
{
  /**
   * Indicates if the model should be timestamped.
   *
   * @var bool
   */
  public $timestamps = true;

  /**
   * The table associated with the model.
   *
   * @var string
   */
  protected $table = 'approval_condition_account_role_mapping';

  /**
   * The attributes that are mass assignable.
   *
   * @var string[]
   */
  protected $fillable = [
    'approval_level_condition_id',
    'account_role_id',
  ];

  /**
   * @var array
   */
  protected $columns = [
    'id' => [
      'type' => 'int'
    ],
    'approval_level_condition_id' => [
      'type' => 'int',
      'required' => true
    ],
    'account_role_id' => [
      'type' => 'int',
      'required' => true
    ],
  ];
}
