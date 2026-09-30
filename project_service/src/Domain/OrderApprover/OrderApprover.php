<?php


declare(strict_types=1);

namespace App\Domain\OrderApprover;

use App\Domain\AbstractModel;
use App\Domain\Approval\ApprovalLevelWorkflow;

class OrderApprover extends AbstractModel
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
  protected $table = 'order_approvers';

  /**
   * The attributes that are mass assignable.
   *
   * @var string[]
   */
    protected $fillable = [
        'requester_user_id',
        'approver_user_id',
        'transaction_id',
        'status_id',
        'approval_level_workflow_id',
        'comment',
        'is_approver_read',
        'is_requester_read',
        'meta',
    ];

  /**
   * @var array
   */
  protected $columns = [
    'id' => [
      'type' => 'int'
    ],
    'requester_user_id' => [
      'type' => 'int',
      'required' => true
    ],
    'approver_user_id' => [
      'type' => 'int',
      'required' => true
    ],
    'transaction_id' => [
      'type' => 'int',
      'required' => true
    ],
    'status_id' => [
      'type' => 'int',
      'required' => true,
    ],
    'approval_level_workflow_id' => [
      'type' => 'int',
      'required' => false,
    ],
    'comment' => [
      'type' => 'string',
      'required' => false,
    ],
    'is_approver_read' => [
      'type' => 'boolean',
      'required' => false,
      'default' => false,
    ],
    'is_requester_read' => [
      'type' => 'boolean',
      'required' => false,
      'default' => false,
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
      return $this->belongsTo(OrderApproverStatus::class, "status_id");
  }

  /**
   * @return \Illuminate\Database\Eloquent\Relations\BelongsTo
   */
  public function approvalLevelWorkflow(): \Illuminate\Database\Eloquent\Relations\BelongsTo
  {
      return $this->belongsTo(ApprovalLevelWorkflow::class, "approval_level_workflow_id");
  }

  /**
   * @param int $id
   * @return array
   * @throws \ReflectionException
   */
  public function getRequiredActionsData(int $uid, array $params = []): array
  {
    $where = '';
    if (isset($params['start_date']) && isset($params['end_date'])) {
      $where = sprintf(" AND (oa.created_at BETWEEN '%s' AND '%s') ", $params['start_date'], $params['end_date']);
    } elseif (isset($params['end_date'])) {
      $where = sprintf(" AND (oa.created_at <= '%s') ", $params['end_date']);
    }
      $sql = sprintf("SELECT
                        oa.*,
                        oas.label AS status,
                        t.label as package_name,
	                      t.id as package_id,
                        p.name as project_name,
                        p.id as project_id
                      FROM
                        order_approvers oa
                      JOIN
                          order_approvers_status oas
                          ON
                        oa.status_id = oas.id
                      JOIN `transaction` t2 on
                        oa.transaction_id = t2.id
                      JOIN `tender` t on
                        t2.tender_id = t.id
                      JOIN `project` p on
                        t.project_id = p.id
                      WHERE
                          ((oa.approver_user_id = %s AND oas.label = 'Pending' AND oa.is_approver_read = 0)
                          OR (oa.requester_user_id = %s AND oas.label = 'Rejected' AND oa.is_requester_read = 0)
                          OR (oa.approver_user_id = %s AND (oas.label != 'Pending') AND oa.is_approver_read = 0)
                          OR (oa.requester_user_id = %s AND (oas.label = 'Approved') AND oa.is_requester_read = 0)) %s;", $uid, $uid, $uid, $uid, $where);
      $result = $this->getDb()::select($sql);

      return $result;
  }

  /**
   * @param int $id
   * @return array
   * @throws \ReflectionException
   */
  public function getCompletedActionsData(int $uid, array $params = []): array
  {
      $where = '';
      if (isset($params['start_date']) && isset($params['end_date'])) {
        $where = sprintf(" AND (oa.created_at BETWEEN '%s' AND '%s') ", $params['start_date'], $params['end_date']);
      } elseif (isset($params['end_date'])) {
        $where = sprintf(" AND (oa.created_at <= '%s') ", $params['end_date']);
      }
      $sql = sprintf("SELECT
                        oa.*,
                        oas.label AS status,
                        t.label as package_name,
	                      t.id as package_id,
                        p.name as project_name,
                        p.id as project_id
                      FROM
                        order_approvers oa
                      JOIN
                          order_approvers_status oas
                          ON
                        oa.status_id = oas.id
                      JOIN `transaction` t2 on
                        oa.transaction_id = t2.id
                      JOIN `tender` t on
                        t2.tender_id = t.id
                      JOIN `project` p on
                        t.project_id = p.id
                      WHERE
                          ((oa.approver_user_id = %s AND oas.label = 'Pending' AND oa.is_approver_read = 1)
                          OR (oa.requester_user_id = %s AND oas.label = 'Rejected' AND oa.is_requester_read = 1)
                          OR (oa.approver_user_id = %s AND (oas.label != 'Pending') AND oa.is_approver_read = 1)
                          OR (oa.requester_user_id = %s AND (oas.label = 'Approved') AND oa.is_requester_read = 1)) %s;", $uid, $uid, $uid, $uid, $where);
      $result = $this->getDb()::select($sql);

      return $result;
  }
}
