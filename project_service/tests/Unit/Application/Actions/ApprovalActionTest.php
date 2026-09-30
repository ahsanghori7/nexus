<?php

declare(strict_types=1);

namespace Tests\Unit\Application\Actions;

use App\Application\Actions\Approval\ApprovalAction;
use App\Domain\Approval\ApprovalRepository;
use PHPUnit\Framework\TestCase;
use Psr\Log\LoggerInterface;
use Slim\Exception\HttpBadRequestException;
use Slim\Psr7\Factory\ResponseFactory;
use Slim\Psr7\Factory\ServerRequestFactory;
use Tests\TestDoubles\FakeCollection;

class ApprovalActionTest extends TestCase
{
    private ResponseFactory $responses;

    protected function setUp(): void
    {
        $this->responses = new ResponseFactory();
    }

    public function testFetchApproversReturnsResults(): void
    {
        $builder = $this->createBuilder(['where', 'with', 'get']);
        $builder->method('where')->willReturnSelf();
        $builder->method('with')->with('status')->willReturnSelf();
        $builder->method('get')->willReturn(new FakeCollection([
            ['id' => 1],
        ]));

        $repository = $this->createMock(ApprovalRepository::class);
        $repository->method('getModel')->with()->willReturn($builder);

        $action = $this->createAction($repository);
        $request = (new ServerRequestFactory())
            ->createServerRequest('GET', '/approvals')
            ->withQueryParams(['entity_type' => 'project', 'entity_id' => 10]);

        $response = $action->fetchApprovers($request, $this->responses->createResponse(), []);

        self::assertSame(200, $response->getStatusCode());
        self::assertStringContainsString('"id": 1', (string) $response->getBody());
    }

    public function testAssignApproversCreatesRecords(): void
    {
        $approvalModel = $this->createBuilder(['create']);
        $created = [];
        $approvalModel->expects(self::exactly(2))->method('create')->willReturnCallback(
            static function (array $data) use (&$created): void {
                $created[] = $data;
            }
        );

        $statusModel = $this->createBuilder(['getLabelId']);
        $statusModel->method('getLabelId')->willReturnMap([
            ['approved', 9],
            ['Approved', 20],
        ]);

        $repository = $this->createMock(ApprovalRepository::class);
        $repository->method('getModel')->willReturnCallback(static function (?string $name = null) use ($approvalModel, $statusModel) {
            return $name === 'approvalStatus' ? $statusModel : $approvalModel;
        });

        $action = new class($this->createMock(LoggerInterface::class), $repository) extends ApprovalAction {
            protected array $payload = [
                'approvers' => [
                    [
                        'user_id' => 7,
                        'approval_level_workflow_id' => 8,
                        'meta' => '{"note":"first level"}',
                    ],
                    [
                        'user_id' => 8,
                        'approval_level_workflow_id' => 9
                    ]
                ],
                'entity_type' => 'project',
                'requester_user_id' => 7,
                'entity_id' => 5,
                'status' => 'approved',
            ];
            public function getData($k = null, $default = null)
            {
                return $this->payload;
            }
        };

        $response = $action->assignApprovers(
            (new ServerRequestFactory())->createServerRequest('POST', '/approvals'),
            $this->responses->createResponse(),
            []
        );

        self::assertSame(203, $response->getStatusCode());
        self::assertSame([
            [
                'user_id' => 7,
                'requester_user_id' => 7,
                'entity_type' => 'project',
                'entity_id' => 5,
                'status_id' => 9,
                'approval_level_workflow_id' => 8,
                'meta' => '{"note":"first level","is_satisfied_by_self_approved":false,"is_satisfied_by_higher_authority":false}',
            ],
            [
                'user_id' => 8,
                'requester_user_id' => 7,
                'entity_type' => 'project',
                'entity_id' => 5,
                'status_id' => 9,
                'approval_level_workflow_id' => 9,
                'meta' => '{"is_satisfied_by_self_approved":false,"is_satisfied_by_higher_authority":false}',
            ],
        ], $created);
    }

