<?php

declare(strict_types=1);

namespace App\Domain\Notification;

use App\Domain\AbstractRepository;

class NotificationRepository extends AbstractRepository
{
    /**
     * Allow a default model to be set for get model function
     */
    const DEFAULT_MODEL = "notification";

    /**
     * @var string[]
     */
    protected $models = [
        "notification" => Notification::class,
    ];

    /**
     * @param array $data
     * @return array
     */
    public function createNotification(array $data): array
    {
        $model = $this->getModel();
        $model->save($data);

        // Reload - response reflects db
        $fresh = $this->getModel()->load($model->getId());

        return Notification::formatRow($fresh->getData());
    }

    /**
     * @param int $receiverUserId
     * @param int|null $since number of latest notifications to skip (offset), not a cursor
     * @param int $limit
     * @return array
     */
    public function listForReceiver(int $receiverUserId, ?int $since, int $limit): array
    {
        $model = $this->getModel();
        $offset = max(0, $since ?? 0);
        $sql = sprintf(
            "SELECT * FROM %s WHERE receiver_user_id = ? ORDER BY created_at DESC, id DESC LIMIT %d OFFSET %d",
            $model->getName(),
            $limit,
            $offset
        );
        $params = [$receiverUserId];

        $rows = [];
        if (method_exists($model->getDb(), 'getAll')) {
            $rows = $model->getDb()::getAll($sql, $params);
        }

        return array_map([Notification::class, 'formatRow'], $rows);
    }

    /**
     * @param int $receiverUserId
     * @return int
     */
    public function unreadCount(int $receiverUserId): int
    {
        $model = $this->getModel();
        $sql = sprintf(
            "SELECT COUNT(*) as c FROM %s WHERE receiver_user_id = ? AND read_at IS NULL",
            $model->getName()
        );

        if (method_exists($model->getDb(), 'getRow')) {
            $row = $model->getDb()::getRow($sql, [$receiverUserId]);
            return (int) ($row['c'] ?? 0);
        }

        return 0;
    }

    /**
     * @param int $id
     * @return Notification
     */
    public function loadById(int $id): Notification
    {
        return $this->getModel()->load($id);
    }

    /**
     * @param Notification $notification
     * @return array
     */
    public function markRead(Notification $notification): array
    {
        $notification->save([
            'read_at' => gmdate('Y-m-d H:i:s'),
        ]);

        return Notification::formatRow($notification->getData());
    }

    /**
     * @param int $receiverUserId
     * @return void
     */
    public function markAllRead(int $receiverUserId): void
    {
        $model = $this->getModel();
        $sql = sprintf(
            "UPDATE %s SET read_at = ? WHERE receiver_user_id = ? AND read_at IS NULL",
            $model->getName()
        );

        if (method_exists($model->getDb(), 'exec')) {
            $model->getDb()::exec($sql, [gmdate('Y-m-d H:i:s'), $receiverUserId]);
        }
    }
}
