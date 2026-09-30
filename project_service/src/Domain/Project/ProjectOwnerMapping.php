<?php
declare(strict_types=1);

namespace App\Domain\Project;


use App\Domain\AbstractModel;

class ProjectOwnerMapping extends AbstractModel
{

  /*
   * Default type of the mapping project
   */
  const DEFAULT_TYPE = "Author";

  /**
   * The primary key associated with the table.
   *
   * @var string
   */
  protected $primaryKey = 'project_id';

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
  protected $table = 'project_ownership_mapping';

  /**
   * The attributes that are mass assignable.
   *
   * @var string[]
   */
  protected $fillable = [
    'project_id',
    'owner_id',
    'type',
  ];
}
