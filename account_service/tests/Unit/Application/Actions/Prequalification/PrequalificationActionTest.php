<?php
declare(strict_types=1);

namespace Tests\Application\Actions\Prequalification;

use App\Application\Actions\Prequalification\PrequalificationAction;
use App\Application\Actions\Action;
use Psr\Log\LoggerInterface;
use Slim\Psr7\Response;
use Tests\Application\Actions\Account\PrequalificationRepositoryStub;
use Tests\TestCase;

final class PrequalificationActionTest extends TestCase
{
    public function testGetPrequalificationByIdAggregatesData(): void
    {
        $repository = new PrequalificationRepositoryStub();
        $repository->userOrganisationList = [['id' => 1]];
        $repository->referencesList = [['id' => 2]];
        $repository->turnoverList = [['year' => 2023]];
        $repository->metaList = ['type' => 'gold'];
        $repository->statusesList = [['id' => 4]];

        $action = $this->createAction($repository);
        $response = $action->getPrequalificationById(
            $this->createRequest('GET', '/v1/prequalification/5'),
            new Response(),
            ['id' => '5']
        );

        self::assertSame(200, $response->getStatusCode());
        $payload = json_decode((string) $response->getBody(), true, 512, JSON_THROW_ON_ERROR);
        self::assertSame($repository->userOrganisationList, $payload['data']['organisation']);
        self::assertSame($repository->referencesList, $payload['data']['references']);
        self::assertSame($repository->turnoverList, $payload['data']['turnover']);
        self::assertSame($repository->metaList, $payload['data']['meta']);
        self::assertSame($repository->statusesList, $payload['data']['statuses']);
    }

    public function testCreatePrequalificationSectionStatusesRequiresPayload(): void
    {
        $action = $this->createAction(new PrequalificationRepositoryStub());
        $response = $action->createPrequalificationSectionStatuses(
            $this->createRequest('POST', '/v1/prequalification/status'),
            new Response(),
            []
        );

        self::assertSame(400, $response->getStatusCode());
    }

    public function testCreatePrequalificationSectionStatusesPersists(): void
    {
        $repository = new PrequalificationRepositoryStub();
        $repository->nextSectionMappingId = 91;

        $action = $this->createAction($repository);
        $this->setActionData($action, ['section_id' => 3, 'status' => true]);

        $response = $action->createPrequalificationSectionStatuses(
            $this->createRequest('POST', '/v1/prequalification/status'),
            new Response(),
            []
        );

        self::assertSame(200, $response->getStatusCode());
        $payload = json_decode((string) $response->getBody(), true, 512, JSON_THROW_ON_ERROR);
        self::assertSame(91, $payload['data']['id']);
        self::assertSame([['section_id' => 3, 'status' => true]], $repository->sectionMappingSaveCalls);
    }

    public function testUpdatePrequalificationSectionStatusesUpdatesEntity(): void
    {
        $repository = new PrequalificationRepositoryStub();
        $repository->sectionMappingLoaded = true;

        $action = $this->createAction($repository);
        $this->setActionData($action, ['status' => false]);

        $response = $action->updatePrequalificationSectionStatuses(
            $this->createRequest('PATCH', '/v1/prequalification/status/7'),
            new Response(),
            ['id' => '7']
        );

        self::assertSame(203, $response->getStatusCode());
        self::assertSame([['status' => false]], $repository->sectionMappingUpdates);
    }

    public function testUpdatePrequalificationSectionStatusesSkipsWhenMappingMissing(): void
    {
        $repository = new PrequalificationRepositoryStub();
        $repository->sectionMappingLoaded = false;

        $action = $this->createAction($repository);
        $this->setActionData($action, ['status' => true]);

        $response = $action->updatePrequalificationSectionStatuses(
            $this->createRequest('PATCH', '/v1/prequalification/status/4'),
            new Response(),
            ['id' => '4']
        );

        self::assertSame(203, $response->getStatusCode());
        self::assertSame([], $repository->sectionMappingUpdates);
    }

    public function testUpdateSectionSavesWhenMissing(): void
    {
        $repository = new PrequalificationRepositoryStub();
        $repository->statusExists = false;

        $action = $this->createAction($repository);
        $this->setActionData($action, ['id' => 9, 'status' => true, 'section_message' => 'ok']);

        $response = $action->updateSection(
            $this->createRequest('PATCH', '/v1/prequalification/5/section'),
            new Response(),
            ['id' => '5']
        );

        self::assertSame(203, $response->getStatusCode());
        self::assertSame(
            [
                [
                    'account_id' => 5,
                    'section_id' => 9,
                    'status' => true,
                    'section_message' => 'ok',
                ],
            ],
            $repository->statusSaves
        );
    }

