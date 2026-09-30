<?php


declare(strict_types=1);

namespace App\Domain\Milestone;

use App\Domain\AbstractModel;

class AccountMilestoneMapping extends AbstractModel
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
  protected $table = 'account_milestone_mapping';

  /**
   * The attributes that are mass assignable.
   *
   * @var string[]
   */
    protected $fillable = [
        'milestone_id',
        'account_id',
        'label',
        'lead_time',
        'sort_order',
    ];

  /**
   * @var array
   */
  protected $columns = [
    'id' => [
      'type' => 'int'
    ],
    'milestone_id' => [
      'type' => 'int',
      'required' => true
    ],
    'account_id' => [
      'type' => 'int',
      'required' => true
    ],
    'label' => [
      'type' => 'string',
      'required' => true
    ],
    'lead_time' => [
      'type' => 'int',
      'required' => true
    ],
    'sort_order' => [
      'type' => 'int',
      'required' => true
    ],
  ];

  /**
   * @return \Illuminate\Database\Eloquent\Relations\BelongsTo
   */
  public function milestone(): \Illuminate\Database\Eloquent\Relations\BelongsTo
  {
      return $this->belongsTo(Milestone::class, "milestone_id");
  }
}