    public function testAssignApproversMarksSatisfiedApproverAsApprovedRegardlessOfBatchStatus(): void
    {
        $approvalModel = $this->createBuilder(['create']);
        $created = [];
        $approvalModel->expects(self::exactly(2))->method('create')->willReturnCallback(
            static function (array $data) use (&$created): void {
                $created[] = $data;
            }
        );

        $statusModel = $this->createBuilder(['getLabelId']);
        $statusModel->method('getLabelId')->willReturnMap([
            ['Pending', 4],
            ['Approved', 9],
        ]);

        $repository = $this->createMock(ApprovalRepository::class);
        $repository->method('getModel')->willReturnCallback(static function (?string $name = null) use ($approvalModel, $statusModel) {
            return $name === 'approvalStatus' ? $statusModel : $approvalModel;
        });

        $action = new class($this->createMock(LoggerInterface::class), $repository) extends ApprovalAction {
            protected array $payload = [
                'approvers' => [
                    [
                        'user_id' => 7,
                        'approval_level_workflow_id' => 8,
                        'is_satisfied_by_self_approved' => true,
                    ],
                    [
                        'user_id' => 8,
                        'approval_level_workflow_id' => 9,
                        'is_satisfied_by_higher_authority' => false,
                    ],
                ],
                'entity_type' => 'project',
                'entity_id' => 5,
                'status' => 'Pending',
            ];
            public function getData($k = null, $default = null)
            {
                return $this->payload;
            }
        };

        $action->assignApprovers(
            (new ServerRequestFactory())->createServerRequest('POST', '/approvals'),
            $this->responses->createResponse(),
            []
        );

        self::assertSame(9, $created[0]['status_id']);
        self::assertSame(4, $created[1]['status_id']);
        self::assertSame(
            '{"is_satisfied_by_self_approved":true,"is_satisfied_by_higher_authority":false}',
            $created[0]['meta']
        );
        self::assertSame(
            '{"is_satisfied_by_self_approved":false,"is_satisfied_by_higher_authority":false}',
            $created[1]['meta']
        );
    }

    public function testAssignSLApproversCreatesRecordsAcrossSubcontractorsAndSkipsInvalidRows(): void
    {
        $approvalModel = $this->createBuilder(['create']);
        $created = [];
        $approvalModel->expects(self::exactly(2))->method('create')->willReturnCallback(
            static function (array $data) use (&$created): void {
                $created[] = $data;
            }
        );

        $statusModel = $this->createBuilder(['getLabelId']);
        $statusModel->method('getLabelId')->willReturnMap([
            ['pending', 4],
            ['Approved', 9],
        ]);

        $repository = $this->createMock(ApprovalRepository::class);
        $repository->method('getModel')->willReturnCallback(static function (?string $name = null) use ($approvalModel, $statusModel) {
            return $name === 'approvalStatus' ? $statusModel : $approvalModel;
        });

        $action = new class($this->createMock(LoggerInterface::class), $repository) extends ApprovalAction {
            protected array $payload = [
                [
                    'entity_type' => 'shortlisted_subcontractor',
                    'entity_id' => 101,
                    'status' => 'pending',
                    'approvers' => [
                        [
                            'user_id' => 11,
                            'approval_level_workflow_id' => 21,
                            'meta' => '{"note":"sub 101"}',
                        ],
                        // invalid row: missing user_id, must be skipped
                        [
                            'approval_level_workflow_id' => 22,
                        ],
                    ],
                ],
                [
                    'entity_type' => 'shortlisted_subcontractor',
                    'entity_id' => 102,
                    'status' => 'pending',
                    'approvers' => [
                        [
                            'user_id' => 12,
                            'approval_level_workflow_id' => 23,
                        ],
                    ],
                ],
                // no approvers at all: skipped entirely
                [
                    'entity_type' => 'shortlisted_subcontractor',
                    'entity_id' => 103,
                    'status' => 'pending',
                    'approvers' => [],
                ],
            ];
            public function getData($k = null, $default = null)
            {
                return $this->payload;
            }
        };

        $response = $action->assignSLApprovers(
            (new ServerRequestFactory())->createServerRequest('POST', '/approvals/sl'),
            $this->responses->createResponse(),
            []
        );

        self::assertSame(203, $response->getStatusCode());
        self::assertSame([
            [
                'user_id' => 11,
                'entity_type' => 'shortlisted_subcontractor',
                'entity_id' => 101,
                'status_id' => 4,
                'approval_level_workflow_id' => 21,
                'meta' => '{"note":"sub 101","is_satisfied_by_self_approved":false,"is_satisfied_by_higher_authority":false}',
            ],
            [
                'user_id' => 12,
                'entity_type' => 'shortlisted_subcontractor',
                'entity_id' => 102,
                'status_id' => 4,
                'approval_level_workflow_id' => 23,
                'meta' => '{"is_satisfied_by_self_approved":false,"is_satisfied_by_higher_authority":false}',
            ],
        ], $created);
    }

