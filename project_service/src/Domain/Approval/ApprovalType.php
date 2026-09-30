<?php


namespace App\Domain\Approval;


use App\Domain\AbstractTypeModel;

class ApprovalType extends AbstractTypeModel
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
  protected $table = 'approval_type';

  /**
   * The attributes that are mass assignable.
   *
   * @var string[]
   */
  protected $fillable = [
    'type',
    'display_label',
  ];

  /**
   * @var array
   */
  protected $columns = [
    'type' => [
      'type' => 'string',
      'required' => true
    ],
    'display_label' => [
      'type' => 'string',
      'required' => true
    ],
  ];
}
