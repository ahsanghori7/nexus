<?php


declare(strict_types=1);

namespace App\Domain\Approval;

use App\Domain\AbstractModel;

class Approval extends AbstractModel
{
  /**
   * Indicates if the model should be timestamped.
   *
   * @var bool
   */
  public $timestamps = true;

  /**
   * The table associated with the model.
   *
   * @var string
   */
  protected $table = 'approvals';

  /**
   * The attributes that are mass assignable.
   *
   * @var string[]
   */
    protected $fillable = [
        'user_id',
        'requester_user_id',
        'entity_type',
        'entity_id',
        'status_id',
        'comment',
        'approval_level_workflow_id',
        'meta',
    ];

  /**
   * @var array
   */
  protected $columns = [
    'id' => [
      'type' => 'int'
    ],
    'user_id' => [
      'type' => 'int',
      'required' => true
    ],
    'requester_user_id' => [
      'type' => 'int',
      'required' => false
    ],
    'entity_type' => [
      'type' => 'string',
      'required' => true
    ],
    'entity_id' => [
      'type' => 'int',
      'required' => true
    ],
    'status_id' => [
      'type' => 'int',
      'required' => true,
    ],
    'comment' => [
      'type' => 'string',
      'required' => false,
    ],
    'approval_level_workflow_id' => [
      'type' => 'int',
      'required' => false,
    ],
    'meta' => [
      'type' => 'json',
      'required' => false,
    ],
  ];

  /**
   * @return \Illuminate\Database\Eloquent\Relations\BelongsTo
   */
  public function status(): \Illuminate\Database\Eloquent\Relations\BelongsTo
  {
      return $this->belongsTo(ApprovalStatus::class, "status_id");
  }

    public function getRequiredActionsData(array $params = []): array
  {
      $where = '';
      if (isset($params['entity_id']) && isset($params['entity_type'])) {
          $where = sprintf("entity_id = %s AND entity_type = '%s'", $params['entity_id'], $params['entity_type']);
      }

      $sql = sprintf("DELETE
                      FROM
                          approvals
                      WHERE
                          %s", $where);

      $result = $this->getDb()::select($sql);

      return $result;
  }
}
