<?php

declare(strict_types=1);

namespace App\Domain\Document;

use App\Domain\AbstractModel;
use App\Domain\Document\DocumentOwnerMapping;

class Document extends AbstractModel
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
  protected $table = 'document';

  /**
   * The attributes that are mass assignable.
   *
   * @var array<int, string>
   */
  protected $fillable = [
    'name',
    'type',
    'subtype',
    'parent_id',
    'legacy_id',
    'created_at',
    'status',
    's3_key',
      's3_bucket',
      "parent",
      "meta"
  ];

  /**
   * @var array
   */
  protected $columns = [
    'id' => [
      'type' => 'int'
    ],
    'parent_id' => [
        'type' => 'int'
    ],
    'legacy_id' => [
        'type' => 'int'
    ],
    'name' => [
      'type' => 'string',
      'required' => true
    ],
    'status' => [
      'type' => 'int',
      'required' => true
    ],
    'type' => [
      'type' => 'int',
      'required' => true
    ],
    'subtype' => [
        'type' => 'int',
        'required' => true
    ],
    's3_key' => [
      'type' => 'string',
      'required' => false
    ],
    's3_bucket' => [
      'type' => 'string',
      'required' => false
    ],
    'created_at' => [
      'type' => 'string',
      'required' => false
    ],
      'parent' => [
          'type' => 'string',
          'required' => false
      ],
      'meta' => [
          'type' => 'string',
          'required' => false
      ],
  ];

  /**
   * @return \Illuminate\Database\Eloquent\Relations\HasMany
   */
  public function tender(): \Illuminate\Database\Eloquent\Relations\HasMany
  {
    return $this->hasMany(Tender::class, "document_id");
  }

  /**
   * @return \Illuminate\Database\Eloquent\Relations\HasMany
   */
  public function category(): \Illuminate\Database\Eloquent\Relations\HasMany
  {
    return $this->hasMany(CategoryMapping::class, "document_id");
  }

    /**
     * @return \Illuminate\Database\Eloquent\Relations\HasManyThrough
     */
    public function categories(): \Illuminate\Database\Eloquent\Relations\HasManyThrough
    {
        return $this->hasManyThrough(
             Category::class, CategoryMapping::class,
            "document_id", "id", null, "category_id"
        );
    }

  /**
   * @return \Illuminate\Database\Eloquent\Relations\HasMany
   */
  public function owner(): \Illuminate\Database\Eloquent\Relations\HasMany
  {
    return $this->hasMany(DocumentOwnerMapping::class, "document_id");
  }

    /**
     * @param int $id
     * @param int $owner_id
     * @return bool
     */
  public function hasOwner(int $id, int $owner_id) {
      if(method_exists($this,'get')) {
          $data = $this->get()->where(["id" => $id])->with("owner");
          if ( $data->exists() ) {
              $owners = array_map(function ($i) {
                  return (int)$i["owner_id"];
              }, $data[0]["owner"]);
              if ( $owners && !in_array($owner_id, $owners) ) {
                  return false;
              }
          }
          return true;
      }
      return false;
  }
}
