<?php


namespace App\Domain\Approval;


use App\Domain\AbstractTypeModel;

class ApprovalStatus extends AbstractTypeModel
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
  protected $table = 'approval_statuses';

  /**
   * @var array
   */
  protected $columns = [
    'label',
  ];
}
