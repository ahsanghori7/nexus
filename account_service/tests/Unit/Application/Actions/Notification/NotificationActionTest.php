<?php
declare(strict_types=1);

namespace Tests\Application\Actions\Notification;

use App\Application\Actions\Action;
use App\Application\Actions\Notification\NotificationAction;
use Psr\Log\LoggerInterface;
use Slim\Psr7\Response;
use Tests\TestCase;

final class NotificationActionTest extends TestCase
{
    public function testCreateReturns400WhenRequiredFieldsAreMissing(): void
    {
        $repository = new NotificationRepositoryStub();
        $action = $this->createAction($repository);
        $this->setActionData($action, ['account_id' => 1]);

        $response = $action->create($this->createRequest('POST', '/v1/notification'), new Response());

        self::assertSame(400, $response->getStatusCode());
        self::assertNull($repository->createdData);
    }

    public function testCreateAllowsAccountIdAndReceiverUserIdOfZero(): void
    {
        $repository = new NotificationRepositoryStub();
        $action = $this->createAction($repository);
        $this->setActionData($action, [
            'account_id' => 0,
            'receiver_user_id' => 0,
            'type' => 'system_notification',
            'title' => 'Welcome',
        ]);

        $response = $action->create($this->createRequest('POST', '/v1/notification'), new Response());

        self::assertSame(201, $response->getStatusCode());
        self::assertSame(0, $repository->createdData['account_id']);
        self::assertSame(0, $repository->createdData['receiver_user_id']);
    }

    public function testGetAllReturns400WhenReceiverUserIdMissing(): void
    {
        $repository = new NotificationRepositoryStub();
        $action = $this->createAction($repository);

        $response = $action->getAll($this->createRequest('GET', '/v1/notification'), new Response(), []);

        self::assertSame(400, $response->getStatusCode());
    }

    public function testGetAllClampsNegativeLimitToOne(): void
    {
        $repository = new NotificationRepositoryStub();
        $action = $this->createAction($repository);
        $request = $this->createRequest('GET', '/v1/notification')
            ->withQueryParams(['receiver_user_id' => '5', 'limit' => '-10']);

        $action->getAll($request, new Response(), []);

        self::assertSame(['receiverUserId' => 5, 'since' => null, 'limit' => 1], $repository->listForReceiverCalls[0]);
    }

    public function testGetAllClampsLimitToOneHundred(): void
    {
        $repository = new NotificationRepositoryStub();
        $action = $this->createAction($repository);
        $request = $this->createRequest('GET', '/v1/notification')
            ->withQueryParams(['receiver_user_id' => '5', 'limit' => '500']);

        $action->getAll($request, new Response(), []);

        self::assertSame(100, $repository->listForReceiverCalls[0]['limit']);
    }

    public function testGetAllDefaultsLimitToTwenty(): void
    {
        $repository = new NotificationRepositoryStub();
        $action = $this->createAction($repository);
        $request = $this->createRequest('GET', '/v1/notification')
            ->withQueryParams(['receiver_user_id' => '5']);

        $action->getAll($request, new Response(), []);

        self::assertSame(20, $repository->listForReceiverCalls[0]['limit']);
        self::assertNull($repository->listForReceiverCalls[0]['since']);
    }

    public function testUnreadCountReturns400WhenReceiverUserIdMissing(): void
    {
        $repository = new NotificationRepositoryStub();
        $action = $this->createAction($repository);

        $response = $action->unreadCount($this->createRequest('GET', '/v1/notification/unread_count'), new Response(), []);

        self::assertSame(400, $response->getStatusCode());
    }

    public function testUnreadCountReturnsRepositoryValue(): void
    {
        $repository = new NotificationRepositoryStub();
        $repository->unreadCountResult = 4;
        $action = $this->createAction($repository);
        $request = $this->createRequest('GET', '/v1/notification/unread_count')
            ->withQueryParams(['receiver_user_id' => '5']);

        $response = $action->unreadCount($request, new Response(), []);

        self::assertSame(200, $response->getStatusCode());
        $payload = json_decode((string) $response->getBody(), true, 512, JSON_THROW_ON_ERROR);
        self::assertSame(4, $payload['data']['unread_count']);
        self::assertSame([5], $repository->unreadCountCalls);
    }

    public function testMarkReadReturns404WhenNotificationNotFound(): void
    {
        $repository = new NotificationRepositoryStub();
        $repository->loadByIdResult = new NotificationModelStub(false);
        $action = $this->createAction($repository);
        $this->setActionData($action, ['receiver_user_id' => 5]);

        $response = $action->markRead($this->createRequest('PATCH', '/v1/notification/9/read'), new Response(), ['id' => '9']);

        self::assertSame(404, $response->getStatusCode());
        self::assertEmpty($repository->markReadCalls);
    }

