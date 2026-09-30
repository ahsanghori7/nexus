<?php


declare(strict_types=1);

namespace App\Domain\Milestone;

use App\Domain\AbstractModel;

class Milestone extends AbstractModel
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
  protected $table = 'milestone';

  /**
   * The attributes that are mass assignable.
   *
   * @var string[]
   */
    protected $fillable = [
        'label',
        'feature_label',
        'is_required',
        'sort_order',
        'type',
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
    'feature_label' => [
      'type' => 'string',
      'required' => true
    ],
    'is_required' => [
      'type' => 'int',
      'required' => true
    ],
    'sort_order' => [
      'type' => 'int',
      'required' => true
    ],
    'type' => [
      'type' => 'string',
      'required' => true
    ],
  ];
}
