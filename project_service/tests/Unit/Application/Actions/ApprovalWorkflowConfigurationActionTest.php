<?php

declare(strict_types=1);

namespace Tests\Unit\Application\Actions;

use App\Application\Actions\Approval\ApprovalWorkflowConfigurationAction;
use App\Domain\Approval\ApprovalWorkflowConfigurationRepository;
use PHPUnit\Framework\TestCase;
use Psr\Log\LoggerInterface;
use Slim\Psr7\Factory\ResponseFactory;
use Slim\Psr7\Factory\ServerRequestFactory;

class ApprovalWorkflowConfigurationActionTest extends TestCase
{
    private ResponseFactory $responses;

    protected function setUp(): void
    {
        $this->responses = new ResponseFactory();
    }

    public function testFetchApprovalTypeReturnsResults(): void
    {
        $approvalTypeModel = $this->createBuilder(['where', 'get']);
        $approvalTypeModel->method('where')->willReturnSelf();
        $approvalTypeModel->method('get')->willReturn(new class {
            public function toArray(): array
            {
                return [['id' => 1, 'type' => 'order', 'default_label' => 'Order Approval']];
            }
        });

        $repository = $this->createMock(ApprovalWorkflowConfigurationRepository::class);
        $repository->method('getModel')->willReturnCallback(static function (?string $name = null) use ($approvalTypeModel) {
            return $approvalTypeModel;
        });

        $action = $this->createAction($repository);
        $response = $action->fetchApprovalType(
            (new ServerRequestFactory())->createServerRequest('GET', '/approval-types/order'),
            $this->responses->createResponse(),
            ['approval_type' => 'order']
        );

        self::assertSame(200, $response->getStatusCode());
        self::assertSame([['id' => 1, 'type' => 'order', 'default_label' => 'Order Approval']], json_decode((string) $response->getBody(), true)['data']);
    }

    public function testListApprovalTypesReturnsResults(): void
    {
        $approvalTypeModel = $this->createBuilder(['get']);
        $approvalTypeModel->method('get')->willReturn(new class {
            public function toArray(): array
            {
                return [['id' => 1, 'type' => 'order', 'default_label' => 'Order Approval'], ['id' => 2, 'type' => 'tender_recommendation', 'default_label' => 'Tender Recommendation Approval']];
            }
        });

        $repository = $this->createMock(ApprovalWorkflowConfigurationRepository::class);
        $repository->method('getModel')->with('approvalType')->willReturn($approvalTypeModel);

        $action = $this->createAction($repository);
        $response = $action->listApprovalTypes(
            (new ServerRequestFactory())->createServerRequest('GET', '/approval-types'),
            $this->responses->createResponse(),
            []
        );

        self::assertSame(200, $response->getStatusCode());
        self::assertSame(2, count(json_decode((string) $response->getBody(), true)['data']));
    }

