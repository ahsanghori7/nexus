<?php

declare(strict_types=1);

namespace App\Domain\Document;

use App\Domain\AbstractModel;

class Category extends AbstractModel
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
  protected $table = 'document_categories';

  /**
   * The attributes that are mass assignable.
   *
   * @var array<int, string>
   */
  protected $fillable = [
    'label',
    'entity_id',
    'entity_type',
    'parent_id',
  ];

  /**
   * @var array
   */
  protected $columns = [
    'id' => [
      'type' => 'int'
    ],
    'label' => [
      'type' => 'string',
      'required' => true
    ],
    'entity_id' => [
      'type' => 'int',
      'required' => true
    ],
    'entity_type' => [
      'type' => 'string',
      'required' => false
    ],
    'parent_id' => [
      'type' => 'int',
      'required' => false
    ],
  ];

    /**
     * @return \Illuminate\Database\Eloquent\Relations\HasMany
     */
    public function mappings(): \Illuminate\Database\Eloquent\Relations\HasMany
    {
        return $this->hasMany(CategoryMapping::class, "category_id");
    }

    /**
     * @return \Illuminate\Database\Eloquent\Relations\HasManyThrough
     */
    public function documents(): \Illuminate\Database\Eloquent\Relations\HasManyThrough
    {
        return $this->hasManyThrough(
            Document::class, CategoryMapping::class,
            "category_id", "id", null, "document_id"
        );
    }

}
