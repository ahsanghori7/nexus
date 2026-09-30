<?php
declare(strict_types=1);

namespace Tests\Application\Actions\Threshold;

use App\Application\Actions\Threshold\ThresholdAction;
use App\Application\Actions\Action;
use Psr\Log\LoggerInterface;
use Slim\Psr7\Response;
use Tests\TestCase;

final class ThresholdActionTest extends TestCase
{
    public function testFetchThresholdsReturnsRepositoryData(): void
    {
        $repository = new ThresholdRepositoryStub();
        $repository->thresholds[5] = [['id' => 1]];

        $action = $this->createAction($repository);
        $response = $action->fetchThresholds(
            $this->createRequest('GET', '/v1/account/5/thresholds'),
            new Response(),
            ['aid' => '5']
        );

        self::assertSame(200, $response->getStatusCode());
        $payload = json_decode((string) $response->getBody(), true, 512, JSON_THROW_ON_ERROR);
        self::assertSame($repository->thresholds[5], $payload['data']);
    }

    public function testCreateThresholdReturnsSuccessPayload(): void
    {
        $repository = new ThresholdRepositoryStub();

        $action = $this->createAction($repository);
        $this->setActionData($action, ['account_id' => 9, 'value' => 2000]);

        $response = $action->createThreshold(
            $this->createRequest('POST', '/v1/account/9/thresholds'),
            new Response(),
            []
        );

        $payload = json_decode((string) $response->getBody(), true, 512, JSON_THROW_ON_ERROR);
        self::assertSame(200, $response->getStatusCode());
        self::assertSame(['success' => true], $payload['data']);
        self::assertSame([
            ['account_id' => 9, 'value' => 2000],
        ], $repository->userMappings);
    }

    public function testGetUserMappingsRequiresUserId(): void
    {
        $action = $this->createAction(new ThresholdRepositoryStub());
        $response = $action->getUserMappings(
            $this->createRequest('GET', '/v1/thresholds/user'),
            new Response(),
            []
        );

        self::assertSame(400, $response->getStatusCode());
    }

    public function testCreateUserMappingValidatesRequiredFields(): void
    {
        $action = $this->createAction(new ThresholdRepositoryStub());
        $response = $action->createUserMapping(
            $this->createRequest('POST', '/v1/thresholds/user'),
            new Response(),
            []
        );

        self::assertSame(400, $response->getStatusCode());
    }

    public function testCreateUserMappingPersistsRecord(): void
    {
        $repository = new ThresholdRepositoryStub();

        $action = $this->createAction($repository);
        $this->setActionData($action, ['user_id' => 5, 'can_approve_all' => true]);

        $response = $action->createUserMapping(
            $this->createRequest('POST', '/v1/thresholds/user'),
            new Response(),
            []
        );

        $payload = json_decode((string) $response->getBody(), true, 512, JSON_THROW_ON_ERROR);
        self::assertSame(200, $response->getStatusCode());
        self::assertSame(['success' => true], $payload['data']);
        self::assertSame([
            ['user_id' => 5, 'can_approve_all' => true],
        ], $repository->userMappings);
    }

    public function testDeleteUserMappingsRemovesRecords(): void
    {
        $repository = new ThresholdRepositoryStub();
        $repository->userMappings = [
            ['user_id' => 5, 'can_approve_all' => true],
            ['user_id' => 6, 'can_approve_all' => false],
        ];

        $action = $this->createAction($repository);
        $response = $action->deleteUserMappings(
            $this->createRequest('DELETE', '/v1/thresholds/user/5'),
            new Response(),
            ['user_id' => '5']
        );

        $payload = json_decode((string) $response->getBody(), true, 512, JSON_THROW_ON_ERROR);
        self::assertSame(200, $response->getStatusCode());
        self::assertSame([
            ['user_id' => 5],
        ], $repository->deleteWhereCalls);
        self::assertSame([
            ['user_id' => 6, 'can_approve_all' => false],
        ], $repository->userMappings);
        self::assertSame(['success' => true], $payload['data']);
    }

    public function testGetUsersByOrderValueReturnsRecords(): void
    {
        $repository = new ThresholdRepositoryStub();
        $repository->userMappings = [
            ['user_id' => 5, 'threshold' => 1000],
        ];

        $action = $this->createAction($repository);
        $response = $action->getUsersByOrderValue(
            $this->createRequest('GET', '/v1/account/4/thresholds')
                ->withQueryParams(['order_value' => '500', 'user_id' => '5']),
            new Response(),
            ['aid' => '4']
        );

        $payload = json_decode((string) $response->getBody(), true, 512, JSON_THROW_ON_ERROR);
        self::assertSame(200, $response->getStatusCode());
        self::assertSame($repository->userMappings, $payload['data']);
        self::assertSame([[4, 500.0, 5]], $repository->getByOrderValueCalls);
    }

    public function testGetUsersByThresholdIdReturnsBadRequestWhenIdMissing(): void
    {
        $action = $this->createAction(new ThresholdRepositoryStub());
        $response = $action->getUsersByThresholdId(
            $this->createRequest('GET', '/v1/thresholds/0/user'),
            new Response(),
            ['threshold_id' => '0']
        );

        self::assertSame(400, $response->getStatusCode());
    }