    public function testAssignSLApproversAcceptsSingleEntityPayload(): void
    {
        $approvalModel = $this->createBuilder(['create']);
        $approvalModel->expects(self::once())->method('create')->with([
            'user_id' => 5,
            'entity_type' => 'shortlisted_subcontractor',
            'entity_id' => 200,
            'status_id' => 4,
            'approval_level_workflow_id' => 30,
            'meta' => '{"is_satisfied_by_self_approved":false,"is_satisfied_by_higher_authority":false}',
        ]);

        $statusModel = $this->createBuilder(['getLabelId']);
        $statusModel->method('getLabelId')->willReturnMap([
            ['pending', 4],
            ['Approved', 9],
        ]);

        $repository = $this->createMock(ApprovalRepository::class);
        $repository->method('getModel')->willReturnCallback(static function (?string $name = null) use ($approvalModel, $statusModel) {
            return $name === 'approvalStatus' ? $statusModel : $approvalModel;
        });

        $action = new class($this->createMock(LoggerInterface::class), $repository) extends ApprovalAction {
            protected array $payload = [
                'entity_type' => 'shortlisted_subcontractor',
                'entity_id' => 200,
                'status' => 'pending',
                'approvers' => [
                    ['user_id' => 5, 'approval_level_workflow_id' => 30],
                ],
            ];
            public function getData($k = null, $default = null)
            {
                return $this->payload;
            }
        };

        $response = $action->assignSLApprovers(
            (new ServerRequestFactory())->createServerRequest('POST', '/approvals/sl'),
            $this->responses->createResponse(),
            []
        );

        self::assertSame(203, $response->getStatusCode());
    }

    public function testAssignSLApproversMarksSatisfiedApproverAsApproved(): void
    {
        $approvalModel = $this->createBuilder(['create']);
        $created = [];
        $approvalModel->expects(self::exactly(2))->method('create')->willReturnCallback(
            static function (array $data) use (&$created): void {
                $created[] = $data;
            }
        );

        $statusModel = $this->createBuilder(['getLabelId']);
        $statusModel->method('getLabelId')->willReturnMap([
            ['pending', 4],
            ['Approved', 9],
        ]);

        $repository = $this->createMock(ApprovalRepository::class);
        $repository->method('getModel')->willReturnCallback(static function (?string $name = null) use ($approvalModel, $statusModel) {
            return $name === 'approvalStatus' ? $statusModel : $approvalModel;
        });

        $action = new class($this->createMock(LoggerInterface::class), $repository) extends ApprovalAction {
            protected array $payload = [
                'entity_type' => 'shortlisted_subcontractor',
                'entity_id' => 200,
                'status' => 'pending',
                'approvers' => [
                    ['user_id' => 5, 'approval_level_workflow_id' => 30, 'is_satisfied_by_self_approved' => true],
                    ['user_id' => 6, 'approval_level_workflow_id' => 31, 'is_satisfied_by_higher_authority' => true],
                ],
            ];
            public function getData($k = null, $default = null)
            {
                return $this->payload;
            }
        };

        $action->assignSLApprovers(
            (new ServerRequestFactory())->createServerRequest('POST', '/approvals/sl'),
            $this->responses->createResponse(),
            []
        );

        self::assertSame(9, $created[0]['status_id']);
        self::assertSame(9, $created[1]['status_id']);
        self::assertSame(
            '{"is_satisfied_by_self_approved":true,"is_satisfied_by_higher_authority":false}',
            $created[0]['meta']
        );
        self::assertSame(
            '{"is_satisfied_by_self_approved":false,"is_satisfied_by_higher_authority":true}',
            $created[1]['meta']
        );
    }

