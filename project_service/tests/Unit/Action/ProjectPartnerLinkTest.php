<?php

declare(strict_types=1);

namespace Tests\Unit\Action;

use App\Application\Actions\Project\ProjectAction;
use App\Domain\Project\PartnerCatalogue\PartnerProjectCatalogue;
use App\Domain\Project\PartnerCatalogue\PartnerProjectCatalogueRepository;
use App\Domain\Project\ProjectRepository;
use PHPUnit\Framework\TestCase;
use Psr\Http\Message\ResponseInterface;
use Psr\Log\LoggerInterface;
use Slim\Psr7\Factory\ResponseFactory;
use Slim\Psr7\Factory\ServerRequestFactory;

class ProjectPartnerLinkTest extends TestCase
{
    private const CATALOGUE_ID = 7;
    private const PROJECT_ID = 42;

    private function projectRepository(bool $nameTaken = false)
    {
        $model = new class ($nameTaken) {
            public function __construct(private bool $loaded)
            {
            }

            public function load($value, string $field = 'id'): self
            {
                return $this;
            }

            public function isLoaded(): bool
            {
                return $this->loaded;
            }
        };

        $repository = $this->createMock(ProjectRepository::class);
        $repository->method('getModel')->willReturn($model);
        $repository->method('generateSlug')->willReturn('riverside-depot-refurbishment');
        // Run the unit of work inline so the closure is exercised.
        $repository->method('transaction')->willReturnCallback(static fn(callable $work) => $work());
        $repository->method('create')->willReturn(self::PROJECT_ID);

        return $repository;
    }

    private function catalogueRecord(array $overrides = []): PartnerProjectCatalogue
    {
        $model = new PartnerProjectCatalogue();
        $model->setRawAttributes(array_merge([
            'id' => self::CATALOGUE_ID,
            'api_client_id' => 1,
            'group_id' => 9,
            'external_id' => 'IFS-PRJ-0042',
            'project_code' => 'MCL-0042',
            'project_name' => 'Riverside Depot Refurbishment',
            'business_unit_code' => '10',
            'business_unit_name' => 'London',
            'c_link_project_id' => null,
        ], $overrides));

        return $model;
    }

    private function action(
        ProjectRepository $repository,
        PartnerProjectCatalogueRepository $catalogue,
        array $body
    ): ProjectAction {
        $action = new class ($this->createMock(LoggerInterface::class), $repository, $catalogue) extends ProjectAction {
            private array $body = [];

            public function withBody(array $body): self
            {
                $this->body = $body;

                return $this;
            }

            public function getData($k = null, $default = null)
            {
                return $k === null ? $this->body : ($this->body[$k] ?? $default);
            }
        };

        return $action->withBody($body);
    }

    private function body(array $overrides = []): array
    {
        return array_merge([
            'partner_project_catalogue_id' => self::CATALOGUE_ID,
            'authorised_business_unit_mapping_ids' => [9, 11],
            'group_id' => 100,
            'author_id' => 5,
        ], $overrides);
    }

    private function execute(ProjectAction $action): ResponseInterface
    {
        return $action->create(
            (new ServerRequestFactory())->createServerRequest('POST', '/v1/project'),
            (new ResponseFactory())->createResponse(),
            []
        );
    }

    private function decode(ResponseInterface $response): array
    {
        $decoded = json_decode((string) $response->getBody(), true);

        return is_array($decoded) ? ($decoded['data'] ?? []) : [];
    }

    public function testLinksAnUnlinkedCatalogueRecord(): void
    {
        $catalogue = $this->createMock(PartnerProjectCatalogueRepository::class);
        $catalogue->method('findById')->with(self::CATALOGUE_ID)->willReturn($this->catalogueRecord());
        $catalogue->expects(self::once())
            ->method('linkToProject')
            ->with(self::CATALOGUE_ID, self::PROJECT_ID)
            ->willReturn(true);

        $repository = $this->projectRepository();
        $repository->expects(self::once())->method('createProjectMapping');

        $data = $this->decode($this->execute($this->action($repository, $catalogue, $this->body())));

        self::assertTrue($data['status']);
        self::assertSame(self::PROJECT_ID, $data['id']);
    }

    public function testNameAndReferenceComeFromTheCatalogueNotTheRequest(): void
    {
        $catalogue = $this->createMock(PartnerProjectCatalogueRepository::class);
        $catalogue->method('findById')->willReturn($this->catalogueRecord());
        $catalogue->method('linkToProject')->willReturn(true);

        $repository = $this->projectRepository();
        $repository->expects(self::once())
            ->method('create')
            ->with(self::callback(static function (array $data): bool {
                return $data['name'] === 'Riverside Depot Refurbishment'
                    && $data['reference'] === 'MCL-0042';
            }))
            ->willReturn(self::PROJECT_ID);

        $this->execute($this->action($repository, $catalogue, $this->body([
            'name' => 'Attacker Supplied Name',
            'reference' => 'ATTACKER-001',
        ])));
    }

