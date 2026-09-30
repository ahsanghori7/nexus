<?php

declare(strict_types=1);

namespace App\Domain\Notification;

use App\Domain\AbstractModel;

class Notification extends AbstractModel
{
    /**
     * The physical table is plural; the class is singular.
     */
    const NAME = "notifications";

    /**
     * @var array
     */
    protected $columns = [
        'account_id' => [
            'type' => 'int',
            'required' => true,
        ],
        'project_id' => [
            'type' => 'int',
        ],
        'receiver_user_id' => [
            'type' => 'int',
            'required' => true,
        ],
        'type' => [
            'type' => 'string',
            'required' => true,
        ],
        'title' => [
            'type' => 'string',
            'required' => true,
        ],
        'message' => [
            'type' => 'string',
        ],
        'target_type' => [
            'type' => 'string',
        ],
        'target_id' => [
            'type' => 'int',
        ],
        'target_url' => [
            'type' => 'string',
        ],
        'read_at' => [
            'type' => 'string',
        ],
        'created_at' => [
            'type' => 'string',
        ],
    ];

    /**
     * Casts raw DB row values (as returned by getAll()/getRow()) into the
     * types the API contract promises, and derives is_read from read_at —
     * there is no separate is_read column, read_at IS NULL means unread.
     *
     * @param array $row
     * @return array
     */
    public static function formatRow(array $row): array
    {
        $row['id'] = (int) $row['id'];
        $row['account_id'] = (int) $row['account_id'];
        $row['project_id'] = isset($row['project_id']) ? (int) $row['project_id'] : null;
        $row['receiver_user_id'] = (int) $row['receiver_user_id'];
        $row['target_id'] = isset($row['target_id']) ? (int) $row['target_id'] : null;
        $row['is_read'] = !empty($row['read_at']);

        return $row;
    }
}