    public function testAssignSLApproversDerivesSatisfiedMetaFromLevelFlags(): void
    {
        $approvalModel = $this->createBuilder(['create']);
        $created = [];
        $approvalModel->expects(self::exactly(2))->method('create')->willReturnCallback(
            static function (array $data) use (&$created): void {
                $created[] = $data;
            }
        );

        $statusModel = $this->createBuilder(['getLabelId']);
        $statusModel->method('getLabelId')->willReturnMap([
            ['pending', 4],
            ['Approved', 9],
        ]);

        $repository = $this->createMock(ApprovalRepository::class);
        $repository->method('getModel')->willReturnCallback(static function (?string $name = null) use ($approvalModel, $statusModel) {
            return $name === 'approvalStatus' ? $statusModel : $approvalModel;
        });

        $action = new class($this->createMock(LoggerInterface::class), $repository) extends ApprovalAction {
            protected array $payload = [
                'entity_type' => 'shortlisted_subcontractor',
                'entity_id' => 200,
                'status' => 'pending',
                'approvers' => [
                    [
                        'user_id' => 5,
                        'approval_level_workflow_id' => 30,
                        'is_satisfied_by_self_approved' => false,
                        'is_level_satisfied_by_self_approved' => true,
                    ],
                    [
                        'user_id' => 6,
                        'approval_level_workflow_id' => 31,
                        'is_satisfied_by_higher_authority' => false,
                        'is_level_satisfied_by_higher_authority' => true,
                    ],
                ],
            ];
            public function getData($k = null, $default = null)
            {
                return $this->payload;
            }
        };

        $action->assignSLApprovers(
            (new ServerRequestFactory())->createServerRequest('POST', '/approvals/sl'),
            $this->responses->createResponse(),
            []
        );

        self::assertSame(9, $created[0]['status_id']);
        self::assertSame(9, $created[1]['status_id']);
        self::assertSame(
            '{"is_satisfied_by_self_approved":true,"is_satisfied_by_higher_authority":false}',
            $created[0]['meta']
        );
        self::assertSame(
            '{"is_satisfied_by_self_approved":false,"is_satisfied_by_higher_authority":true}',
            $created[1]['meta']
        );
    }

    public function testUpdateByIdThrowsWhenRecordMissing(): void
    {
        $model = $this->createBuilder(['load', 'isLoaded', 'store']);
        $model->method('load')->willReturnSelf();
        $model->method('isLoaded')->willReturn(false);

        $statusModel = $this->createBuilder(['getLabelId']);
        $statusModel->method('getLabelId')->with('pending')->willReturn(4);

        $repository = $this->createMock(ApprovalRepository::class);
        $repository->method('getModel')->willReturnCallback(static function (?string $name = null) use ($model, $statusModel) {
            return $name === 'approvalStatus' ? $statusModel : $model;
        });

        $action = new class($this->createMock(LoggerInterface::class), $repository) extends ApprovalAction {
            protected array $payload = ['status' => 'pending', 'comment' => 'needs work', 'user_id' => 1];
            public function getData($k = null, $default = null)
            {
                return $this->payload;
            }
        };

        $this->expectException(HttpBadRequestException::class);
        $action->updateById(
            (new ServerRequestFactory())->createServerRequest('PATCH', '/approvals/1'),
            $this->responses->createResponse(),
            ['id' => 1]
        );
    }

    public function testUpdateByIdStoresWhenRecordExists(): void
    {
        $model = $this->createBuilder(['load', 'isLoaded', 'store']);
        $model->method('load')->willReturnSelf();
        $model->method('isLoaded')->willReturn(true);
        $model->expects(self::once())->method('store')->with([
            'status_id' => 2,
            'comment' => 'approved',
            'user_id' => 1,
        ])->willReturn(true);

        $statusModel = $this->createBuilder(['getLabelId']);
        $statusModel->method('getLabelId')->with('approved')->willReturn(2);

        $repository = $this->createMock(ApprovalRepository::class);
        $repository->method('getModel')->willReturnCallback(static function (?string $name = null) use ($model, $statusModel) {
            return $name === 'approvalStatus' ? $statusModel : $model;
        });

        $action = new class($this->createMock(LoggerInterface::class), $repository) extends ApprovalAction {
            protected array $payload = ['status' => 'approved', 'comment' => 'approved', 'user_id' => 1];
            public function getData($k = null, $default = null)
            {
                return $this->payload;
            }
        };

        $response = $action->updateById(
            (new ServerRequestFactory())->createServerRequest('PATCH', '/approvals/2'),
            $this->responses->createResponse(),
            ['id' => 2]
        );

        self::assertSame(203, $response->getStatusCode());
    }