    public function testCreateApprovalWorkflowReturnsNoContent(): void
    {
        $approvalTypeModel = $this->createBuilder(['where', 'first']);
        $approvalTypeModel->method('where')->willReturnSelf();
        $approvalTypeModel->method('first')->willReturn(new class {
            public function getAttributes(): array
            {
                return ['id' => 55];
            }
        });

        $approvalConfigurationModel = $this->createBuilder(['where', 'first', 'create']);
        $approvalConfigurationModel->method('where')->willReturnSelf();
        $approvalConfigurationModel->method('first')->willReturn(null);
        $approvalConfigurationModel->expects(self::once())->method('create')->with([
            'allow_requester_self_approval' => false,
            'consolidate_duplicate_approver_notifications' => false,
            'auto_complete_lower_approvals' => false,
            'account_id' => 99,
            'approval_type_id' => 55,
        ])->willReturn((object) ['id' => 500]);

        $approvalLevelModel = $this->createBuilder(['create']);
        $created = [];
        $approvalLevelModel->expects(self::once())->method('create')->willReturnCallback(static function (array $data) use (&$created) {
            $created[] = $data;
            return (object) ['id' => 15];
        });

        $roleMappingModel = $this->createBuilder(['where', 'delete', 'create']);
        $roleMappingModel->method('where')->willReturnSelf();
        $roleMappingModel->method('delete')->willReturn(true);
        $mappings = [];
        $roleMappingModel->expects(self::exactly(2))->method('create')->willReturnCallback(static function (array $data) use (&$mappings) {
            $mappings[] = $data;
            return true;
        });

        $repository = $this->createMock(ApprovalWorkflowConfigurationRepository::class);
        $repository->method('getModel')->willReturnCallback(static function (?string $name = null) use (
            $approvalTypeModel,
            $approvalConfigurationModel,
            $approvalLevelModel,
            $roleMappingModel
        ) {
            $models = [
                'approvalType' => $approvalTypeModel,
                'approvalConfiguration' => $approvalConfigurationModel,
                'approvalLevelAccountRoleMapping' => $roleMappingModel,
            ];
            return $models[$name] ?? $approvalLevelModel;
        });

        $action = new class($this->createMock(LoggerInterface::class), $repository) extends ApprovalWorkflowConfigurationAction {
            protected array $payload = [
                'levels' => [
                    [
                        'roles' => [7, 8],
                        'conditions' => [],
                        'is_threshold' => 0,
                        'sort_order' => 1,
                        'rule_type' => 'any',
                    ],
                ],
            ];

            public function getData($k = null, $default = null)
            {
                return $this->payload;
            }
        };

        $response = $action->createApprovalWorkflow(
            (new ServerRequestFactory())->createServerRequest('POST', '/approval-configurations/type/purchase-order'),
            $this->responses->createResponse(),
            ['approval_type' => 'purchase-order', 'aid' => 99, 'type' => 'purchase-order']
        );

        self::assertSame(203, $response->getStatusCode());
        self::assertSame([
            [
                'approval_config_id' => 500,
                'is_threshold' => 0,
                'sort_order' => 1,
                'rule_type' => 'any',
                'min_required' => null,
            ],
        ], $created);
        self::assertSame([
            ['approval_level_id' => 15, 'account_role_id' => 7],
            ['approval_level_id' => 15, 'account_role_id' => 8],
        ], $mappings);
    }

