<?php


declare(strict_types=1);

namespace App\Domain\Milestone;

use App\Domain\AbstractModel;

class PackageMilestoneStatus extends AbstractModel
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
  protected $table = 'package_milestone_status';

  /**
   * The attributes that are mass assignable.
   *
   * @var string[]
   */
    protected $fillable = [
        'label',
    ];

  /**
   * @var array
   */
  protected $columns = [
    'id' => [
      'type' => 'int'
    ],
    'label' => [
      'type' => 'string',
      'required' => true
    ],
  ];
}
