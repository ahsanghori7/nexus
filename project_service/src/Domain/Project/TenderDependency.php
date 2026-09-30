<?php

declare(strict_types=1);

namespace App\Domain\Project;

use App\Domain\AbstractModel;

class TenderDependency extends AbstractModel
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
  protected $table = 'tender_dependency';

  /**
   * The attributes that are mass assignable.
   * @var string[]
   */
  protected $fillable = [
    'tender_id',
    'tender_parent_id',
    'tender_dependency_key',
    'tender_dependency_parent_key'
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
    'tender_parent_id' => [
      'type' => 'int',
      'required' => true
    ],
    'tender_dependency_key' => [
      'type' => 'int',
      'required' => true
    ],
    'tender_dependency_parent_key' => [
      'type' => 'int',
      'required' => true
    ]
  ];

  public function dependency()
  {
    return $this->hasMany(TenderDependency::class, 'tender_id', 'tender_parent_id');
  }


  public function dependencies()
  {
    return $this->dependency()->with('dependencies');
  }

}