    public function testCreateApprovalWorkflowUpdatesExistingApprovalLevel(): void
    {
        $approvalTypeModel = $this->createBuilder(['where', 'first']);
        $approvalTypeModel->method('where')->willReturnSelf();
        $approvalTypeModel->method('first')->willReturn(new class {
            public function getAttributes(): array
            {
                return ['id' => 55];
            }
        });

        $existingConfiguration = $this->createBuilder(['store']);
        $existingConfiguration->id = 500;
        $existingConfiguration->expects(self::once())->method('store')->with([
            'allow_requester_self_approval' => true,
            'consolidate_duplicate_approver_notifications' => false,
            'auto_complete_lower_approvals' => true,
        ]);

        $approvalConfigurationModel = $this->createBuilder(['where', 'first']);
        $approvalConfigurationModel->method('where')->willReturnSelf();
        $approvalConfigurationModel->method('first')->willReturn($existingConfiguration);

        $approvalLevelModel = $this->createBuilder(['load', 'isLoaded', 'store']);
        $approvalLevelModel->method('load')->willReturnSelf();
        $approvalLevelModel->method('isLoaded')->willReturn(true);
        $approvalLevelModel->expects(self::once())->method('store')->with([
            'approval_config_id' => 500,
            'is_threshold' => 0,
            'sort_order' => 1,
            'rule_type' => 'any',
            'min_required' => null,
        ]);

        $roleMappingModel = $this->createBuilder(['where', 'delete', 'create']);
        $roleMappingModel->method('where')->willReturnSelf();
        $roleMappingModel->method('delete')->willReturn(true);
        $createdMappings = [];
        $roleMappingModel->expects(self::exactly(2))->method('create')->willReturnCallback(static function (array $data) use (&$createdMappings) {
            $createdMappings[] = $data;
            return true;
        });

        $repository = $this->createMock(ApprovalWorkflowConfigurationRepository::class);
        $repository->method('getModel')->willReturnCallback(static function (?string $name = null) use (
            $approvalTypeModel,
            $approvalConfigurationModel,
            $approvalLevelModel,
            $roleMappingModel
        ) {
            $models = [
                'approvalType' => $approvalTypeModel,
                'approvalConfiguration' => $approvalConfigurationModel,
                'approvalLevelAccountRoleMapping' => $roleMappingModel,
            ];
            return $models[$name] ?? $approvalLevelModel;
        });

        $action = new class($this->createMock(LoggerInterface::class), $repository) extends ApprovalWorkflowConfigurationAction {
            protected array $payload = [
                'allow_requester_self_approval' => true,
                'consolidate_notifications' => false,
                'auto_complete_lower_approvals' => true,
                'levels' => [
                    [
                        'id' => 15,
                        'roles' => [7, 8],
                        'conditions' => [],
                        'is_threshold' => 0,
                        'sort_order' => 1,
                        'rule_type' => 'any',
                    ],
                ],
            ];

            public function getData($k = null, $default = null)
            {
                return $this->payload;
            }
        };

        $response = $action->createApprovalWorkflow(
            (new ServerRequestFactory())->createServerRequest('POST', '/approval-configurations/type/purchase-order'),
            $this->responses->createResponse(),
            ['approval_type' => 'purchase-order', 'aid' => 99, 'type' => 'purchase-order']
        );

        self::assertSame(203, $response->getStatusCode());
        self::assertSame([
            ['approval_level_id' => 15, 'account_role_id' => 7],
            ['approval_level_id' => 15, 'account_role_id' => 8],
        ], $createdMappings);
    }

    public function testCreateApprovalWorkflowDeletesApprovalLevelWhenMarkedDeleted(): void
    {
        $approvalTypeModel = $this->createBuilder(['where', 'first']);
        $approvalTypeModel->method('where')->willReturnSelf();
        $approvalTypeModel->method('first')->willReturn(new class {
            public function getAttributes(): array
            {
                return ['id' => 55];
            }
        });

        $existingConfiguration = $this->createBuilder(['store']);
        $existingConfiguration->id = 500;
        $existingConfiguration->method('store')->willReturnSelf();

        $approvalConfigurationModel = $this->createBuilder(['where', 'first']);
        $approvalConfigurationModel->method('where')->willReturnSelf();
        $approvalConfigurationModel->method('first')->willReturn($existingConfiguration);

        $approvalLevelModel = $this->createBuilder(['deleteById']);
        $approvalLevelModel->expects(self::once())->method('deleteById')->with(15)->willReturn(true);

        $roleMappingModel = $this->createBuilder(['where', 'delete', 'create']);
        $roleMappingModel->method('where')->willReturnSelf();
        $roleMappingModel->method('delete')->willReturn(true);
        $roleMappingModel->expects(self::never())->method('create');

        $repository = $this->createMock(ApprovalWorkflowConfigurationRepository::class);
        $repository->method('getModel')->willReturnCallback(static function (?string $name = null) use (
            $approvalTypeModel,
            $approvalConfigurationModel,
            $approvalLevelModel,
            $roleMappingModel
        ) {
            $models = [
                'approvalType' => $approvalTypeModel,
                'approvalConfiguration' => $approvalConfigurationModel,
                'approvalLevelAccountRoleMapping' => $roleMappingModel,
            ];
            return $models[$name] ?? $approvalLevelModel;
        });

        $action = new class($this->createMock(LoggerInterface::class), $repository) extends ApprovalWorkflowConfigurationAction {
            protected array $payload = [
                'levels' => [
                    ['id' => 15, 'is_deleted' => true, 'roles' => [7, 8], 'conditions' => []],
                ],
            ];

            public function getData($k = null, $default = null)
            {
                return $this->payload;
            }
        };

        $response = $action->createApprovalWorkflow(
            (new ServerRequestFactory())->createServerRequest('POST', '/approval-configurations/type/purchase-order'),
            $this->responses->createResponse(),
            ['approval_type' => 'purchase-order', 'aid' => 99, 'type' => 'purchase-order']
        );

        self::assertSame(203, $response->getStatusCode());
    }