    public function testGetUsersByThresholdIdReturnsFilteredRecords(): void
    {
        $repository = new ThresholdRepositoryStub();
        $repository->userMappings = [
            ['user_id' => 5, 'approval_threshold_id' => 7],
            ['user_id' => 6, 'approval_threshold_id' => 8],
        ];

        $action = $this->createAction($repository);
        $response = $action->getUsersByThresholdId(
            $this->createRequest('GET', '/v1/thresholds/7/user'),
            new Response(),
            ['threshold_id' => '7']
        );

        $payload = json_decode((string) $response->getBody(), true, 512, JSON_THROW_ON_ERROR);
        self::assertSame(200, $response->getStatusCode());
        self::assertSame([
            ['user_id' => 5, 'approval_threshold_id' => 7],
        ], $payload['data']);
    }

    public function testGetAllUserMappingsReturnsEmptyWhenUserIdsMissing(): void
    {
        $action = $this->createAction(new ThresholdRepositoryStub());
        $response = $action->getAllUserMappings(
            $this->createRequest('GET', '/v1/thresholds/users'),
            new Response(),
            []
        );

        $payload = json_decode((string) $response->getBody(), true, 512, JSON_THROW_ON_ERROR);
        self::assertSame(200, $response->getStatusCode());
        self::assertSame([], $payload['data']);
    }

    public function testGetAllUserMappingsReturnsCountsForUserIds(): void
    {
        $repository = new ThresholdRepositoryStub();
        $repository->userMappings = [
            ['user_id' => 5],
            ['user_id' => 7],
        ];

        $action = $this->createAction($repository);
        $response = $action->getAllUserMappings(
            $this->createRequest('GET', '/v1/thresholds/users')
                ->withQueryParams(['user_ids' => [5, 6]]),
            new Response(),
            []
        );

        $payload = json_decode((string) $response->getBody(), true, 512, JSON_THROW_ON_ERROR);
        self::assertSame(200, $response->getStatusCode());
        self::assertSame([
            ['user_id' => 5],
        ], $payload['data']);
        self::assertSame([[5, 6]], $repository->getUsersRecordsCountCalls);
    }

    private function createAction(ThresholdRepositoryStub $repository): ThresholdActionUnderTest
    {
        $logger = $this->createMock(LoggerInterface::class);
        return new ThresholdActionUnderTest($logger, $repository);
    }

    private function setActionData(ThresholdAction $action, array $data): void
    {
        $ref = new \ReflectionClass(Action::class);
        $prop = $ref->getProperty('data');
        $prop->setAccessible(true);
        $prop->setValue($action, $data);
    }
}

final class ThresholdActionUnderTest extends ThresholdAction
{
    public function __construct(LoggerInterface $logger, private ThresholdRepositoryStub $repositoryStub)
    {
        parent::__construct($logger);
        $this->repository = $repositoryStub;
    }
}

final class ThresholdRepositoryStub
{
    public array $thresholds = [];
    public array $userMappings = [];
    public array $getByOrderValueCalls = [];
    public array $getUsersRecordsCountCalls = [];
    public array $deleteWhereCalls = [];

    public function getThresholds(int $accountId): array
    {
        return $this->thresholds[$accountId] ?? [];
    }

    public function getModel(string $name = '')
    {
        return new ThresholdMappingModelStub($this);
    }
}

final class ThresholdMappingModelStub
{
    public function __construct(private ThresholdRepositoryStub $repository)
    {
    }

    public function all(): array
    {
        return $this->repository->userMappings;
    }

    public function getByOrderValue(int $accountId, float $orderValue, int $userId): array
    {
        $this->repository->getByOrderValueCalls[] = [$accountId, $orderValue, $userId];
        return $this->repository->userMappings;
    }

    public function getUsersRecordsCount(array $userIds): array
    {
        $this->repository->getUsersRecordsCountCalls[] = $userIds;
        return array_values(
            array_filter(
                $this->repository->userMappings,
                static fn(array $record): bool => in_array($record['user_id'], $userIds, true)
            )
        );
    }

    public function save(array $data): void
    {
        $this->repository->userMappings[] = $data;
    }

    public function deleteWhere(array $conditions): void
    {
        $this->repository->deleteWhereCalls[] = $conditions;
        $userId = $conditions['user_id'] ?? null;
        $permissionId = $conditions['permission_id'] ?? null;
        if ($userId === null && $permissionId === null) {
            $this->repository->userMappings = [];
            return;
        }
        $this->repository->userMappings = array_values(array_filter(
            $this->repository->userMappings,
            static function (array $record) use ($userId, $permissionId): bool {
                if ($userId !== null && (int)$record['user_id'] !== $userId) {
                    return true;
                }
                if ($permissionId !== null && (int)$record['permission_id'] !== $permissionId) {
                    return true;
                }
                return false;
            }
        ));
    }
}
