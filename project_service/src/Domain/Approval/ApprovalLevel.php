<?php


declare(strict_types=1);

namespace App\Domain\Approval;

use App\Domain\AbstractModel;

class ApprovalLevel extends AbstractModel
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
  protected $table = 'approval_level';

  /**
   * The attributes that are mass assignable.
   *
   * @var string[]
   */
  protected $fillable = [
    'approval_config_id',
    'is_threshold',
    'sort_order',
    'rule_type',
    'min_required'
  ];

  /**
   * @var array
   */
  protected $columns = [
    'id' => [
      'type' => 'int'
    ],
    'approval_config_id' => [
      'type' => 'int',
      'required' => true
    ],
    'is_threshold' => [
      'type' => 'boolean',
      'required' => true
    ],
    'sort_order' => [
      'type' => 'int',
      'required' => true
    ],
    'rule_type' => [
      'type' => 'string',
      'required' => true
    ],
    'min_required' => [
      'type' => 'int',
      'required' => false
    ],
  ];

  /**
   * @return \Illuminate\Database\Eloquent\Relations\BelongsTo
   */
  public function approval_configuration(): \Illuminate\Database\Eloquent\Relations\BelongsTo
  {
    return $this->belongsTo(ApprovalConfiguration::class, "approval_config_id");
  }
}
