<?php

declare(strict_types=1);

namespace Tests\Unit\Application\Actions;

use App\Application\Actions\PartnerCatalogue\PartnerCatalogueAction;
use App\Domain\Project\PartnerCatalogue\PartnerProjectCatalogue;
use App\Domain\Project\PartnerCatalogue\PartnerProjectCatalogueRepository;
use App\Domain\Project\ProjectRepository;
use PHPUnit\Framework\MockObject\MockObject;
use PHPUnit\Framework\TestCase;
use Psr\Http\Message\ResponseInterface;
use Psr\Log\LoggerInterface;
use Slim\Psr7\Factory\ResponseFactory;
use Slim\Psr7\Factory\ServerRequestFactory;

class PartnerCatalogueActionTest extends TestCase
{
    private const HASH = 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855';

    private function responses(): ResponseFactory
    {
        return new ResponseFactory();
    }

    private function request(string $method, array $query = [])
    {
        $request = (new ServerRequestFactory())->createServerRequest($method, '/v1/partner_catalogue');

        return $query ? $request->withQueryParams($query) : $request;
    }

    /**
     * @return PartnerProjectCatalogueRepository&MockObject
     */
    private function repository()
    {
        return $this->createMock(PartnerProjectCatalogueRepository::class);
    }

    private function action(PartnerProjectCatalogueRepository $repository): PartnerCatalogueAction
    {
        return new PartnerCatalogueAction($this->createMock(LoggerInterface::class), $repository);
    }

    /**
     * @param bool $nameExists whether a C-Link project already uses the submitted name
     * @return ProjectRepository&MockObject
     */
    private function projects(bool $nameExists = false)
    {
        $model = new class ($nameExists) {
            private bool $exists;

            public function __construct(bool $exists)
            {
                $this->exists = $exists;
            }

            public function load($id, $idField = 'id')
            {
                return $this;
            }

            public function isLoaded(): bool
            {
                return $this->exists;
            }
        };

        $projects = $this->createMock(ProjectRepository::class);
        $projects->method('getModel')->willReturn($model);

        return $projects;
    }

    private function actionWithBody(
        PartnerProjectCatalogueRepository $repository,
        array $body,
        ?ProjectRepository $projects = null
    ): PartnerCatalogueAction {
        $projects = $projects ?? $this->projects();

        return new class($this->createMock(LoggerInterface::class), $repository, $body, $projects) extends PartnerCatalogueAction {
            private array $body;

            public function __construct($logger, $repository, array $body, $projects)
            {
                parent::__construct($logger, $repository, $projects);
                $this->body = $body;
            }

            public function getData($k = null, $default = null)
            {
                return $k === null ? $this->body : ($this->body[$k] ?? $default);
            }
        };
    }

    private function record(array $overrides = []): PartnerProjectCatalogue
    {
        $model = new PartnerProjectCatalogue();
        $model->setRawAttributes(array_merge([
            'id' => 7,
            'api_client_id' => 1,
            'group_id' => 9,
            'external_id' => 'IFS-PRJ-0042',
            'project_code' => 'MCL-0042',
            'project_name' => 'Riverside Depot Refurbishment',
            'business_unit_code' => '10',
            'business_unit_name' => 'London',
            'source_payload_hash' => self::HASH,
            'c_link_project_id' => null,
        ], $overrides));

        return $model;
    }

    private function decode(ResponseInterface $response): array
    {
        return json_decode((string) $response->getBody(), true) ?? [];
    }

    private function validBody(array $overrides = []): array
    {
        return array_merge([
            'api_client_id' => 1,
            'group_id' => 9,
            'external_id' => 'IFS-PRJ-0042',
            'project_code' => 'MCL-0042',
            'project_name' => 'Riverside Depot Refurbishment',
            'business_unit_code' => '10',
            'business_unit_name' => 'London',
        ], $overrides);
    }

    /* ---------------------------------------------------------------- list */

    public function testListRequiresAnApiClientId(): void
    {
        $repository = $this->repository();
        $repository->expects(self::never())->method('listForClient');

        $response = $this->action($repository)->listCatalogue(
            $this->request('GET'),
            $this->responses()->createResponse(),
            []
        );

        self::assertSame(400, $response->getStatusCode());
    }

    public function testListReturnsRecordsAndTotal(): void
    {
        $repository = $this->repository();
        $repository->method('listForClient')->willReturn([['external_id' => 'IFS-PRJ-0042']]);
        $repository->method('countForClient')->willReturn(1);

        $response = $this->action($repository)->listCatalogue(
            $this->request('GET', ['api_client_id' => '1']),
            $this->responses()->createResponse(),
            []
        );

        self::assertSame(200, $response->getStatusCode());
        $data = $this->decode($response)['data'];
        self::assertSame('IFS-PRJ-0042', $data['records'][0]['external_id']);
        self::assertSame(1, $data['total']);
    }