    public function testAssignSLApproversSingleEntityWrapsAndInsertsRecord(): void
    {
        $approvalModel = $this->createBuilder(['create']);
        $created = [];
        $approvalModel->expects(self::once())->method('create')->willReturnCallback(
            static function (array $data) use (&$created): void {
                $created[] = $data;
            }
        );

        $statusModel = $this->createBuilder(['getLabelId']);
        $statusModel->method('getLabelId')->willReturnMap([
            ['pending', 3],
            ['Approved', 20],
        ]);

        $repository = $this->createMock(ApprovalRepository::class);
        $repository->method('getModel')->willReturnCallback(static function (?string $name = null) use ($approvalModel, $statusModel) {
            return $name === 'approvalStatus' ? $statusModel : $approvalModel;
        });

        $action = new class($this->createMock(LoggerInterface::class), $repository) extends ApprovalAction {
            protected array $payload = [
                'entity_id'   => 5,
                'entity_type' => 'project',
                'status'      => 'pending',
                'approvers'   => [['user_id' => 1, 'approval_level_workflow_id' => 10]],
            ];
            public function getData($k = null, $default = null) { return $this->payload; }
        };

        $response = $action->assignSLApprovers(
            (new ServerRequestFactory())->createServerRequest('POST', '/approvals/sl'),
            $this->responses->createResponse(),
            []
        );

        self::assertSame(203, $response->getStatusCode());
        self::assertSame([
            [
                'user_id' => 1,
                'entity_type' => 'project',
                'entity_id' => 5,
                'status_id' => 3,
                'approval_level_workflow_id' => 10,
                'meta' => '{"is_satisfied_by_self_approved":false,"is_satisfied_by_higher_authority":false}',
            ],
        ], $created);
    }

    public function testAssignSLApproversMultipleEntitiesInsertsBoth(): void
    {
        $approvalModel = $this->createBuilder(['create']);
        $created = [];
        $approvalModel->expects(self::exactly(2))->method('create')->willReturnCallback(
            static function (array $data) use (&$created): void {
                $created[] = $data;
            }
        );

        $statusModel = $this->createBuilder(['getLabelId']);
        $statusModel->method('getLabelId')->willReturnMap([
            ['pending', 3],
            ['approved', 5],
            ['Approved', 20],
        ]);

        $repository = $this->createMock(ApprovalRepository::class);
        $repository->method('getModel')->willReturnCallback(static function (?string $name = null) use ($approvalModel, $statusModel) {
            return $name === 'approvalStatus' ? $statusModel : $approvalModel;
        });

        $action = new class($this->createMock(LoggerInterface::class), $repository) extends ApprovalAction {
            protected array $payload = [
                ['entity_id' => 5, 'entity_type' => 'project', 'status' => 'pending',  'approvers' => [['user_id' => 1, 'approval_level_workflow_id' => 10]]],
                ['entity_id' => 6, 'entity_type' => 'project', 'status' => 'approved', 'approvers' => [['user_id' => 2, 'approval_level_workflow_id' => 11]]],
            ];
            public function getData($k = null, $default = null) { return $this->payload; }
        };

        $response = $action->assignSLApprovers(
            (new ServerRequestFactory())->createServerRequest('POST', '/approvals/sl'),
            $this->responses->createResponse(),
            []
        );

        self::assertSame(203, $response->getStatusCode());
        self::assertCount(2, $created);
        self::assertSame(1, $created[0]['user_id']);
        self::assertSame(2, $created[1]['user_id']);
    }

