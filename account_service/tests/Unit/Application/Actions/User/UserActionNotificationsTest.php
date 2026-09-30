<?php
declare(strict_types=1);

namespace Tests\Application\Actions\User;

use Slim\Psr7\Response;

final class UserActionNotificationsTest extends UserActionTestCase
{
    public function testGetNotificationsReturnsPendingEntries(): void
    {
        $repository = new UserNotificationsRepositoryStub();
        $repository->notifications = [
            ['id' => 1, 'receiver_id' => 5, 'status' => 0],
        ];

        $action = $this->createActionWithRepository($repository);
        $response = $action->getNotifications(
            $this->createRequest('GET', '/user/5/notifications'),
            new Response(),
            ['id' => 5]
        );

        self::assertSame(200, $response->getStatusCode());
        $payload = $this->decodeResponse($response);
        self::assertSame($repository->notifications, $payload['data']);
        self::assertSame([['receiver_id' => 5, 'status' => 0]], $repository->findCriteria);
    }

    public function testCreateNotificationPersistsPayload(): void
    {
        $repository = new UserNotificationsRepositoryStub();
        $action = $this->createActionWithRepository($repository);
        $payload = ['receiver_id' => 5, 'message' => 'Hello'];
        $this->setActionData($action, $payload);

        $response = $action->createNotification(
            $this->createRequest('POST', '/user/notifications'),
            new Response(),
            []
        );

        self::assertSame(203, $response->getStatusCode());
        self::assertSame([$payload], $repository->savedPayloads);
    }

    public function testUpdateNotificationByIdLoadsAndSaves(): void
    {
        $repository = new UserNotificationsRepositoryStub();
        $action = $this->createActionWithRepository($repository);
        $payload = ['status' => 1];
        $this->setActionData($action, $payload);

        $response = $action->updateNotificationById(
            $this->createRequest('PATCH', '/user/notifications/10'),
            new Response(),
            ['nid' => 10]
        );

        self::assertSame(203, $response->getStatusCode());
        self::assertSame([[10, 'id']], $repository->loadCalls);
        self::assertSame([$payload], $repository->savedPayloads);
    }
}

final class UserNotificationsRepositoryStub
{
    public array $notifications = [];
    public array $savedPayloads = [];
    public array $findCriteria = [];
    public array $loadCalls = [];

    public function getModel(string $name = 'userActionNotifications')
    {
        if ($name === 'userActionNotifications') {
            return new UserActionNotificationsModelStub($this);
        }

        return new class {
            public function __call(string $name, array $arguments)
            {
                return null;
            }
        };
    }
}

final class UserActionNotificationsModelStub
{
    public function __construct(private UserNotificationsRepositoryStub $repository)
    {
    }

    public function findAll(array $criteria): array
    {
        $this->repository->findCriteria[] = $criteria;
        return $this->repository->notifications;
    }

    public function load($value, $field = 'id'): self
    {
        $this->repository->loadCalls[] = [$value, $field];
        return $this;
    }

    public function save(array $payload): void
    {
        $this->repository->savedPayloads[] = $payload;
    }
}
