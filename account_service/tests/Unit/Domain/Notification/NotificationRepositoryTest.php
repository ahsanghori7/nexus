<?php
declare(strict_types=1);

namespace Tests\Domain\Notification;

use App\Domain\Notification\Notification;
use App\Domain\Notification\NotificationRepository;
use PHPUnit\Framework\TestCase;
use Tests\Support\Fakes\FakeDB;

final class NotificationRepositoryTest extends TestCase
{
    protected function setUp(): void
    {
        parent::setUp();
        FakeDB::reset();
    }

    public function testCreateNotificationSavesThenReloadsAFormattedRow(): void
    {
        $model = new NotificationStub();
        $repository = new NotificationRepositoryDouble($model);

        $result = $repository->createNotification([
            'account_id' => 1,
            'receiver_user_id' => 5,
            'type' => 'system_notification',
            'title' => 'Welcome',
        ]);

        self::assertSame([
            'account_id' => 1,
            'receiver_user_id' => 5,
            'type' => 'system_notification',
            'title' => 'Welcome',
        ], $model->savedData);
        self::assertSame(42, $model->loadedId);
        self::assertSame(1, $result['account_id']);
        self::assertSame(5, $result['receiver_user_id']);
        self::assertFalse($result['is_read']);
    }

    public function testListForReceiverAppliesSinceAsOffset(): void
    {
        FakeDB::queueGetAllResult([
            ['id' => 1, 'account_id' => 1, 'project_id' => null, 'receiver_user_id' => 5, 'target_id' => null, 'read_at' => null],
        ]);

        $model = new NotificationStub();
        $repository = new NotificationRepositoryDouble($model);

        $result = $repository->listForReceiver(5, 10, 20);

        self::assertStringContainsString('WHERE receiver_user_id = ?', FakeDB::$lastGetAllQuery ?? '');
        self::assertStringContainsString('ORDER BY created_at DESC, id DESC', FakeDB::$lastGetAllQuery ?? '');
        self::assertStringContainsString('LIMIT 20 OFFSET 10', FakeDB::$lastGetAllQuery ?? '');
        self::assertSame([5], FakeDB::$lastGetAllParams);
        self::assertCount(1, $result);
        self::assertFalse($result[0]['is_read']);
    }

    public function testListForReceiverDefaultsOffsetToZeroWhenSinceIsNull(): void
    {
        FakeDB::queueGetAllResult([]);

        $model = new NotificationStub();
        $repository = new NotificationRepositoryDouble($model);

        $repository->listForReceiver(5, null, 20);

        self::assertStringContainsString('LIMIT 20 OFFSET 0', FakeDB::$lastGetAllQuery ?? '');
        self::assertSame([5], FakeDB::$lastGetAllParams);
    }

    public function testListForReceiverClampsNegativeSinceToZero(): void
    {
        FakeDB::queueGetAllResult([]);

        $model = new NotificationStub();
        $repository = new NotificationRepositoryDouble($model);

        $repository->listForReceiver(5, -10, 20);

        self::assertStringContainsString('LIMIT 20 OFFSET 0', FakeDB::$lastGetAllQuery ?? '');
    }

    public function testUnreadCountReadsCountFromRow(): void
    {
        FakeDB::queueGetRowResult(['c' => 3]);

        $model = new NotificationStub();
        $repository = new NotificationRepositoryDouble($model);

        $count = $repository->unreadCount(5);

        self::assertSame(3, $count);
        self::assertStringContainsString('read_at IS NULL', FakeDB::$lastGetRow[0] ?? '');
        self::assertSame([5], FakeDB::$lastGetRow[1] ?? []);
    }

    public function testMarkReadSetsReadAtOnTheGivenNotificationWithoutReloading(): void
    {
        $model = new NotificationStub();
        $model->load(9);
        $model->save(['account_id' => 1, 'receiver_user_id' => 5]);

        $repository = new NotificationRepositoryDouble($model);
        $result = $repository->markRead($model);

        self::assertArrayHasKey('read_at', $model->savedData);
        self::assertNotEmpty($model->savedData['read_at']);
        self::assertSame(9, $model->loadedId);
        self::assertTrue($result['is_read']);
    }

    public function testMarkAllReadExecutesUpdateForTheReceiver(): void
    {
        $model = new NotificationStub();
        $repository = new NotificationRepositoryDouble($model);

        $repository->markAllRead(5);

        self::assertStringContainsString(
            'SET read_at = ? WHERE receiver_user_id = ? AND read_at IS NULL',
            FakeDB::$lastExec[0] ?? ''
        );
        self::assertSame(5, FakeDB::$lastExec[1][1] ?? null);
    }
}

final class NotificationRepositoryDouble extends NotificationRepository
{
    protected $model;

    public function __construct(Notification $model)
    {
        $this->model = $model;
    }

    public function getModel(string $name = "")
    {
        return $this->model;
    }
}

final class NotificationStub extends Notification
{
    public array $savedData = [];
    public $loadedId;

    public function getDB()
    {
        return FakeDB::class;
    }

    public function save(array $data, $insertOnly = false)
    {
        $this->savedData = $data;
        $this->data = array_merge($this->data, $data);
        $this->data['id'] = $this->data['id'] ?? 42;
        return $this;
    }

    public function load($id, $idField = self::ID_FIELD)
    {
        $this->loadedId = $id;
        $this->data['id'] = $id;
        $this->data['created_at'] = $this->data['created_at'] ?? '2026-07-21 10:00:00';
        return $this;
    }

    public function getData(?string $k = null, $def = null): mixed
    {
        if ($k !== null) {
            return $this->data[$k] ?? $def;
        }
        return $this->data;
    }

    public function getId()
    {
        return $this->data['id'] ?? false;
    }

    public function isLoaded(): bool
    {
        return $this->getId() !== false;
    }
}