    public function testCreateApprovalWorkflowReturnsBadRequestWhenExistingApprovalLevelMissing(): void
    {
        $approvalTypeModel = $this->createBuilder(['where', 'first']);
        $approvalTypeModel->method('where')->willReturnSelf();
        $approvalTypeModel->method('first')->willReturn(new class {
            public function getAttributes(): array
            {
                return ['id' => 55];
            }
        });

        $existingConfiguration = $this->createBuilder(['store']);
        $existingConfiguration->id = 500;
        $existingConfiguration->method('store')->willReturnSelf();

        $approvalConfigurationModel = $this->createBuilder(['where', 'first']);
        $approvalConfigurationModel->method('where')->willReturnSelf();
        $approvalConfigurationModel->method('first')->willReturn($existingConfiguration);

        $approvalLevelModel = $this->createBuilder(['load', 'isLoaded']);
        $approvalLevelModel->method('load')->willReturnSelf();
        $approvalLevelModel->method('isLoaded')->willReturn(false);

        $repository = $this->createMock(ApprovalWorkflowConfigurationRepository::class);
        $repository->method('getModel')->willReturnCallback(static function (?string $name = null) use (
            $approvalTypeModel,
            $approvalConfigurationModel,
            $approvalLevelModel
        ) {
            $models = [
                'approvalType' => $approvalTypeModel,
                'approvalConfiguration' => $approvalConfigurationModel,
            ];
            return $models[$name] ?? $approvalLevelModel;
        });

        $action = new class($this->createMock(LoggerInterface::class), $repository) extends ApprovalWorkflowConfigurationAction {
            protected array $payload = [
                'levels' => [[
                    'id' => 15,
                    'is_threshold' => 0,
                    'sort_order' => 1,
                    'rule_type' => 'any',
                    'roles' => [7, 8],
                    'conditions' => [],
                ]],
            ];
            public function getData($k = null, $default = null)
            {
                return $this->payload;
            }
        };

        $response = $action->createApprovalWorkflow(
            (new ServerRequestFactory())->createServerRequest('POST', '/approval-configurations/type/order'),
            $this->responses->createResponse(),
            ['approval_type' => 'order', 'aid' => 99, 'type' => 'order']
        );

        self::assertSame(400, $response->getStatusCode());
    }

