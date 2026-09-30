<?php

declare(strict_types=1);

namespace App\Application\Actions\Notification;

use Psr\Http\Message\ResponseInterface as Response;
use Psr\Http\Message\ServerRequestInterface as Request;
use Psr\Log\LoggerInterface;

use App\Application\Actions\Action;
use App\Application\Actions\ActionPayload;
use App\Domain\Notification\NotificationRepository;

class NotificationAction extends Action
{
    private const RECEIVER_USER_ID_REQUIRED = "receiver_user_id is required";

    /**
     * Default content type for notification action data is json
     * @var string
     */
    protected $defaultContentType = "application/json";

    /**
     * NotificationAction constructor.
     * @param LoggerInterface $logger
     */
    public function __construct(LoggerInterface $logger)
    {
        parent::__construct($logger);
        $this->repository = new NotificationRepository();
    }

    /**
     * @param Request $request
     * @param Response $response
     * @return Response
     */
    public function create(Request $request, Response $response): Response
    {
        $data = $this->getData();

        if (!isset($data['account_id']) || !isset($data['receiver_user_id']) || empty($data['type']) || empty($data['title'])) {
            return $this->respond(
                $response,
                new ActionPayload(400, ["error" => "account_id, receiver_user_id, type and title are required"])
            );
        }

        $result = $this->repository->createNotification($data);

        return $this->respond($response, new ActionPayload(201, $result));
    }

    /**
     * @param Request $request
     * @param Response $response
     * @param array $args
     * @return Response
     */
    public function getAll(Request $request, Response $response, array $args): Response
    {
        $params = $request->getQueryParams();
        $receiverUserId = (int) ($params['receiver_user_id'] ?? 0);

        if (!$receiverUserId) {
            return $this->respond(
                $response,
                new ActionPayload(400, ["error" => self::RECEIVER_USER_ID_REQUIRED])
            );
        }

        $since = isset($params['since']) ? (int) $params['since'] : null;

        $limit = isset($params['limit']) ? max(1, min(100, (int) $params['limit'])) : 20;

        $result = $this->repository->listForReceiver($receiverUserId, $since, $limit);

        return $this->respond($response, new ActionPayload(200, $result));
    }

    /**
     * @param Request $request
     * @param Response $response
     * @param array $args
     * @return Response
     */
    public function unreadCount(Request $request, Response $response, array $args): Response
    {
        $params = $request->getQueryParams();
        $receiverUserId = (int) ($params['receiver_user_id'] ?? 0);

        if (!$receiverUserId) {
            return $this->respond(
                $response,
                new ActionPayload(400, ["error" => self::RECEIVER_USER_ID_REQUIRED])
            );
        }

        $count = $this->repository->unreadCount($receiverUserId);

        return $this->respond($response, new ActionPayload(200, ['unread_count' => $count]));
    }

    /**
     * @param Request $request
     * @param Response $response
     * @param array $args
     * @return Response
     */
    public function markRead(Request $request, Response $response, array $args): Response
    {
        $id = (int) $args['id'];
        $data = $this->getData();
        $receiverUserId = (int) ($data['receiver_user_id'] ?? 0);

        if (!$receiverUserId) {
            return $this->respond(
                $response,
                new ActionPayload(400, ["error" => self::RECEIVER_USER_ID_REQUIRED])
            );
        }

        $notification = $this->repository->loadById($id);
        if (!$notification->isLoaded()) {
            return $this->notFound($response);
        }

        if ((int) $notification->getData('receiver_user_id') !== $receiverUserId) {
            return $this->respond(
                $response,
                new ActionPayload(403, ["error" => "This notification does not belong to the specified receiver"])
            );
        }

        $result = $this->repository->markRead($notification);

        return $this->respond($response, new ActionPayload(200, $result));
    }

    /**
     * @param Request $request
     * @param Response $response
     * @param array $args
     * @return Response
     */
    public function markAllRead(Request $request, Response $response, array $args): Response
    {
        $data = $this->getData();
        $receiverUserId = (int) ($data['receiver_user_id'] ?? 0);

        if (!$receiverUserId) {
            return $this->respond(
                $response,
                new ActionPayload(400, ["error" => self::RECEIVER_USER_ID_REQUIRED])
            );
        }

        $this->repository->markAllRead($receiverUserId);

        return $this->respond($response, new ActionPayload(200, []));
    }
}
