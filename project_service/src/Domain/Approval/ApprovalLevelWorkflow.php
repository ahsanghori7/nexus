<?php


declare(strict_types=1);

namespace App\Domain\Approval;

use App\Domain\AbstractModel;

class ApprovalLevelWorkflow extends AbstractModel
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
  protected $table = 'approval_level_workflow';

  /**
   * The attributes that are mass assignable.
   *
   * @var string[]
   */
  protected $fillable = [
    'entity_type',
    'entity_id',
    'status',
    'sort_order',
    'meta'
  ];

  /**
   * @var array
   */
  protected $columns = [
    'id' => [
      'type' => 'int'
    ],
    'entity_type' => [
      'type' => 'string',
      'required' => true
    ],
    'entity_id' => [
      'type' => 'int',
      'required' => true
    ],
    'status' => [
      'type' => 'string',
      'required' => true
    ],
    'sort_order' => [
      'type' => 'int',
      'required' => false
    ],
    'meta' => [
      'type' => 'json',
      'required' => false
    ],
  ];

}
