<?php

declare(strict_types=1);

namespace App\Domain\Document;

use App\Domain\AbstractModel;
use App\Domain\Project\Project;

class CategoryMapping extends AbstractModel
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
  protected $table = 'document_category_mapping';

  /**
   * The attributes that are mass assignable.
   *
   * @var array<int, string>
   */
  protected $fillable = [
    'document_id',
    'category_id',
    'created_at'
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
    'category_id' => [
      'type' => 'int',
      'required' => true
    ],
    'created_at' => [
      'type' => 'string',
      'required' => false
    ],
  ];

    /**
     * @return \Illuminate\Database\Eloquent\Relations\HasOne
     */
    public function document(): \Illuminate\Database\Eloquent\Relations\HasOne
    {
        return $this->hasOne(Document::class, "id");
    }

    /**
     * @return \Illuminate\Database\Eloquent\Relations\HasOne
     */
    public function category(): \Illuminate\Database\Eloquent\Relations\HasOne
    {
        return $this->hasOne(Category::class, "id");
    }
}