    public function testFetchWorkflowConfigurationsReturnsNestedLevelsWithRoles(): void
    {
        $approvalTypeModel = $this->createBuilder(['where', 'first']);
        $approvalTypeModel->method('where')->willReturnSelf();
        $approvalTypeModel->method('first')->willReturn((object) [
            'id' => 5,
            'display_label' => 'Order Approval',
        ]);

        $joinedRows = [
            [
                'allow_requester_self_approval' => true,
                'consolidate_duplicate_approver_notifications' => false,
                'auto_complete_lower_approvals' => true,
                'level_id' => 10,
                'is_threshold' => 0,
                'level_sort_order' => 1,
                'rule_type' => 'any',
                'min_required' => null,
                'level_account_role_id' => 3,
                'condition_id' => null,
                'threshold_type' => null,
                'from_value' => null,
                'to_value' => null,
                'condition_sort_order' => null,
                'allow_higher_level_approval' => null,
                'condition_account_role_id' => null,
            ],
            [
                'allow_requester_self_approval' => true,
                'consolidate_duplicate_approver_notifications' => false,
                'auto_complete_lower_approvals' => true,
                'level_id' => 10,
                'is_threshold' => 0,
                'level_sort_order' => 1,
                'rule_type' => 'any',
                'min_required' => null,
                'level_account_role_id' => 4,
                'condition_id' => null,
                'threshold_type' => null,
                'from_value' => null,
                'to_value' => null,
                'condition_sort_order' => null,
                'allow_higher_level_approval' => null,
                'condition_account_role_id' => null,
            ],
        ];

        $approvalConfigurationModel = $this->createBuilder([
            'leftJoin', 'where', 'select', 'orderBy', 'get',
        ]);
        $approvalConfigurationModel->method('leftJoin')->willReturnSelf();
        $approvalConfigurationModel->method('where')->willReturnSelf();
        $approvalConfigurationModel->method('select')->willReturnSelf();
        $approvalConfigurationModel->method('orderBy')->willReturnSelf();
        $approvalConfigurationModel->method('get')->willReturn(new class($joinedRows) {
            private array $rows;
            public function __construct(array $rows)
            {
                $this->rows = $rows;
            }
            public function toArray(): array
            {
                return $this->rows;
            }
        });

        $repository = $this->createMock(ApprovalWorkflowConfigurationRepository::class);
        $repository->method('getModel')->willReturnCallback(static function (?string $name = null) use (
            $approvalTypeModel,
            $approvalConfigurationModel
        ) {
            $models = [
                'approvalType' => $approvalTypeModel,
                'approvalConfiguration' => $approvalConfigurationModel,
            ];
            return $models[$name] ?? null;
        });

        $action = $this->createAction($repository);
        $response = $action->fetchWorkflowConfigurations(
            (new ServerRequestFactory())->createServerRequest('GET', '/approval-configurations/type/order'),
            $this->responses->createResponse(),
            ['approval_type' => 'order', 'aid' => 1]
        );

        self::assertSame(200, $response->getStatusCode());
        $data = json_decode((string) $response->getBody(), true)['data'];
        self::assertSame('Order Approval', $data['label']);
        self::assertTrue($data['allow_requester_self_approval']);
        self::assertFalse($data['consolidate_notifications']);
        self::assertTrue($data['auto_complete_lower_approvals']);
        self::assertSame(1, count($data['approval_levels']));
        self::assertSame(10, $data['approval_levels'][0]['id']);
        self::assertSame([['id' => '3'], ['id' => '4']], $data['approval_levels'][0]['roles']);
    }