    public function testUpdateSectionUpdatesExistingStatus(): void
    {
        $repository = new PrequalificationRepositoryStub();
        $repository->statusExists = true;

        $action = $this->createAction($repository);
        $this->setActionData($action, ['id' => 11, 'status' => false, 'section_message' => 'pending']);

        $response = $action->updateSection(
            $this->createRequest('PATCH', '/v1/prequalification/6/section'),
            new Response(),
            ['id' => '6']
        );

        self::assertSame(203, $response->getStatusCode());
        self::assertSame(
            [
                [
                    'status' => false,
                    'section_message' => 'pending',
                ],
            ],
            $repository->statusUpdates
        );
        self::assertSame(
            [
                [
                    'account_id' => 6,
                    'section_id' => 11,
                ],
            ],
            $repository->statusFindCalls
        );
    }

    public function testUpdateSectionFallsBackToInsertWhenFindFails(): void
    {
        $repository = new PrequalificationRepositoryStub();
        $repository->statusFindThrows = true;

        $action = $this->createAction($repository);
        $this->setActionData($action, ['id' => 4, 'status' => true, 'section_message' => 'created']);

        $response = $action->updateSection(
            $this->createRequest('PATCH', '/v1/prequalification/2/section'),
            new Response(),
            ['id' => '2']
        );

        self::assertSame(203, $response->getStatusCode());
        self::assertSame([
            [
                'account_id' => 2,
                'section_id' => 4,
                'status' => true,
                'section_message' => 'created',
            ],
        ], $repository->statusSaves);
        self::assertSame([], $repository->statusUpdates);
    }

    public function testGetPrequalificationByIdReturnsEmptyDataWhenRepositoriesThrow(): void
    {
        $repository = new PrequalificationRepositoryStub();
        $repository->referencesThrows = true;
        $repository->statusesThrows = true;

        $action = $this->createAction($repository);
        $response = $action->getPrequalificationById(
            $this->createRequest('GET', '/v1/prequalification/9'),
            new Response(),
            ['id' => '9']
        );

        self::assertSame(200, $response->getStatusCode());
        $payload = json_decode((string) $response->getBody(), true, 512, JSON_THROW_ON_ERROR);
        self::assertSame([], $payload['data']['references']);
        self::assertSame([], $payload['data']['statuses']);
    }

    public function testUpdateStatusesByIdUpdatesExistingSections(): void
    {
        $repository = new PrequalificationRepositoryStub();
        $repository->statusExists = true;

        $action = $this->createAction($repository);
        $this->setActionData($action, [
            'status' => [
                'sections' => [
                    ['id' => 3, 'status' => true, 'message' => 'ok'],
                    ['id' => 4, 'status' => false, 'message' => 'hold'],
                ],
            ],
        ]);

        $response = $action->updateStatusesById(
            $this->createRequest('PATCH', '/v1/prequalification/5/status'),
            new Response(),
            ['id' => '5']
        );

        self::assertSame(203, $response->getStatusCode());
        self::assertSame([
            [
                'account_id' => 5,
                'section_id' => 3,
            ],
            [
                'account_id' => 5,
                'section_id' => 4,
            ],
        ], $repository->statusFindCalls);
        self::assertSame([
            [
                'status' => true,
                'section_message' => 'ok',
            ],
            [
                'status' => false,
                'section_message' => 'hold',
            ],
        ], $repository->statusUpdates);
        self::assertSame([], $repository->statusSaves);
    }

    public function testUpdateStatusesByIdInsertsMissingSections(): void
    {
        $repository = new PrequalificationRepositoryStub();
        $repository->statusExists = false;

        $action = $this->createAction($repository);
        $this->setActionData($action, [
            'status' => [
                'sections' => [
                    ['id' => 7, 'status' => false, 'message' => 'todo'],
                ],
            ],
        ]);

        $response = $action->updateStatusesById(
            $this->createRequest('PATCH', '/v1/prequalification/6/status'),
            new Response(),
            ['id' => '6']
        );

        self::assertSame(203, $response->getStatusCode());
        self::assertSame([
            [
                'account_id' => 6,
                'section_id' => 7,
            ],
        ], $repository->statusFindCalls);
        self::assertSame([
            [
                'account_id' => 6,
                'section_id' => 7,
                'status' => false,
                'section_message' => 'todo',
            ],
        ], $repository->statusSaves);
        self::assertSame([], $repository->statusUpdates);
    }

