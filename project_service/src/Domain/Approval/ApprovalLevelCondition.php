<?php
declare(strict_types=1);

namespace App\Domain\Approval;

use App\Domain\AbstractModel;

class ApprovalLevelCondition extends AbstractModel
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
  protected $table = 'approval_level_condition';

  /**
   * The attributes that are mass assignable.
   *
   * @var string[]
   */
  protected $fillable = [
    'approval_level_id',
    'threshold_type',
    'from_value',
    'to_value',
    'sort_order',
    'allow_higher_level_approval',
  ];

  /**
   * @var array
   */
  protected $columns = [
    'id' => [
      'type' => 'int'
    ],
    'approval_level_id' => [
      'type' => 'int',
      'required' => true
    ],
    'threshold_type' => [
      'type' => 'string',
      'required' => true
    ],
    'from_value' => [
      'type' => 'int',
      'required' => false
    ],
    'to_value' => [
      'type' => 'int',
      'required' => false
    ],
    'sort_order' => [
      'type' => 'int',
      'required' => true
    ],
    'allow_higher_level_approval' => [
      'type' => 'boolean',
      'required' => true
    ],
  ];
}