    public function testAssignSLApproversSkipsInvalidRows(): void
    {
        $approvalModel = $this->createBuilder(['create']);
        $created = [];
        $approvalModel->expects(self::once())->method('create')->willReturnCallback(
            static function (array $data) use (&$created): void {
                $created[] = $data;
            }
        );

        $statusModel = $this->createBuilder(['getLabelId']);
        $statusModel->method('getLabelId')->willReturn(3);

        $repository = $this->createMock(ApprovalRepository::class);
        $repository->method('getModel')->willReturnCallback(static function (?string $name = null) use ($approvalModel, $statusModel) {
            return $name === 'approvalStatus' ? $statusModel : $approvalModel;
        });

        $action = new class($this->createMock(LoggerInterface::class), $repository) extends ApprovalAction {
            protected array $payload = [
                'entity_id'   => 5,
                'entity_type' => 'project',
                'status'      => 'pending',
                'approvers'   => [
                    'not_an_array',
                    ['no_user_id' => true],
                    ['user_id' => 3, 'approval_level_workflow_id' => 12],
                ],
            ];
            public function getData($k = null, $default = null) { return $this->payload; }
        };

        $response = $action->assignSLApprovers(
            (new ServerRequestFactory())->createServerRequest('POST', '/approvals/sl'),
            $this->responses->createResponse(),
            []
        );

        self::assertSame(203, $response->getStatusCode());
        self::assertCount(1, $created);
        self::assertSame(3, $created[0]['user_id']);
    }

    public function testDeleteByIdThrowsWhenNotFound(): void
    {
        $model = $this->createBuilder(['load', 'isLoaded']);
        $model->method('load')->willReturnSelf();
        $model->method('isLoaded')->willReturn(false);

        $repository = $this->createMock(ApprovalRepository::class);
        $repository->method('getModel')->willReturn($model);

        $this->expectException(HttpBadRequestException::class);
        $this->createAction($repository)->deleteById(
            (new ServerRequestFactory())->createServerRequest('DELETE', '/approvals/1'),
            $this->responses->createResponse(),
            ['id' => 1]
        );
    }

    public function testDeleteByIdRemovesRecordWhenEntityIdIsZero(): void
    {
        $model = $this->createBuilder(['load', 'isLoaded', 'getData', 'deleteById']);
        $model->method('load')->willReturnSelf();
        $model->method('isLoaded')->willReturn(true);
        $model->method('getData')->with(null)->willReturn(['entity_type' => 'project']);
        $model->expects(self::once())->method('deleteById')->with(42);

        $repository = $this->createMock(ApprovalRepository::class);
        $repository->method('getModel')->willReturn($model);

        $response = $this->createAction($repository)->deleteById(
            (new ServerRequestFactory())->createServerRequest('DELETE', '/approvals/42'),
            $this->responses->createResponse(),
            ['id' => 42]
        );

        self::assertSame(203, $response->getStatusCode());
    }

    public function testDeleteBulkByEntityDeletesWhenApprovalsExist(): void
    {
        $builder = $this->createBuilder(['where', 'exists', 'delete']);
        $builder->method('where')->willReturnSelf();
        $builder->method('exists')->willReturn(true);
        $builder->expects(self::once())->method('delete');

        $repository = $this->createMock(ApprovalRepository::class);
        $repository->method('getModel')->willReturn($builder);

        $response = $this->createAction($repository)->deleteBulkByEntity(
            (new ServerRequestFactory())->createServerRequest('DELETE', '/approvals/entity/project/5'),
            $this->responses->createResponse(),
            ['entity_type' => 'project', 'entity_id' => '5']
        );

        self::assertSame(203, $response->getStatusCode());
    }

    public function testDeleteBulkByEntitySkipsDeleteWhenNoneExist(): void
    {
        $builder = $this->createBuilder(['where', 'exists', 'delete']);
        $builder->method('where')->willReturnSelf();
        $builder->method('exists')->willReturn(false);
        $builder->expects(self::never())->method('delete');

        $repository = $this->createMock(ApprovalRepository::class);
        $repository->method('getModel')->willReturn($builder);

        $response = $this->createAction($repository)->deleteBulkByEntity(
            (new ServerRequestFactory())->createServerRequest('DELETE', '/approvals/entity/project/99'),
            $this->responses->createResponse(),
            ['entity_type' => 'project', 'entity_id' => '99']
        );

        self::assertSame(203, $response->getStatusCode());
    }

    private function createAction(ApprovalRepository $repository): ApprovalAction
    {
        return new ApprovalAction($this->createMock(LoggerInterface::class), $repository);
    }

    private function createBuilder(array $methods)
    {
        return $this->getMockBuilder(\stdClass::class)->addMethods($methods)->getMock();
    }
}