    public function testUpdateStatusesByIdFallsBackToInsertOnException(): void
    {
        $repository = new PrequalificationRepositoryStub();
        $repository->statusFindThrows = true;

        $action = $this->createAction($repository);
        $this->setActionData($action, [
            'status' => [
                'sections' => [
                    ['id' => 2, 'status' => true, 'message' => 'retry'],
                ],
            ],
        ]);

        $response = $action->updateStatusesById(
            $this->createRequest('PATCH', '/v1/prequalification/8/status'),
            new Response(),
            ['id' => '8']
        );

        self::assertSame(203, $response->getStatusCode());
        self::assertSame([
            [
                'account_id' => 8,
                'section_id' => 2,
            ],
        ], $repository->statusFindCalls);
        self::assertSame([
            [
                'account_id' => 8,
                'section_id' => 2,
                'status' => true,
                'section_message' => 'retry',
            ],
        ], $repository->statusSaves);
        self::assertSame([], $repository->statusUpdates);
    }

    public function testGetPrequalificationSectionsReturnsRepositoryData(): void
    {
        $repository = new PrequalificationRepositoryStub();
        $repository->prequalificationSections = [['id' => 4]];

        $action = $this->createAction($repository);
        $response = $action->getPrequalificationSections(
            $this->createRequest('GET', '/v1/prequalification/sections'),
            new Response(),
            []
        );

        self::assertSame(200, $response->getStatusCode());
        $payload = json_decode((string) $response->getBody(), true, 512, JSON_THROW_ON_ERROR);
        self::assertSame($repository->prequalificationSections, $payload['data']);
    }

    public function testUpdateTurnoverByIdUpdatesExistingAndCreatesNewRecords(): void
    {
        $repository = new PrequalificationRepositoryStub();
        $repository->updateModelOverrides[
            'account_turnover:' . json_encode(['account_id' => 7])
        ] = true; // for the initial reset call
        $repository->updateModelOverrides[
            'account_turnover:' . json_encode(['year' => 2021, 'account_id' => 7])
        ] = true; // simulate existing year

        $action = $this->createAction($repository);
        $this->setActionData($action, [
            ['year' => 2021, 'value' => 1000, 'profit_before_tax' => 50],
            ['year' => 2022, 'value' => 2000, 'profit_before_tax' => 75],
        ]);

        $response = $action->updateTurnoverById(
            $this->createRequest('PATCH', '/v1/prequalification/7/turnover'),
            new Response(),
            ['id' => '7']
        );

        self::assertSame(203, $response->getStatusCode());
        self::assertSame('account_turnover', $repository->updateModelCalls[0]['model']);
        self::assertSame(['active_trading' => 'false'], $repository->updateModelCalls[0]['data']);
        self::assertSame(['account_id' => 7], $repository->updateModelCalls[0]['conditions']);

        $yearCalls = array_slice($repository->updateModelCalls, 1);
        self::assertSame([
            'model' => 'account_turnover',
            'data' => [
                'value' => 1000,
                'active_trading' => true,
                'profit_before_tax' => 50,
            ],
            'conditions' => ['year' => 2021, 'account_id' => 7],
        ], $yearCalls[0]);
        self::assertSame([
            'model' => 'account_turnover',
            'data' => [
                'value' => 2000,
                'active_trading' => true,
                'profit_before_tax' => 75,
            ],
            'conditions' => ['year' => 2022, 'account_id' => 7],
        ], $yearCalls[1]);

        self::assertSame([
            [
                'year' => 2022,
                'value' => 2000,
                'profit_before_tax' => 75,
                'account_id' => 7,
            ],
        ], $repository->turnoverList);
    }

    public function testGetPrequalificationSectionListReturnsRepositoryData(): void
    {
        $repository = new PrequalificationRepositoryStub();
        $repository->prequalificationSectionList = [['id' => 1, 'label' => 'Basics']];

        $action = $this->createAction($repository);
        $response = $action->getPrequalificationSectionList(
            $this->createRequest('GET', '/v1/prequalification/sections/list'),
            new Response(),
            []
        );

        self::assertSame(200, $response->getStatusCode());
        $payload = json_decode((string) $response->getBody(), true, 512, JSON_THROW_ON_ERROR);
        self::assertSame($repository->prequalificationSectionList, $payload['data']);
    }

    public function testGetPrequalificationSectionStatusesFiltersByAccount(): void
    {
        $repository = new PrequalificationRepositoryStub();
        $repository->prequalificationSectionMappings = [['id' => 9]];

        $action = $this->createAction($repository);
        $response = $action->getPrequalificationSectionStatuses(
            $this->createRequest('GET', '/v1/prequalification/statuses/3'),
            new Response(),
            ['id' => '3']
        );

        self::assertSame(200, $response->getStatusCode());
        $payload = json_decode((string) $response->getBody(), true, 512, JSON_THROW_ON_ERROR);
        self::assertSame($repository->prequalificationSectionMappings, $payload['data']);
        self::assertSame([[ 'account_id' => 3 ]], $repository->sectionMappingAllCalls);
    }