    public function testListScopesToTheGivenClientAndAppliesPagination(): void
    {
        $repository = $this->repository();
        $repository->expects(self::once())
            ->method('listForClient')
            ->with(42, self::anything(), 50, 100)
            ->willReturn([]);
        $repository->method('countForClient')->willReturn(0);

        $this->action($repository)->listCatalogue(
            $this->request('GET', ['api_client_id' => '42', 'limit' => '50', 'offset' => '100']),
            $this->responses()->createResponse(),
            []
        );
    }

    public function testListPassesBusinessUnitAndLinkedFilters(): void
    {
        $repository = $this->repository();
        $repository->expects(self::once())
            ->method('listForClient')
            ->with(1, ['business_unit_code' => '10', 'linked' => false], self::anything(), self::anything())
            ->willReturn([]);
        $repository->method('countForClient')->willReturn(0);

        $this->action($repository)->listCatalogue(
            $this->request('GET', ['api_client_id' => '1', 'business_unit_code' => '10', 'linked' => '0']),
            $this->responses()->createResponse(),
            []
        );
    }

    public function testListTreatsLinkedTrueAsABooleanFilter(): void
    {
        $repository = $this->repository();
        $repository->expects(self::once())
            ->method('listForClient')
            ->with(1, ['linked' => true], self::anything(), self::anything())
            ->willReturn([]);
        $repository->method('countForClient')->willReturn(0);

        $this->action($repository)->listCatalogue(
            $this->request('GET', ['api_client_id' => '1', 'linked' => 'true']),
            $this->responses()->createResponse(),
            []
        );
    }

    /* ------------------------------------------------------- get by extid */

    public function testGetByExternalIdRequiresClientAndExternalId(): void
    {
        $action = $this->action($this->repository());

        self::assertSame(400, $action->getByExternalId(
            $this->request('GET'),
            $this->responses()->createResponse(),
            ['external_id' => 'IFS-PRJ-0042']
        )->getStatusCode());

        self::assertSame(400, $action->getByExternalId(
            $this->request('GET', ['api_client_id' => '1']),
            $this->responses()->createResponse(),
            []
        )->getStatusCode());
    }

    public function testGetByExternalIdReturns404WhenNotAvailableToTheClient(): void
    {
        $repository = $this->repository();
        $repository->method('findByExternalId')->willReturn(null);

        $response = $this->action($repository)->getByExternalId(
            $this->request('GET', ['api_client_id' => '1']),
            $this->responses()->createResponse(),
            ['external_id' => 'IFS-PRJ-0042']
        );

        self::assertSame(404, $response->getStatusCode());
    }

    public function testGetByExternalIdIsScopedToTheClient(): void
    {
        $repository = $this->repository();
        $repository->expects(self::once())
            ->method('findByExternalId')
            ->with(42, 'IFS-PRJ-0042')
            ->willReturn($this->record());

        $response = $this->action($repository)->getByExternalId(
            $this->request('GET', ['api_client_id' => '42']),
            $this->responses()->createResponse(),
            ['external_id' => 'IFS-PRJ-0042']
        );

        self::assertSame(200, $response->getStatusCode());
        self::assertSame('IFS-PRJ-0042', $this->decode($response)['data']['external_id']);
    }

    /* -------------------------------------------------------------- create */

    public function testCreateRequiresClientAndExternalId(): void
    {
        $repository = $this->repository();
        $repository->expects(self::never())->method('createRecord');

        $response = $this->actionWithBody($repository, ['project_code' => 'MCL-0042'])->createCatalogue(
            $this->request('POST'),
            $this->responses()->createResponse(),
            []
        );

        self::assertSame(400, $response->getStatusCode());
    }

    public function testCreateReturns201ForANewRecord(): void
    {
        $repository = $this->repository();
        $repository->method('canonicalHash')->willReturn(self::HASH);
        $repository->method('findByExternalId')->willReturn(null);
        $repository->expects(self::once())->method('createRecord')->willReturn($this->record());

        $response = $this->actionWithBody($repository, $this->validBody())->createCatalogue(
            $this->request('POST'),
            $this->responses()->createResponse(),
            []
        );

        self::assertSame(201, $response->getStatusCode());
        self::assertSame('IFS-PRJ-0042', $this->decode($response)['data']['external_id']);
    }

    public function testCreateReturns400WhenAClinkProjectAlreadyUsesTheName(): void
    {
        $repository = $this->repository();
        $repository->method('canonicalHash')->willReturn(self::HASH);
        $repository->method('findByExternalId')->willReturn(null);
        $repository->expects(self::never())->method('createRecord');

        $response = $this->actionWithBody($repository, $this->validBody(), $this->projects(true))
            ->createCatalogue($this->request('POST'), $this->responses()->createResponse(), []);

        self::assertSame(400, $response->getStatusCode());
        self::assertSame(
            'Project name already exists',
            $this->decode($response)['error']['description'] ?? null
        );
    }

