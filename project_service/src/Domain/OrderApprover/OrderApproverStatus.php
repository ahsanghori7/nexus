<?php


namespace App\Domain\OrderApprover;


use App\Domain\AbstractTypeModel;

class OrderApproverStatus extends AbstractTypeModel
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
  protected $table = 'order_approvers_status';

  /**
   * @var array
   */
  protected $columns = [
    'label',
  ];
}