    public function testGetPrequalificationSectionStatusesWithoutIdReturnsAll(): void
    {
        $repository = new PrequalificationRepositoryStub();
        $repository->prequalificationSectionMappings = [['id' => 1]];

        $action = $this->createAction($repository);
        $response = $action->getPrequalificationSectionStatuses(
            $this->createRequest('GET', '/v1/prequalification/statuses'),
            new Response(),
            []
        );

        self::assertSame(200, $response->getStatusCode());
        $payload = json_decode((string) $response->getBody(), true, 512, JSON_THROW_ON_ERROR);
        self::assertSame($repository->prequalificationSectionMappings, $payload['data']);
        self::assertSame([[]], $repository->sectionMappingAllCalls);
    }

    public function testGetPrequalificationSectionsByIdFiltersWhenIdProvided(): void
    {
        $repository = new PrequalificationRepositoryStub();
        $repository->statusesList = [['id' => 5]];

        $action = $this->createAction($repository);
        $response = $action->getPrequalificationSectionsById(
            $this->createRequest('GET', '/v1/prequalification/5/sections'),
            new Response(),
            ['id' => '5']
        );

        self::assertSame(200, $response->getStatusCode());
        $payload = json_decode((string) $response->getBody(), true, 512, JSON_THROW_ON_ERROR);
        self::assertSame($repository->statusesList, $payload['data']);
        self::assertSame([
            ['account_id' => 5],
            ['account_id' => 5],
        ], $repository->statusFindAllCalls);
    }

    public function testGetPrequalificationSectionsByIdWithoutIdReturnsAll(): void
    {
        $repository = new PrequalificationRepositoryStub();
        $repository->statusesList = [['id' => 1]];

        $action = $this->createAction($repository);
        $response = $action->getPrequalificationSectionsById(
            $this->createRequest('GET', '/v1/prequalification/sections/by-id'),
            new Response(),
            []
        );

        self::assertSame(200, $response->getStatusCode());
        $payload = json_decode((string) $response->getBody(), true, 512, JSON_THROW_ON_ERROR);
        self::assertSame($repository->statusesList, $payload['data']);
        self::assertSame([[]], $repository->statusFindAllCalls);
    }

    public function testUpdateReferencesByIdPersistsPayload(): void
    {
        $repository = new PrequalificationRepositoryStub();
        $repository->nextReferenceId = 42;

        $action = $this->createAction($repository);
        $this->setActionData($action, ['name' => 'Ref']);

        $response = $action->updateReferencesById(
            $this->createRequest('POST', '/v1/prequalification/8/reference'),
            new Response(),
            ['id' => '8']
        );

        $payload = json_decode((string) $response->getBody(), true, 512, JSON_THROW_ON_ERROR);
        self::assertSame(200, $response->getStatusCode());
        self::assertSame(42, $payload['data']['id']);
        self::assertSame([
            ['name' => 'Ref', 'account_id' => 8],
        ], $repository->referencesList);
    }

    public function testUpdateReferenceByIdUpdatesExistingReference(): void
    {
        $repository = new PrequalificationRepositoryStub();
        $repository->referenceLoaded = true;

        $action = $this->createAction($repository);
        $this->setActionData($action, ['name' => 'Updated']);

        $response = $action->updateReferenceById(
            $this->createRequest('PATCH', '/v1/prequalification/8/reference/5'),
            new Response(),
            ['id' => '8', 'rid' => '5']
        );

        self::assertSame(203, $response->getStatusCode());
        self::assertSame([
            ['name' => 'Updated', 'account_id' => 8, 'id' => 5],
        ], $repository->referencesSaveCalls);
    }

    public function testUpdateReferenceByIdDoesNothingWhenReferenceMissing(): void
    {
        $repository = new PrequalificationRepositoryStub();
        $repository->referenceLoaded = false;

        $action = $this->createAction($repository);
        $this->setActionData($action, ['name' => 'Updated']);

        $response = $action->updateReferenceById(
            $this->createRequest('PATCH', '/v1/prequalification/8/reference/5'),
            new Response(),
            ['id' => '8', 'rid' => '5']
        );

        self::assertSame(203, $response->getStatusCode());
        self::assertSame([], $repository->referencesSaveCalls);
    }

    private function createAction(PrequalificationRepositoryStub $repository): PrequalificationActionUnderTest
    {
        $logger = $this->createMock(LoggerInterface::class);
        return new PrequalificationActionUnderTest($logger, $repository);
    }

    private function setActionData(PrequalificationAction $action, array $data): void
    {
        $ref = new \ReflectionClass(Action::class);
        $prop = $ref->getProperty('data');
        $prop->setAccessible(true);
        $prop->setValue($action, $data);
    }
}

final class PrequalificationActionUnderTest extends PrequalificationAction
{
    public function __construct(LoggerInterface $logger, PrequalificationRepositoryStub $repository)
    {
        parent::__construct($logger);
        $this->repository = $repository;
    }
}
