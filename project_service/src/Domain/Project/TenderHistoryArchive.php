<?php


declare(strict_types=1);

namespace App\Domain\Project;

use App\Domain\AbstractModel;

class TenderHistoryArchive extends AbstractModel
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
  protected $table = 'tender_history_archive';

  /**
   * The attributes that are mass assignable.
   *
   * @var string[]
   */
    protected $fillable = [
        'tender_id',
        'specialist_id',
    ];

  /**
   * @var array
   */
  protected $columns = [
    'id' => [
      'type' => 'int'
    ],
    'tender_id' => [
      'type' => 'int',
      'required' => true
    ],
    'specialist_id' => [
      'type' => 'int',
      'required' => true
    ]
  ];
}
