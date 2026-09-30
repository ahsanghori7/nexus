<?php

declare(strict_types=1);

namespace App\Domain\Document;

use App\Domain\AbstractModel;
use App\Domain\Document\Document;
//use App\Domain\Project\Package as PackageMapping;

class Tender extends AbstractModel
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
  protected $table = 'tender_mapping';

  /**
   * The attributes that are mass assignable.
   *
   * @var array<int, string>
   */
  protected $fillable = [
    'document_id',
    'tender_id'
  ];

  /**
   * @var array
   */
  protected $columns = [
    'id' => [
      'type' => 'int'
    ],
    'document_id' => [
      'type' => 'int',
      'required' => true
    ],
    'tender_id' => [
      'type' => 'int',
      'required' => true
    ],
  ];

  /**
   * @return \Illuminate\Database\Eloquent\Relations\BelongsTo
   */
  public function document(): \Illuminate\Database\Eloquent\Relations\BelongsTo
  {
    return $this->belongsTo(Document::class, "document_id");
  }
}