    public function testFetchApprovalLevelRolesReturnsThresholdRules(): void
    {
        $approvalTypeModel = $this->createBuilder(['where', 'first']);
        $approvalTypeModel->method('where')->willReturnSelf();
        $approvalTypeModel->method('first')->willReturn((object) ['id' => 5]);

        $approvalConfigurationModel = $this->createBuilder(['where', 'first']);
        $approvalConfigurationModel->method('where')->willReturnSelf();
        $approvalConfigurationModel->method('first')->willReturn(new class {
            public function toArray(): array
            {
                return [
                    'id' => 99,
                    'account_id' => 1,
                    'approval_type_id' => 5,
                    'allow_requester_self_approval' => true,
                    'consolidate_duplicate_approver_notifications' => false,
                    'auto_complete_lower_approvals' => true,
                ];
            }
        });

        $approvalLevelModel = $this->createBuilder(['where', 'get']);
        $approvalLevelModel->method('where')->willReturnSelf();
        $approvalLevelModel->method('get')->willReturn(new class {
            public function toArray(): array
            {
                return [[
                    'id' => 10,
                    'approval_type_id' => 5,
                    'account_id' => 1,
                    'label' => 'Threshold Level',
                    'sort_order' => 1,
                    'is_threshold' => 1,
                    'rule_type' => 'all',
                    'min_required' => 1,
                ]];
            }
        });

        $approvalLevelConditionModel = $this->createBuilder(['where', 'orderBy', 'get']);
        $approvalLevelConditionModel->method('where')->willReturnSelf();
        $approvalLevelConditionModel->method('orderBy')->willReturnSelf();
        $approvalLevelConditionModel->method('get')->willReturn(new class {
            public function toArray(): array
            {
                return [[
                    'id' => 20,
                    'threshold_type' => 'amount',
                    'from_value' => 100,
                    'to_value' => 200,
                    'sort_order' => 1,
                    'allow_higher_level_approval' => 1,
                ]];
            }
        });

        $approvalConditionAccountRoleMappingModel = $this->createBuilder(['where', 'get']);
        $approvalConditionAccountRoleMappingModel->method('where')->willReturnSelf();
        $approvalConditionAccountRoleMappingModel->method('get')->willReturn(new class {
            public function toArray(): array
            {
                return [[
                    'approval_level_condition_id' => 20,
                    'account_role_id' => 3,
                ]];
            }
        });

        $repository = $this->createMock(ApprovalWorkflowConfigurationRepository::class);
        $repository->method('getModel')->willReturnCallback(static function (?string $name = null) use ($approvalTypeModel, $approvalConfigurationModel, $approvalLevelModel, $approvalLevelConditionModel, $approvalConditionAccountRoleMappingModel) {
            if ($name === 'approvalType') {
                return $approvalTypeModel;
            }
            if ($name === 'approvalConfiguration') {
                return $approvalConfigurationModel;
            }
            if ($name === 'approvalLevel') {
                return $approvalLevelModel;
            }
            if ($name === 'approvalLevelCondition') {
                return $approvalLevelConditionModel;
            }
            return $approvalConditionAccountRoleMappingModel;
        });

        $action = $this->createAction($repository);
        $response = $action->fetchApprovalLevelRoles(
            (new ServerRequestFactory())->createServerRequest('GET', '/approval-types/1/roles'),
            $this->responses->createResponse(),
            ['approval_type' => 'order', 'aid' => 1]
        );

        self::assertSame(200, $response->getStatusCode());
        $payload = json_decode((string) $response->getBody(), true);
        self::assertSame([
            'allow_requester_self_approval' => true,
            'consolidate_notifications' => false,
            'auto_complete_lower_approvals' => true,
        ], $payload['data']['config']);
        self::assertSame(1, count($payload['data']['rules']));
        self::assertSame([3], $payload['data']['rules'][0]['roles']);
        self::assertSame(20, $payload['data']['rules'][0]['id']);
        self::assertSame('amount', $payload['data']['rules'][0]['threshold_type']);
    }

    public function testCreateApprovalWorkflowProcessReturnsCreatedRows(): void
    {
        $workflowModel = $this->createBuilder(['create']);
        $workflowModel->expects(self::once())->method('create')->with(['approval_level_id' => 7])->willReturn((object) ['id' => 101]);

        $repository = $this->createMock(ApprovalWorkflowConfigurationRepository::class);
        $repository->method('getModel')->with('approvalLevelWorkflow')->willReturn($workflowModel);

        $action = new class($this->createMock(LoggerInterface::class), $repository) extends ApprovalWorkflowConfigurationAction {
            protected array $payload = [
                ['approval_level_id' => 7],
            ];

            public function getData($k = null, $default = null)
            {
                return $this->payload;
            }
        };

        $response = $action->createApprovalWorkflowProcess(
            (new ServerRequestFactory())->createServerRequest('POST', '/approval-level-workflows'),
            $this->responses->createResponse(),
            []
        );

        self::assertSame(200, $response->getStatusCode());
        self::assertSame([
            ['approval_level_workflow_id' => 101, 'approval_level_id' => 7],
        ], json_decode((string) $response->getBody(), true)['data']);
    }

