<?php

declare(strict_types=1);

namespace Tests\Unit\Domain\Project;

use App\Domain\AbstractModel;
use App\Domain\Project\Manage;
use App\Domain\Project\ProjectRepository;
use PHPUnit\Framework\MockObject\MockObject;
use PHPUnit\Framework\TestCase;

class ManageTest extends TestCase
{
    public static function setUpBeforeClass(): void
    {
        if (!\defined('CLI_ROOT')) {
            \define('CLI_ROOT', \dirname(__DIR__, 3));
        }

        if (!is_dir(CLI_ROOT . '/fixtures')) {
            mkdir(CLI_ROOT . '/fixtures', 0777, true);
        }
    }

    protected function tearDown(): void
    {
        Manage::setRepositoryFactory(null);
    }

    public function testGetProjectStatusIdReturnsMatchingId(): void
    {
        $repo = $this->mockRepository();
        $repo->expects(self::once())
            ->method('constants')
            ->willReturn(['project' => ['status' => [9 => 'publish']]]);

        self::assertSame(9, Manage::getProjectStatusId('publish'));
    }

    public function testGetProjectStatusIdFallsBackToDefault(): void
    {
        $repo = $this->mockRepository();
        $repo->expects(self::once())
            ->method('constants')
            ->willReturn(['project' => ['status' => [1 => 'draft']]]);

        self::assertSame(Manage::DEFAULT_PROJECT_STATUS, Manage::getProjectStatusId('missing'));
    }

    public function testCreateProjectAssignsDefaultsAndMappings(): void
    {
        $repo = $this->mockRepository();
        $repo->method('constants')->willReturn(['project' => ['status' => [7 => 'publish']]]);
        $repo->expects(self::once())
            ->method('create')
            ->with(self::callback(function (array $payload): bool {
                self::assertSame(Manage::DEFAULT_PROJECT_TYPE, $payload['type']);
                self::assertSame(Manage::DEFAULT_PROJECT_REGION, $payload['region']);
                self::assertSame('2024-02-01', $payload['start']);
                self::assertSame('2024-03-05', $payload['end']);
                self::assertSame('2023-12-01 08:00:00', $payload['created_at']);
                self::assertSame('Example project', $payload['name']);
                self::assertSame('example-project', $payload['slug']);
                self::assertSame('content', $payload['description']);
                self::assertSame('REF-10', $payload['reference']);
                self::assertSame(99, $payload['group_id']);
                self::assertSame(7, $payload['status']);
                return true;
            }));

        $mappingCalls = [];
        $repo->expects(self::exactly(3))
            ->method('createProjectMapping')
            ->willReturnCallback(function (array $payload) use (&$mappingCalls): AbstractModel {
                $mappingCalls[] = $payload;
                return $this->fakeModel();
            });

        $values = [
            'post_title' => 'Example project',
            'post_name' => 'example-project',
            'owner' => 99,
            'post_author' => 7,
            'post_content' => 'content',
            'post_date' => '2023-12-01 08:00:00',
            'post_status' => 'publish',
            'meta' => [
                'post_reference' => 'REF-10',
                'post_start_date' => '01-02-2024',
                'post_completion_date' => '05-03-2024',
            ],
            'co-author' => [
                55 => ['name' => 'Co 1'],
                77 => ['name' => 'Co 2'],
            ],
        ];

        Manage::createProject(10, $values);
        self::assertSame([
            ['project_id' => 10, 'owner_id' => 7],
            ['project_id' => 10, 'owner_id' => 55, 'type' => 'Co-author'],
            ['project_id' => 10, 'owner_id' => 77, 'type' => 'Co-author'],
        ], $mappingCalls);
    }

