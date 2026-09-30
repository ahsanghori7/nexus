<?php


namespace App\Domain\Project;


use App\Domain\AbstractTypeModel;

class TenderHistoryStatus extends AbstractTypeModel
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
  protected $table = 'tender_history_status';

  /**
   * @var array
   */
  protected $columns = [
    'label',
  ];
}