    public function testMarkReadReturns403WhenReceiverDoesNotMatch(): void
    {
        $repository = new NotificationRepositoryStub();
        $repository->loadByIdResult = new NotificationModelStub(true, ['receiver_user_id' => 99]);
        $action = $this->createAction($repository);
        $this->setActionData($action, ['receiver_user_id' => 5]);

        $response = $action->markRead($this->createRequest('PATCH', '/v1/notification/9/read'), new Response(), ['id' => '9']);

        self::assertSame(403, $response->getStatusCode());
        self::assertEmpty($repository->markReadCalls);
    }

    public function testMarkReadPassesTheAlreadyLoadedNotificationToTheRepository(): void
    {
        $repository = new NotificationRepositoryStub();
        $notification = new NotificationModelStub(true, ['receiver_user_id' => 5]);
        $repository->loadByIdResult = $notification;
        $repository->markReadResult = ['id' => 9, 'is_read' => true];
        $action = $this->createAction($repository);
        $this->setActionData($action, ['receiver_user_id' => 5]);

        $response = $action->markRead($this->createRequest('PATCH', '/v1/notification/9/read'), new Response(), ['id' => '9']);

        self::assertSame(200, $response->getStatusCode());
        // No second load — the same object loadById() returned is what gets passed to markRead().
        self::assertSame([$notification], $repository->markReadCalls);
    }

    public function testMarkAllReadReturns400WhenReceiverUserIdMissing(): void
    {
        $repository = new NotificationRepositoryStub();
        $action = $this->createAction($repository);

        $response = $action->markAllRead($this->createRequest('PATCH', '/v1/notification/mark_all_read'), new Response(), []);

        self::assertSame(400, $response->getStatusCode());
    }

    public function testMarkAllReadCallsRepositoryWithReceiverUserId(): void
    {
        $repository = new NotificationRepositoryStub();
        $action = $this->createAction($repository);
        $this->setActionData($action, ['receiver_user_id' => 5]);

        $response = $action->markAllRead($this->createRequest('PATCH', '/v1/notification/mark_all_read'), new Response(), []);

        self::assertSame(200, $response->getStatusCode());
        self::assertSame([5], $repository->markAllReadCalls);
    }

    private function createAction(NotificationRepositoryStub $repository): NotificationActionUnderTest
    {
        $logger = $this->createMock(LoggerInterface::class);
        return new NotificationActionUnderTest($logger, $repository);
    }

    private function setActionData(Action $action, array $data): void
    {
        $ref = new \ReflectionClass(Action::class);
        $prop = $ref->getProperty('data');
        $prop->setAccessible(true);
        $prop->setValue($action, $data);
    }
}

final class NotificationActionUnderTest extends NotificationAction
{
    public function __construct(LoggerInterface $logger, NotificationRepositoryStub $repository)
    {
        parent::__construct($logger);
        $this->repository = $repository;
    }
}

final class NotificationRepositoryStub
{
    public ?array $createdData = null;
    public array $listForReceiverCalls = [];
    public array $unreadCountCalls = [];
    public array $markReadCalls = [];
    public array $markAllReadCalls = [];
    public $loadByIdResult;
    public int $unreadCountResult = 0;
    public array $markReadResult = [];

    public function createNotification(array $data): array
    {
        $this->createdData = $data;
        return array_merge($data, ['id' => 1, 'is_read' => false]);
    }

    public function listForReceiver(int $receiverUserId, ?int $since, int $limit): array
    {
        $this->listForReceiverCalls[] = [
            'receiverUserId' => $receiverUserId,
            'since' => $since,
            'limit' => $limit,
        ];
        return [];
    }

    public function unreadCount(int $receiverUserId): int
    {
        $this->unreadCountCalls[] = $receiverUserId;
        return $this->unreadCountResult;
    }

    public function loadById(int $id)
    {
        return $this->loadByIdResult;
    }

    public function markRead($notification): array
    {
        $this->markReadCalls[] = $notification;
        return $this->markReadResult;
    }

    public function markAllRead(int $receiverUserId): void
    {
        $this->markAllReadCalls[] = $receiverUserId;
    }
}

final class NotificationModelStub
{
    public function __construct(private bool $loaded, private array $data = [])
    {
    }

    public function isLoaded(): bool
    {
        return $this->loaded;
    }

    public function getData(string $key)
    {
        return $this->data[$key] ?? null;
    }
}