    public function testCatalogueFieldsAreNotPassedAsProjectColumns(): void
    {
        $catalogue = $this->createMock(PartnerProjectCatalogueRepository::class);
        $catalogue->method('findById')->willReturn($this->catalogueRecord());
        $catalogue->method('linkToProject')->willReturn(true);

        $repository = $this->projectRepository();
        $repository->expects(self::once())
            ->method('create')
            ->with(self::callback(static function (array $data): bool {
                return !array_key_exists('partner_project_catalogue_id', $data)
                    && !array_key_exists('authorised_business_unit_mapping_ids', $data);
            }))
            ->willReturn(self::PROJECT_ID);

        $this->execute($this->action($repository, $catalogue, $this->body()));
    }

    public function testLinkingDoesNotWriteToTheIntegrationMapping(): void
    {
        $catalogue = $this->createMock(PartnerProjectCatalogueRepository::class);
        $catalogue->method('findById')->willReturn($this->catalogueRecord());
        $catalogue->method('linkToProject')->willReturn(true);

        $repository = $this->projectRepository();
        $repository->expects(self::never())->method('saveProjectIntegration');

        $this->execute($this->action($repository, $catalogue, $this->body()));
    }

    public function testAsiteMappingIsStillWrittenWhileIfsOwnsTheIdentity(): void
    {
        $catalogue = $this->createMock(PartnerProjectCatalogueRepository::class);
        $catalogue->method('findById')->willReturn($this->catalogueRecord());
        $catalogue->method('linkToProject')->willReturn(true);

        $repository = $this->projectRepository();
        $repository->expects(self::once())
            ->method('saveProjectIntegration')
            ->with(self::PROJECT_ID, 3, self::anything());
        $repository->expects(self::once())
            ->method('create')
            ->with(self::callback(static fn(array $data): bool => $data['name'] === 'Riverside Depot Refurbishment'))
            ->willReturn(self::PROJECT_ID);

        $this->execute($this->action($repository, $catalogue, $this->body([
            'integration_id' => 'ASITE-1',
            'provider_id' => 3,
        ])));
    }

    public function testUnknownCatalogueRecordIsRejected(): void
    {
        $catalogue = $this->createMock(PartnerProjectCatalogueRepository::class);
        $catalogue->method('findById')->willReturn(null);

        $repository = $this->projectRepository();
        $repository->expects(self::never())->method('create');

        $data = $this->decode($this->execute($this->action($repository, $catalogue, $this->body())));

        self::assertFalse($data['status']);
        self::assertSame(ProjectAction::PROJECT_ERRORS['catalogue_not_found'], $data['error']);
    }

    public function testRecordMappedToAnotherGroupIsRejected(): void
    {
        $catalogue = $this->createMock(PartnerProjectCatalogueRepository::class);
        $catalogue->method('findById')->willReturn($this->catalogueRecord(['group_id' => 99]));

        $repository = $this->projectRepository();
        $repository->expects(self::never())->method('create');

        $data = $this->decode($this->execute($this->action($repository, $catalogue, $this->body())));

        self::assertFalse($data['status']);
        self::assertSame(ProjectAction::PROJECT_ERRORS['catalogue_not_authorised'], $data['error']);
    }

    public function testMissingAuthorisationListIsRejected(): void
    {
        $catalogue = $this->createMock(PartnerProjectCatalogueRepository::class);
        $catalogue->method('findById')->willReturn($this->catalogueRecord());

        $repository = $this->projectRepository();
        $repository->expects(self::never())->method('create');

        $body = $this->body();
        unset($body['authorised_business_unit_mapping_ids']);

        $data = $this->decode($this->execute($this->action($repository, $catalogue, $body)));

        self::assertFalse($data['status']);
        self::assertSame(ProjectAction::PROJECT_ERRORS['catalogue_not_authorised'], $data['error']);
    }

    public function testAlreadyLinkedRecordIsRejected(): void
    {
        $catalogue = $this->createMock(PartnerProjectCatalogueRepository::class);
        $catalogue->method('findById')->willReturn($this->catalogueRecord(['c_link_project_id' => 500]));

        $repository = $this->projectRepository();
        $repository->expects(self::never())->method('create');

        $data = $this->decode($this->execute($this->action($repository, $catalogue, $this->body())));

        self::assertFalse($data['status']);
        self::assertSame(ProjectAction::PROJECT_ERRORS['catalogue_linked'], $data['error']);
    }