    public function testIdenticalReplayIsNotBlockedByTheDuplicateNameGuard(): void
    {
        $repository = $this->repository();
        $repository->method('canonicalHash')->willReturn(self::HASH);
        $repository->method('findByExternalId')->willReturn($this->record());

        $response = $this->actionWithBody($repository, $this->validBody(), $this->projects(true))
            ->createCatalogue($this->request('POST'), $this->responses()->createResponse(), []);

        self::assertSame(200, $response->getStatusCode());
    }

    public function testCreateSkipsTheNameGuardWhenTheProjectNameIsBlank(): void
    {
        $repository = $this->repository();
        $repository->method('canonicalHash')->willReturn(self::HASH);
        $repository->method('findByExternalId')->willReturn(null);
        $repository->expects(self::once())->method('createRecord')->willReturn($this->record());

        $body = $this->validBody(['project_name' => '  ']);

        $response = $this->actionWithBody($repository, $body, $this->projects(true))
            ->createCatalogue($this->request('POST'), $this->responses()->createResponse(), []);

        self::assertSame(201, $response->getStatusCode());
    }

    public function testCreateStoresTheResolvedHashAndMapping(): void
    {
        $repository = $this->repository();
        $repository->method('canonicalHash')->willReturn(self::HASH);
        $repository->method('findByExternalId')->willReturn(null);
        $repository->expects(self::once())
            ->method('createRecord')
            ->with(self::callback(function (array $record): bool {
                return $record['api_client_id'] === 1
                    && $record['group_id'] === 9
                    && $record['source_payload_hash'] === self::HASH
                    && $record['business_unit_code'] === '10';
            }))
            ->willReturn($this->record());

        $this->actionWithBody($repository, $this->validBody())->createCatalogue(
            $this->request('POST'),
            $this->responses()->createResponse(),
            []
        );
    }

    public function testCreateIgnoresPartnerSuppliedLinkFields(): void
    {
        $repository = $this->repository();
        $repository->method('canonicalHash')->willReturn(self::HASH);
        $repository->method('findByExternalId')->willReturn(null);
        $repository->expects(self::once())
            ->method('createRecord')
            ->with(self::callback(
                static fn(array $record): bool => !array_key_exists('c_link_project_id', $record)
                    && !array_key_exists('linked_at', $record)
            ))
            ->willReturn($this->record());

        $body = $this->validBody(['c_link_project_id' => 999, 'linked_at' => '2026-01-01 00:00:00']);

        $this->actionWithBody($repository, $body)->createCatalogue(
            $this->request('POST'),
            $this->responses()->createResponse(),
            []
        );
    }

    public function testIdenticalReplayReturns200AndDoesNotWrite(): void
    {
        $repository = $this->repository();
        $repository->method('canonicalHash')->willReturn(self::HASH);
        $repository->method('findByExternalId')->willReturn($this->record(['source_payload_hash' => self::HASH]));
        $repository->expects(self::never())->method('createRecord');

        $response = $this->actionWithBody($repository, $this->validBody())->createCatalogue(
            $this->request('POST'),
            $this->responses()->createResponse(),
            []
        );

        self::assertSame(200, $response->getStatusCode());
        self::assertSame('IFS-PRJ-0042', $this->decode($response)['data']['external_id']);
    }

    public function testDivergentReplayReturns409AndDoesNotOverwrite(): void
    {
        $repository = $this->repository();
        $repository->method('canonicalHash')->willReturn(self::HASH);
        $repository->method('findByExternalId')->willReturn($this->record(['source_payload_hash' => str_repeat('b', 64)]));
        $repository->expects(self::never())->method('createRecord');

        $response = $this->actionWithBody($repository, $this->validBody())->createCatalogue(
            $this->request('POST'),
            $this->responses()->createResponse(),
            []
        );

        self::assertSame(409, $response->getStatusCode());
    }

    public function testCreateReturnsGenericErrorAndLeaksNoDriverDetailOnFailure(): void
    {
        $repository = $this->repository();
        $repository->method('canonicalHash')->willReturn(self::HASH);
        $repository->method('findByExternalId')->willReturn(null);
        $repository->method('createRecord')->willThrowException(
            new \RuntimeException("SQLSTATE[23000]: insert into `partner_project_catalogue` ...")
        );

        $response = $this->actionWithBody($repository, $this->validBody())->createCatalogue(
            $this->request('POST'),
            $this->responses()->createResponse(),
            []
        );

        $body = (string) $response->getBody();

        self::assertSame(500, $response->getStatusCode());
        self::assertStringNotContainsString('SQLSTATE', $body);
        self::assertStringNotContainsString('insert into', $body);
    }

