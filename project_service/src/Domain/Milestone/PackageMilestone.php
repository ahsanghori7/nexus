<?php


declare(strict_types=1);

namespace App\Domain\Milestone;

use App\Domain\AbstractModel;

class PackageMilestone extends AbstractModel
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
  protected $table = 'package_milestone';

  /**
   * The attributes that are mass assignable.
   *
   * @var string[]
   */
    protected $fillable = [
        'account_milestone_mapping_id',
        'package_id',
        'planned_start_date',
        'planned_end_date',
        'actual_start_date',
        'actual_end_date',
        'package_milestone_status_id',
        'lead_time'
    ];

  /**
   * @var array
   */
  protected $columns = [
    'id' => [
      'type' => 'int'
    ],
    'account_milestone_mapping_id' => [
      'type' => 'int',
      'required' => true
    ],
    'package_id' => [
      'type' => 'int',
      'required' => true
    ],
    'planned_start_date' => [
      'type' => 'date',
      'required' => false
    ],
    'planned_end_date' => [
      'type' => 'date',
      'required' => false
    ],
    'actual_start_date' => [
      'type' => 'date',
      'required' => false
    ],
    'actual_end_date' => [
      'type' => 'date',
      'required' => false
    ],
    'package_milestone_status_id' => [
      'type' => 'int',
      'required' => true,
    ],
    'lead_time' => [
      'type' => 'int',
      'required' => true,
    ],
  ];

  /**
   * @return \Illuminate\Database\Eloquent\Relations\BelongsTo
   */
  public function status(): \Illuminate\Database\Eloquent\Relations\BelongsTo
  {
      return $this->belongsTo(PackageMilestoneStatus::class, "package_milestone_status_id");
  }

  /**
   * @return \Illuminate\Database\Eloquent\Relations\BelongsTo
   */
  public function accountMilestoneMapping(): \Illuminate\Database\Eloquent\Relations\BelongsTo
  {
      return $this->belongsTo(AccountMilestoneMapping::class, "account_milestone_mapping_id");
  }
}