    public function testFetchApprovalWorkflowProcessByEntityWithStatusReturnsSingleRow(): void
    {
        $workflowModel = $this->createBuilder(['where', 'orderBy', 'first']);
        $workflowModel->method('where')->willReturnSelf();
        $workflowModel->method('orderBy')->willReturnSelf();
        $workflowModel->method('first')->willReturn(new class {
            public function toArray(): array
            {
                return ['id' => 55, 'status' => 'pending', 'entity_type' => 'order', 'entity_id' => 42];
            }
        });

        $repository = $this->createMock(ApprovalWorkflowConfigurationRepository::class);
        $repository->method('getModel')->with('approvalLevelWorkflow')->willReturn($workflowModel);

        $request = (new ServerRequestFactory())->createServerRequest('GET', '/approval-level-workflows/order/42');
        $request = $request->withQueryParams(['status' => 'pending']);

        $action = $this->createAction($repository);
        $response = $action->fetchApprovalWorkflowProcessByEntity($request, $this->responses->createResponse(), ['entity_type' => 'order', 'entity_id' => 42]);

        self::assertSame(200, $response->getStatusCode());
        self::assertSame('pending', json_decode((string) $response->getBody(), true)['data']['status']);
    }

    public function testCompleteCurrentAndStartNextWorkflowLevelByEntityAdvancesWorkflow(): void
    {
        $workflowModel = $this->createBuilder(['where', 'orderBy', 'first', 'update']);
        $workflowModel->method('where')->willReturnSelf();
        $workflowModel->method('orderBy')->willReturnSelf();
        $workflowModel->method('first')->willReturnOnConsecutiveCalls(
            (object) ['id' => 100],
            (object) ['id' => 200]
        );
        $updated = [];
        $workflowModel->expects(self::exactly(2))->method('update')->willReturnCallback(static function (array $data) use (&$updated) {
            $updated[] = $data;
            return true;
        });

        $repository = $this->createMock(ApprovalWorkflowConfigurationRepository::class);
        $repository->method('getModel')->with('approvalLevelWorkflow')->willReturn($workflowModel);

        $action = $this->createAction($repository);
        $response = $action->completeCurrentAndStartNextWorkflowLevelByEntity(
            (new ServerRequestFactory())->createServerRequest('PATCH', '/workflow/order/42/advance'),
            $this->responses->createResponse(),
            ['entity_type' => 'order', 'entity_id' => 42]
        );

        self::assertSame(203, $response->getStatusCode());
    }

    public function testBulkCreateApprovalLevelWorkflowsMarksSatisfiedLevelAsCompleted(): void
    {
        $approvalLevelModel = $this->createBuilder(['where', 'first']);
        $approvalLevelModel->method('where')->willReturnSelf();
        $approvalLevelModel->method('first')->willReturn(null);

        $created = [];
        $workflowModel = $this->createBuilder(['create']);
        $workflowModel->method('create')->willReturnCallback(static function (array $data) use (&$created) {
            $created[] = $data;
            return (object) ['id' => count($created)];
        });

        $repository = $this->createMock(ApprovalWorkflowConfigurationRepository::class);
        $repository->method('getModel')->willReturnCallback(static function (?string $name = null) use ($approvalLevelModel, $workflowModel) {
            return $name === 'approvalLevel' ? $approvalLevelModel : $workflowModel;
        });

        $action = new class($this->createMock(LoggerInterface::class), $repository) extends ApprovalWorkflowConfigurationAction {
            protected array $payload = [
                'entity_type' => 'shortlisted_subcontractor',
                'entity_ids' => [201, 202],
                'approval_level_ids' => [11, 12],
                'account_id' => 0,
                'approval_type' => 'supplier_list',
                'satisfied_levels' => [
                    ['entity_id' => 201, 'approval_level_id' => 11, 'is_level_satisfied_by_self_approved' => true],
                ],
            ];
            public function getData($k = null, $default = null)
            {
                return $this->payload;
            }
        };

        $response = $action->bulkCreateApprovalLevelWorkflows(
            (new ServerRequestFactory())->createServerRequest('POST', '/approval-workflow-configurations/level-workflows/bulk'),
            $this->responses->createResponse(),
            []
        );

        self::assertSame(200, $response->getStatusCode());

        // entity 201, level 11 (sort_order 1) is satisfied -> completed instead of in_progress
        self::assertSame('completed', $created[0]['status']);
        $meta0 = json_decode($created[0]['meta'], true);
        self::assertTrue($meta0['is_level_satisfied_by_self_approved']);
        self::assertFalse($meta0['is_level_satisfied_by_higher_authority']);
        // entity 201, level 12 (sort_order 2) is not satisfied -> in_progress (first active level)
        self::assertSame('in_progress', $created[1]['status']);
        $meta1 = json_decode($created[1]['meta'], true);
        self::assertFalse($meta1['is_level_satisfied_by_self_approved']);
        self::assertFalse($meta1['is_level_satisfied_by_higher_authority']);
        // entity 202, level 11 is not satisfied for this entity -> default in_progress (first level)
        self::assertSame('in_progress', $created[2]['status']);
        self::assertSame('pending', $created[3]['status']);
    }

