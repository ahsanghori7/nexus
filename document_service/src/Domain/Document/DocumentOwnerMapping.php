<?php
declare(strict_types=1);

namespace App\Domain\Document;


use App\Domain\AbstractModel;

class DocumentOwnerMapping extends AbstractModel
{

  /**
   * The primary key associated with the table.
   *
   * @var string
   */
  protected $primaryKey = 'document_id';

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
  protected $table = 'document_owner_mapping';

  /**
   * The attributes that are mass assignable.
   *
   * @var array<int, string>
   */
  protected $fillable = [
    'document_id',
    'owner_id',
  ];
}