    public function testUpdateProjectMetaNormalizesInsuranceValues(): void
    {
        $builder = $this->getMockBuilder(\stdClass::class)
            ->addMethods(['where', 'exists', 'update'])
            ->getMock();
        $builder->expects(self::once())->method('where')->with('id', 5)->willReturnSelf();
        $builder->method('exists')->willReturn(true);
        $builder->expects(self::once())->method('update')->with([
            'site_address_one' => 'HQ',
            'site_address_postcode' => 'AB12',
            'employer_liabilty_insurance' => Manage::$insurances_values['£10 Million'],
            'public_product_insurance' => Manage::INSURANCES_OTHER_KEY,
        ]);

        $repo = $this->createMock(ProjectRepository::class);
        $repo->method('getModel')->willReturn($builder);

        Manage::updateProjectMeta($repo, 5, [
            'post_site_location' => 'HQ',
            'post_postcode' => 'AB12',
            'post_insurance_employer' => '£10 Million',
            'post_insurance_public' => 'Random',
        ]);
    }

    public function testUpdateProjectMetaSkipsWhenNoKnownKeys(): void
    {
        $repo = $this->createMock(ProjectRepository::class);
        $repo->expects(self::never())->method('getModel');

        Manage::updateProjectMeta($repo, 1, ['unknown' => 'value']);
    }

    public function testAddEnquiryHistoryUsesExternalCompanyIdWhenMissing(): void
    {
        $repo = $this->mockRepository();
        $repo->expects(self::once())
            ->method('addTenderHistory')
            ->with([
                'tender_id' => 3,
                'status_id' => 1,
                'tender_history_type' => 'Enquiry',
                'author_id' => 4,
                'specialist_id' => 88,
                'created_at' => '2024-01-10 12:00:00',
                'meta' => [
                    'info' => 'Question',
                    'document' => 'doc.pdf',
                ],
            ]);

        Manage::addEnquiryHistory(3, [[
            'company_user_id' => null,
            'company_user_id_extern' => 88,
            'enquiry_sent_by' => 4,
            'enquiry_sent_date' => '2024-01-10 12:00:00',
            'info' => 'Question',
            'document' => 'doc.pdf',
        ]]);
    }

    public function testAddInterestHistoryAddsAcceptedEntry(): void
    {
        $repo = $this->mockRepository();
        $historyCalls = [];
        $repo->expects(self::exactly(2))
            ->method('addTenderHistory')
            ->willReturnCallback(function (array $payload) use (&$historyCalls): AbstractModel {
                $historyCalls[] = $payload;
                return $this->fakeModel();
            });

        Manage::addInterestHistory(9, [[
            'interest_sent_by' => 12,
            'interest_sent_date' => '2024-02-01 10:00:00',
            'interest_schedule' => true,
            'author_id' => 20,
        ]]);

        self::assertSame([
            [
                'tender_id' => 9,
                'status_id' => 1,
                'tender_history_type' => 'Interest',
                'author_id' => null,
                'specialist_id' => 12,
                'created_at' => '2024-02-01 10:00:00',
                'meta' => [
                    'interest_sent_by' => 12,
                    'interest_sent_date' => '2024-02-01 10:00:00',
                    'interest_schedule' => true,
                    'author_id' => 20,
                ],
            ],
            [
                'tender_id' => 9,
                'status_id' => 4,
                'tender_history_type' => 'Interest',
                'author_id' => 20,
                'specialist_id' => 12,
                'created_at' => '2024-02-01 11:00:00',
                'meta' => [],
            ],
        ], $historyCalls);
    }

    private function fakeModel(): AbstractModel
    {
        return $this->getMockBuilder(AbstractModel::class)->disableOriginalConstructor()->getMock();
    }

    public function testGetJsonReadsFromFixturesDirectory(): void
    {
        $path = CLI_ROOT . '/fixtures/sample.json';
        if (!file_exists($path)) {
            file_put_contents($path, json_encode(['foo' => 'bar']));
        }

        self::assertSame(['foo' => 'bar'], Manage::getJson('sample'));
    }

    /**
     * @return ProjectRepository&MockObject
     */
    private function mockRepository(): ProjectRepository
    {
        $repo = $this->createMock(ProjectRepository::class);
        Manage::setRepositoryFactory(static fn () => $repo);

        return $repo;
    }
}
