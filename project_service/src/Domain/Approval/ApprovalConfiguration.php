<?php


declare(strict_types=1);

namespace App\Domain\Approval;

use App\Domain\AbstractModel;

class ApprovalConfiguration extends AbstractModel
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
  protected $table = 'approval_configuration';

  /**
   * The attributes that are mass assignable.
   *
   * @var string[]
   */
  protected $fillable = [
    'account_id',
    'approval_type_id',
    'allow_requester_self_approval',
    'consolidate_duplicate_approver_notifications',
    'auto_complete_lower_approvals',
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
    'approval_type_id' => [
      'type' => 'int',
      'required' => true
    ],
    'allow_requester_self_approval' => [
      'type' => 'boolean',
      'required' => true
    ],
    'consolidate_duplicate_approver_notifications' => [
      'type' => 'boolean',
      'required' => true
    ],
    'auto_complete_lower_approvals' => [
      'type' => 'boolean',
      'required' => true
    ],
  ];

  /**
   * @return \Illuminate\Database\Eloquent\Relations\BelongsTo
   */
  public function approval_type(): \Illuminate\Database\Eloquent\Relations\BelongsTo
  {
    return $this->belongsTo(ApprovalType::class, "approval_type_id");
  }
}