    public function testLosingAConcurrentClaimAbortsTheUnitOfWork(): void
    {
        $catalogue = $this->createMock(PartnerProjectCatalogueRepository::class);
        $catalogue->method('findById')->willReturn($this->catalogueRecord());
        // Another request claimed the record first.
        $catalogue->method('linkToProject')->willReturn(false);

        $repository = $this->projectRepository();
        $repository->expects(self::never())->method('saveProjectIntegration');

        $data = $this->decode($this->execute($this->action($repository, $catalogue, $this->body([
            'integration_id' => 'ASITE-1',
            'provider_id' => 3,
        ]))));

        self::assertFalse($data['status']);
        self::assertSame(ProjectAction::PROJECT_ERRORS['catalogue_linked'], $data['error']);
    }

    public function testCatalogueNameLongerThanTheColumnIsRejected(): void
    {
        $catalogue = $this->createMock(PartnerProjectCatalogueRepository::class);
        $catalogue->method('findById')->willReturn($this->catalogueRecord([
            'project_name' => str_repeat('a', ProjectAction::PROJECT_NAME_MAX_LENGTH + 1),
        ]));

        $repository = $this->projectRepository();
        $repository->expects(self::never())->method('create');

        $data = $this->decode($this->execute($this->action($repository, $catalogue, $this->body())));

        self::assertFalse($data['status']);
        self::assertSame(ProjectAction::PROJECT_ERRORS['catalogue_name_too_long'], $data['error']);
    }

    public function testNameAtTheColumnLimitIsAccepted(): void
    {
        $catalogue = $this->createMock(PartnerProjectCatalogueRepository::class);
        $catalogue->method('findById')->willReturn($this->catalogueRecord([
            'project_name' => str_repeat('a', ProjectAction::PROJECT_NAME_MAX_LENGTH),
        ]));
        $catalogue->method('linkToProject')->willReturn(true);

        $data = $this->decode($this->execute(
            $this->action($this->projectRepository(), $catalogue, $this->body())
        ));

        self::assertTrue($data['status']);
    }

    public function testAccentedCatalogueNameIsMeasuredInCharactersNotBytes(): void
    {
        // 150 multi-byte characters is within the column width.
        $catalogue = $this->createMock(PartnerProjectCatalogueRepository::class);
        $catalogue->method('findById')->willReturn($this->catalogueRecord([
            'project_name' => str_repeat('ș', ProjectAction::PROJECT_NAME_MAX_LENGTH),
        ]));
        $catalogue->method('linkToProject')->willReturn(true);

        $data = $this->decode($this->execute(
            $this->action($this->projectRepository(), $catalogue, $this->body())
        ));

        self::assertTrue($data['status']);
    }

    public function testDuplicateProjectNameIsRejectedBeforeLinking(): void
    {
        $catalogue = $this->createMock(PartnerProjectCatalogueRepository::class);
        $catalogue->method('findById')->willReturn($this->catalogueRecord());
        $catalogue->expects(self::never())->method('linkToProject');

        $repository = $this->projectRepository(true);
        $repository->expects(self::never())->method('create');

        $data = $this->decode($this->execute($this->action($repository, $catalogue, $this->body())));

        self::assertFalse($data['status']);
        self::assertSame(ProjectAction::PROJECT_ERRORS['name'], $data['error']);
    }

    public function testCreationFailureIsReportedWithoutLeakingTheCause(): void
    {
        $catalogue = $this->createMock(PartnerProjectCatalogueRepository::class);
        $catalogue->method('findById')->willReturn($this->catalogueRecord());

        $repository = $this->projectRepository();
        $repository->method('create')->willThrowException(
            new \RuntimeException("SQLSTATE[23000]: insert into `project` ...")
        );

        $response = $this->execute($this->action($repository, $catalogue, $this->body()));
        $data = $this->decode($response);

        self::assertFalse($data['status']);
        self::assertSame(ProjectAction::PROJECT_ERRORS['create_failed'], $data['error']);
        self::assertStringNotContainsString('SQLSTATE', (string) $response->getBody());
    }

    public function testNonPartnerCreationNeverTouchesTheCatalogue(): void
    {
        $catalogue = $this->createMock(PartnerProjectCatalogueRepository::class);
        $catalogue->expects(self::never())->method('findById');
        $catalogue->expects(self::never())->method('linkToProject');

        $repository = $this->projectRepository();
        $repository->expects(self::once())->method('create')->willReturn(self::PROJECT_ID);

        $data = $this->decode($this->execute($this->action($repository, $catalogue, [
            'name' => 'Standard Account Project',
            'reference' => 'STD-1',
            'group_id' => 100,
        ])));

        self::assertTrue($data['status']);
    }
}
