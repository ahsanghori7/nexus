<?php


declare(strict_types=1);

namespace App\Domain\Project;

use App\Domain\AbstractModel;

class TenderHistory extends AbstractModel
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
  protected $table = 'tender_history';

  /**
   * The attributes that are mass assignable.
   *
   * @var string[]
   */
    protected $fillable = [
        'tender_id',
        'author_id',
        'specialist_id',
        'status_id',
        'type_id',
        'meta',
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
    'author_id' => [
      'type' => 'int',
      'required' => true
    ],
    'specialist_id' => [
      'type' => 'int',
      'required' => true
    ],
    'status_id' => [
      'type' => 'int',
      'required' => true,
    ],
    'meta' => [
      'type' => 'string',
      'required' => false,
    ],
    'tender_history_type' => [
      'type' => 'string',
      'required' => true,
    ],
    'created_at' => [
      'type' => 'string',
      'required' => false,
    ],
  ];

  /**
   * @return \Illuminate\Database\Eloquent\Relations\BelongsTo
   */
  public function history ()
  {
    return $this->belongsTo("App\Domain\Project\Tender", "id");
  }

  /**
   * @param array $values
   * @param array $raw
   * @return array
   */
  public function beforeSave(array $values,array $raw): array
  {
    if(isset($values['meta'])) {
      $values['meta'] = json_encode($values['meta']);
    }
    return $values;
  }
}