    public function testAvailableReturnsNothingWithoutAuthorisedMappings(): void
    {
        $repository = $this->repository();
        $repository->expects(self::never())->method('listAvailable');

        $response = $this->action($repository)->listAvailable(
            $this->request('GET'),
            $this->responses()->createResponse(),
            []
        );

        $data = $this->decode($response)['data'];

        self::assertSame(200, $response->getStatusCode());
        self::assertSame([], $data['records']);
        self::assertSame(0, $data['total']);
    }

    public function testAvailablePassesMappingIdsSearchAndPagination(): void
    {
        $repository = $this->repository();
        $repository->expects(self::once())
            ->method('listAvailable')
            ->with([9, 11], 'depot', 10, 20)
            ->willReturn([]);
        $repository->expects(self::once())
            ->method('countAvailable')
            ->with([9, 11], 'depot')
            ->willReturn(0);

        $response = $this->action($repository)->listAvailable(
            $this->request('GET', [
                'mapping_ids' => '9,11',
                'search' => ' depot ',
                'limit' => '10',
                'offset' => '20',
            ]),
            $this->responses()->createResponse(),
            []
        );

        self::assertSame(200, $response->getStatusCode());
    }

    public function testAvailableClampsLimitToTheMaximum(): void
    {
        $repository = $this->repository();
        $repository->expects(self::once())
            ->method('listAvailable')
            ->with([9], '', PartnerCatalogueAction::MAX_AVAILABLE_LIMIT, 0)
            ->willReturn([]);
        $repository->method('countAvailable')->willReturn(0);

        $this->action($repository)->listAvailable(
            $this->request('GET', ['mapping_ids' => '9', 'limit' => '10000', 'offset' => '-5']),
            $this->responses()->createResponse(),
            []
        );
    }

    public function testAvailableFloorsAnInvalidLimit(): void
    {
        $repository = $this->repository();
        $repository->expects(self::once())
            ->method('listAvailable')
            ->with([9], '', 1, 0)
            ->willReturn([]);
        $repository->method('countAvailable')->willReturn(0);

        $this->action($repository)->listAvailable(
            $this->request('GET', ['mapping_ids' => '9', 'limit' => '0']),
            $this->responses()->createResponse(),
            []
        );
    }

    public function testAvailableExposesOnlySelectorFields(): void
    {
        $repository = $this->repository();
        $repository->method('listAvailable')->willReturn([$this->record()->toArray()]);
        $repository->method('countAvailable')->willReturn(1);

        $response = $this->action($repository)->listAvailable(
            $this->request('GET', ['mapping_ids' => '9']),
            $this->responses()->createResponse(),
            []
        );

        $record = $this->decode($response)['data']['records'][0];

        self::assertSame(
            ['id', 'external_id', 'project_code', 'project_name', 'business_unit_code', 'business_unit_name'],
            array_keys($record)
        );
        self::assertSame('MCL-0042', $record['project_code']);
        self::assertSame('London', $record['business_unit_name']);
    }

    /* ---------------------------------------------- selector: by project */

    public function testGetByProjectIdRequiresProjectIdAndMappings(): void
    {
        $action = $this->action($this->repository());

        self::assertSame(400, $action->getByProjectId(
            $this->request('GET', ['mapping_ids' => '9']),
            $this->responses()->createResponse(),
            ['project_id' => 0]
        )->getStatusCode());

        self::assertSame(400, $action->getByProjectId(
            $this->request('GET'),
            $this->responses()->createResponse(),
            ['project_id' => 55]
        )->getStatusCode());
    }

    public function testGetByProjectIdReturns404WhenNotLinkedOrOutOfScope(): void
    {
        $repository = $this->repository();
        $repository->method('findByProjectId')->willReturn(null);

        $response = $this->action($repository)->getByProjectId(
            $this->request('GET', ['mapping_ids' => '9']),
            $this->responses()->createResponse(),
            ['project_id' => 55]
        );

        self::assertSame(404, $response->getStatusCode());
    }

    public function testGetByProjectIdReturnsLinkedMetadataScopedToMappings(): void
    {
        $repository = $this->repository();
        $repository->expects(self::once())
            ->method('findByProjectId')
            ->with(55, [9])
            ->willReturn($this->record(['c_link_project_id' => 55]));

        $response = $this->action($repository)->getByProjectId(
            $this->request('GET', ['mapping_ids' => '9']),
            $this->responses()->createResponse(),
            ['project_id' => 55]
        );

        $data = $this->decode($response)['data'];

        self::assertSame(200, $response->getStatusCode());
        self::assertSame('IFS-PRJ-0042', $data['external_id']);
        self::assertSame('London', $data['business_unit_name']);
        self::assertArrayNotHasKey('api_client_id', $data);
        self::assertArrayNotHasKey('group_id', $data);
    }
}