    public function testDeleteApprovalWorkflowProcessByEntityReturnsNoContent(): void
    {
        $workflowModel = $this->createBuilder(['deleteBy']);
        $workflowModel->expects(self::once())->method('deleteBy')->with([
            'entity_type' => 'order',
            'entity_id' => 42,
        ])->willReturn(true);

        $repository = $this->createMock(ApprovalWorkflowConfigurationRepository::class);
        $repository->method('getModel')->with('approvalLevelWorkflow')->willReturn($workflowModel);

        $action = $this->createAction($repository);
        $response = $action->deleteApprovalWorkflowProcessByEntity(
            (new ServerRequestFactory())->createServerRequest('DELETE', '/workflow/order/42'),
            $this->responses->createResponse(),
            ['entity_type' => 'order', 'entity_id' => 42]
        );

        self::assertSame(203, $response->getStatusCode());
    }

    private function createAction(ApprovalWorkflowConfigurationRepository $repository): ApprovalWorkflowConfigurationAction
    {
        return new ApprovalWorkflowConfigurationAction($this->createMock(LoggerInterface::class), $repository);
    }

    private function createBuilder(array $methods)
    {
        return $this->getMockBuilder(\stdClass::class)->addMethods($methods)->getMock();
    }

    private function createResultCollection(array $groups): object
    {
        return new class($groups) {
            private array $groups;

            public function __construct(array $groups)
            {
                $this->groups = $groups;
            }

            public function groupBy($key)
            {
                return new class($this->groups) {
                    private array $groups;

                    public function __construct(array $groups)
                    {
                        $this->groups = $groups;
                    }

                    public function map(callable $callback)
                    {
                        $mapped = [];
                        foreach ($this->groups as $group) {
                            $mapped[] = $callback($group);
                        }

                        return new class($mapped) {
                            private array $mapped;

                            public function __construct(array $mapped)
                            {
                                $this->mapped = $mapped;
                            }

                            public function toArray(): array
                            {
                                return $this->mapped;
                            }
                        };
                    }
                };
            }
        };
    }

    private function createGroup(array $rows): object
    {
        return new class($rows) {
            private array $rows;

            public function __construct(array $rows)
            {
                $this->rows = $rows;
            }

            public function first(): object
            {
                return new class($row = $this->rows[0] ?? []) {
                    private array $row;

                    public function __construct(array $row)
                    {
                        $this->row = $row;
                    }

                    public function toArray(): array
                    {
                        return $this->row;
                    }
                };
            }

            public function map(callable $callback): object
            {
                $items = [];
                foreach ($this->rows as $row) {
                    $items[] = $callback((object) $row);
                }

                return new class($items) {
                    private array $items;

                    public function __construct(array $items)
                    {
                        $this->items = $items;
                    }

                    public function pluck(string $key): array
                    {
                        return array_map(static fn(array $item) => $item[$key], $this->items);
                    }
                };
            }
        };
    }
}
