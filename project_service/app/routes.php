<?php
  declare(strict_types=1);

use App\Application\Actions\Approval\ApprovalAction;
use App\Application\Actions\Approval\ApprovalWorkflowConfigurationAction;
use App\Application\Actions\BoQ\BoQAction;
  use App\Application\Actions\Project\ProjectAction;
  use App\Application\Actions\Tender\TenderAction;
  use App\Application\Actions\Transaction\TransactionAction;
  use App\Application\Actions\Transaction\TransactionActionV2;
  use App\Application\Actions\Instruction\InstructionAction;
  use App\Application\Actions\OrderApprover\OrderApproverAction;
use App\Application\Actions\Logs\LogsAction;
use App\Application\Actions\Milestone\MilestoneAction;
use App\Application\Actions\ShortlistSubcontractor\ShortlistSubcontractorAction;
use App\Application\Actions\AccountGroupProjectMapping\AccountGroupProjectMappingAction;
use App\Application\Actions\PartnerCatalogue\PartnerCatalogueAction;
use App\Application\Actions\TenderRecommendation\TenderRecommendationAction;
  use App\Application\Actions\TenderRecommendation\TenderPricingSummaryAction;
  use Psr\Http\Message\ResponseInterface as Response;
  use Psr\Http\Message\ServerRequestInterface as Request;
  use Slim\App;
  use Slim\Interfaces\RouteCollectorProxyInterface as Group;

  return function (App $app) {

      $app->get('/', function (Request $request, Response $response) {
          $response->getBody()->write('OK!');
          return $response;
      });

      $app->group('/v1/project', function (Group $group) {
        $group->get('', ProjectAction::class . ':list');
        $group->get('/{id:[0-9]+}', ProjectAction::class . ':getById');
        $group->post('', ProjectAction::class . ':create');
        $group->patch('/{id:[0-9]+}', ProjectAction::class . ':updateById');
        $group->delete('/{id:[0-9]+}', ProjectAction::class . ':deleteById');
        $group->delete('/group/{id:[0-9]+}', ProjectAction::class . ':deleteByGroupId');

          $group->get('/{group_id:[0-9]+}/associates', ProjectAction::class . ':associates');

          $group->get('/associates', ProjectAction::class . ':associatesByFilter');

        $group->get('/slug/{name}', ProjectAction::class . ':generateSlug');

        /** Package Groups */
        $group->get('/{id:[0-9]+}/tender', ProjectAction::class . ':listPackages');
        $group->post('/{id:[0-9]+}/tender', ProjectAction::class . ':createTender');
        $group->post('/{id:[0-9]+}/tender/bulk', ProjectAction::class . ':bulkCreateTender');
        $group->patch('/{id:[0-9]+}/tender/{tid:[0-9]+}', ProjectAction::class . ':updateTender');
        $group->delete('/{id:[0-9]+}/tender/{tid:[0-9]+}', ProjectAction::class . ':deleteTenderById');
        $group->delete('/{id:[0-9]+}/tender/bulk', ProjectAction::class . ':bulkDeleteTender');
        $group->get('/{id:[0-9]+}/tender/{tid:[0-9]+}', ProjectAction::class . ':getByTenderId');
        $group->patch('/{id:[0-9]+}/tenders/publish/toggle', ProjectAction::class . ':togglePublishedState');

        /** Tender History */
        $group->post('/{id:[0-9]+}/tender/{tid:[0-9]+}/history', ProjectAction::class . ':createTenderHistory');
        $group->post('/{id:[0-9]+}/tender/history/bulk', ProjectAction::class . ':bulkCreateTenderHistory');

        $group->get('/{id:[0-9]+}/tender/{tid:[0-9]+}/history', ProjectAction::class . ':getTenderHistoryById');
        $group->get('/{id:[0-9]+}/tender/order-history/{tids:\[[0-9,]+\]}', ProjectAction::class . ':getLatestOrderHistoryByTenderIds');
        $group->patch('/{id:[0-9]+}/tender/{tid:[0-9]+}/history/{hid:[0-9]+}', ProjectAction::class . ':updateTenderHistoryById');
        $group->get('/{id:[0-9]+}/tender/history', ProjectAction::class . ':listTenders');
        $group->get('/{id:[0-9]+}/awarded-tenders', ProjectAction::class . ':getAwardedTenders');
        $group->patch('/tender/{tid:[0-9]+}/history/{sid:[0-9]+}/archive', TenderAction::class . ':toggleArchived');

          $group->delete('/tender/history/{hid:[0-9]+}', ProjectAction::class . ':deleteTenderHistoryById');

        $group->get('/{id:[0-9]+}/tender/{tid:[0-9]+}/transaction', ProjectAction::class . ':getTenderTransactionById');
        $group->get('/{id:[0-9]+}/tender/transaction', ProjectAction::class . ':listTransactions');
        $group->get('/{id:[0-9]+}/tender/transaction/files', ProjectAction::class . ':listTransactionsFiles');
        $group->get('/{id:[0-9]+}/tender/transaction/summary', ProjectAction::class . ':getSummary');
        $group->get('/{id:[0-9]+}/tender/dashboard-summary', ProjectAction::class . ':getDashboardSummary');
        $group->delete('/{id:[0-9]+}/tender/transaction/{tid:[0-9]+}', ProjectAction::class . ':deleteTransactionById');
        $group->patch('/{id:[0-9]+}/tender/transaction/{tid:[0-9]+}', ProjectAction::class . ':updateTransaction');
        $group->get('/{id:[0-9]+}/transaction', ProjectAction::class . ':listTransactionByProjectId');
        $group->get('/{id:[0-9]+}/transaction/documents', ProjectAction::class . ':listTransactionDocuments');

        /** Specialized endpoint for procurement schedule */
        $group->get('/{id:[0-9]+}/procurement', ProjectAction::class . ':getProcurement');
        $group->get('/{id:[0-9]+}/interests', ProjectAction::class . ':getInterests');
        $group->get('/{id:[0-9]+}/shortlisted-subcontractors/{tender_ids:\[[0-9,]+\]}', ShortlistSubcontractorAction::class . ':listByProject');
        $group->get('/tender_history/{tid:[0-9]+}/{sid:[0-9]+}', ProjectAction::class . ':getTenderLog');
        /** Constants */
        $group->get('/constants', ProjectAction::class . ':constants');

        $group->get('/{id:[0-9]+}/instruction', ProjectAction::class . ':getInstruction');

        $group->get('/{id:[0-9]+}/tender/dependency', ProjectAction::class . ':getDependency');

        $group->get('/customer_health_score/{pids:\[[0-9,]+\]}', ProjectAction::class . ':getCustomerHealthScore');

        $group->get('/statuses', ProjectAction::class . ':listStatuses');

          $group->get('/{id:[0-9]+}/team', ProjectAction::class . ':getTeam');
          $group->post('/{id:[0-9]+}/add_team_member', ProjectAction::class . ':addTeamMember');
          $group->patch('/{id:[0-9]+}/team_member/{member:[0-9]+}', ProjectAction::class . ':updateTeamMember');
          $group->delete('/{id:[0-9]+}/team_member/{member:[0-9]+}', ProjectAction::class . ':removeTeamMember');
          $group->get('/team/role', ProjectAction::class . ':listTeamRoles');

          /** Integration endpoints */
          $group->get('/{id:[0-9]+}/integration/provider/{provider_id:[0-9]+}', ProjectAction::class . ':getIntegration');

          $group->delete('/mappings/team_member/{member:[0-9]+}', ProjectAction::class . ':deleteTeamMemberRoleMappingByMember');
        });

      /**
       * Partner API project catalogue
       */
      $app->group('/v1/partner_catalogue', function (Group $group) {
        $group->get('/available', PartnerCatalogueAction::class . ':listAvailable');
        $group->get('/project/{project_id:[0-9]+}', PartnerCatalogueAction::class . ':getByProjectId');
        $group->get('', PartnerCatalogueAction::class . ':listCatalogue');
        $group->post('', PartnerCatalogueAction::class . ':createCatalogue');
        $group->get('/{external_id}', PartnerCatalogueAction::class . ':getByExternalId');
      });

      /** Tender */
      $app->group('/v1/tender', function (Group $group) {
        $group->get('/{id:[0-9]+}', TenderAction::class . ':listTenderById');
        $group->get('/labels', TenderAction::class . ':getTenderLabels');
        $group->get('/{id:[0-9]+}/dependency', TenderAction::class . ':getDependency');
        $group->post('/{id:[0-9]+}/dependency', TenderAction::class . ':mapDependency');
        $group->get('/history', TenderAction::class . ':listTenderHistory');
        $group->get('/history/type', ProjectAction::class . ':listTypes');
        $group->get('', TenderAction::class . ':listTender');
        $group->post('/{tid:[0-9]+}/transaction', TransactionAction::class . ':create');
        $group->post('/{tid:[0-9]+}/transaction/file', TransactionAction::class . ':addFile');
        $group->get('/{pids:\[[0-9,]+\]}', TenderAction::class . ':getTendersByProjects');
        $group->get('/{tid:[0-9]+}/quoteFiles', TenderAction::class . ':getTenderQuoteFiles');
      });

      /** Transaction */
      $app->group('/v1/transaction', function (Group $group) {
        $group->get('', TransactionAction::class . ':listTransaction');
        $group->get('/{id:[0-9]+}', TransactionAction::class . ':listTransactionById');
        $group->get('/tender/{ids:\[[0-9,]+\]}', TransactionAction::class . ':listTransactionByIds');
        $group->get('/transactions/{ids}', TransactionAction::class . ':listTransactionsByTransactionIds');
        $group->get('/type', TransactionAction::class . ':listTypes');
      });

      $app->group('/v2/transaction', function (Group $group) {
          $group->get('',  TransactionActionV2::class . ':listTransaction');
          $group->get('/history',  TransactionActionV2::class . ':listTransactionHistory');
          $group->post('', TransactionActionV2::class . ':create');
          $group->patch('/{id:[0-9]+}', TransactionActionV2::class . ':updateById');

          //Here Tid stands for Transaction ID, not tender ID
          $group->patch('/{tid:[0-9]+}/item', TransactionActionV2::class . ':handleTransactionItems');
          $group->post( '/{tid:[0-9]+}/item', TransactionActionV2::class . ':handleTransactionItems');
          $group->post( '/{tid:[0-9]+}/document', TransactionActionV2::class . ':addDocument');
          $group->delete( '/{tid:[0-9]+}/document', TransactionActionV2::class . ':deleteDocument');
      });

      /** Instruction */
      $app->group('/v1/instruction', function (Group $group) {
          $group->get('', InstructionAction::class . ':listInstruction');
          $group->get('/{id:[0-9]+}', InstructionAction::class . ':listInstructionById');
          $group->post('', InstructionAction::class . ':createInstruction');
          $group->patch('/{id:[0-9]+}', InstructionAction::class . ':updateInstructionById');
          $group->delete('/{id:[0-9]+}', InstructionAction::class . ':deleteById');
          $group->get('/type', InstructionAction::class . ':listTypes');
          $group->get('/status', InstructionAction::class . ':listStatus');
      });

      /** BoQ */
      $app->group('/v1/boq', function (Group $group) {
        $group->get('/{pid:[0-9]+}/quote_presence', BoQAction::class . ':getBoqQuotePresenceByProject');
        $group->get('/{pid:[0-9]+}/quote_documents', BoQAction::class . ':getBoqQuoteDocumentsByProject');
        $group->get('/{pid:[0-9]+}', BoQAction::class . ':listBoQ');
        $group->get('/entity/{eid:[0-9]+}', BoQAction::class . ':getEntityById');
        $group->get('/entity/tender/{tid:[0-9]+}', BoQAction::class . ':getEntityByTenderId');
        $group->post('/entity/{tid:[0-9]+}', BoQAction::class . ':createEntity');
        $group->patch('/entity/{id:[0-9]+}', BoQAction::class . ':updateEntity');
        $group->get('/resource/{id:[0-9]+}', BoQAction::class . ':getResourceById');
        $group->get('/resource/entity/{eid:[0-9]+}', BoQAction::class . ':getResourcesByEntityId');
        $group->get('/resource/type', BoQAction::class . ':getTypes');
        $group->post('/resource', BoQAction::class . ':createResource');
        $group->patch('/resource/{id:[0-9]+}', BoQAction::class . ':updateResourceById');
        $group->post('/resource/{id:[0-9]+}/version', BoQAction::class . ':createResourceVersion');
        $group->patch('/resource/{id:[0-9]+}/mapping', BoQAction::class . ':updateResourceMapping');
        $group->post('/item', BoQAction::class . ':createItem');
        $group->patch('/item/{id:[0-9]+}', BoQAction::class . ':updateItem');
        $group->patch('/item/{id:[0-9]+}/mapping', BoQAction::class . ':updateItemMapping');
        $group->post('/item/{id:[0-9]+}/version', BoQAction::class . ':createItemVersion');
        $group->delete('/item/{id:[0-9]+}', BoQAction::class . ':deleteItemById');
        $group->get('/unit', BoQAction::class . ':listUnit');
    });

      /** Order Approver */
      $app->group('/v1/order_approver', function (Group $group) {
          $group->get('', OrderApproverAction::class . ':list');
          $group->get('/{id:[0-9]+}', OrderApproverAction::class . ':getById');
          $group->post('', OrderApproverAction::class . ':createBulkApprovers');
          $group->patch('/{id:[0-9]+}', OrderApproverAction::class . ':updateById');
          $group->delete('/{id:[0-9]+}', OrderApproverAction::class . ':deleteById');
          $group->delete('/transaction/{tid:[0-9]+}', OrderApproverAction::class . ':deleteByTransaction');
          $group->get('/transaction/{tid:[0-9]+}', OrderApproverAction::class . ':getByTransaction');
          $group->get('/transaction/{tids:\[[0-9,]+\]}', OrderApproverAction::class . ':getByTransactions');
          $group->get('/transactions/grouped/{tids:\[[0-9,]+\]}', OrderApproverAction::class . ':getByTransactionsGrouped');
          $group->get('/type', OrderApproverAction::class . ':listTypes');
          $group->post('/log', OrderApproverAction::class . ':createLog');
          $group->get('/transaction/{tid:[0-9]+}/log', OrderApproverAction::class . ':getLogByTransaction');
          $group->get('/required-actions/{uid:[0-9]+}', OrderApproverAction::class . ':getRequiredActions');
          $group->get('/completed-actions/{uid:[0-9]+}', OrderApproverAction::class . ':getCompletedActions');
      });

      $app->group('/v1/project/{project_id:[0-9]+}/tender_recommendation', function ($group) {
          $group->get('', TenderRecommendationAction::class . ':getAll');
          $group->get('/recommendation_status', TenderRecommendationAction::class . ':getRecommendationStatusByProject');
          $group->get('/active', TenderRecommendationAction::class . ':getActiveRecommendations');
          $group->get('/{id:[0-9]+}', TenderRecommendationAction::class . ':getById');
          $group->post('/create', TenderRecommendationAction::class . ':create');
          $group->patch('/{id:[0-9]+}', TenderRecommendationAction::class . ':updateById');
          $group->patch('/{id:[0-9]+}/save_as_draft', TenderRecommendationAction::class . ':saveAsDraft');
          $group->delete('/{id:[0-9]+}', TenderRecommendationAction::class . ':deleteById');
      });

      $app->group('/v1/project/{project_id:[0-9]+}/package/{package_id:[0-9]+}', function ($group) {
        $group->get('/quotes', TenderPricingSummaryAction::class . ':getQuotes');
        $group->patch('/quote/{transaction_id:[0-9]+}', TenderPricingSummaryAction::class . ':updateQuote');
      });

      /** Approvers */
      $app->group('/v1/approvals', function (Group $group) {
        $group->get('', ApprovalAction::class . ':fetchApprovers');
        $group->get('/list', ApprovalAction::class . ':list');
        $group->get('/fetchEntitiesByIds', ApprovalAction::class . ':fetchEntitiesByIds');
        $group->get('/{id:[0-9]+}', ApprovalAction::class . ':getById');
        $group->patch('/{id:[0-9]+}', ApprovalAction::class . ':updateById');
        $group->post('/assign', ApprovalAction::class . ':assignApprovers');
        $group->post('/slsassign', ApprovalAction::class . ':assignSLApprovers');
        $group->delete('/{id:[0-9]+}', ApprovalAction::class . ':deleteById');
        $group->delete('/bulk/{entity_type}/{entity_id:[0-9]+}', ApprovalAction::class . ':deleteBulkByEntity');
        $group->get('/types', ApprovalAction::class . ':listTypes');
        $group->delete('/delete_by_entity/{entity_id:[0-9]+}/type/{entity_type:[a-zA-Z_]+}', ApprovalAction::class . ':deleteByEntity');
      });

      $app->group('/v1/logs', function ($group) {
          $group->post('', LogsAction::class . ':create');
          $group->post('/bulk', LogsAction::class . ':bulkCreate');
          $group->get('', LogsAction::class . ':list');
      });

      $app->group('/v1/milestones', function (Group $group) {
          $group->get('', MilestoneAction::class . ':getMilestoneList');
          $group->get('/{id:[0-9]+}', MilestoneAction::class . ':getById');

          $group->get('/account-milestone-mapping/{account_id:[0-9]+}', MilestoneAction::class . ':getAccountMilestoneMapping');
          $group->post('/account-milestone-mapping', MilestoneAction::class . ':createAccountMilestoneMapping');
          $group->patch('/account-milestone-mapping', MilestoneAction::class . ':updateAccountMilestoneMapping');

          $group->get('/accounts/{account_id:[0-9]+}', MilestoneAction::class . ':listByAccountId');

          $group->get('/statuses', MilestoneAction::class . ':listStatuses');

          $group->get('/package-milestones/{package_milestone_id:[0-9]+}', MilestoneAction::class . ':getMilestoneByPackageMilestoneId');
          $group->post('/package-milestones', MilestoneAction::class . ':createPackageMilestones');
          $group->post('/package-milestones/bulk', MilestoneAction::class . ':createBulkPackageMilestones');

          $group->get('/package-milestones', MilestoneAction::class . ':listPackageMilestones');
          $group->get('/package-milestones/packages/{package_id:[0-9]+}', MilestoneAction::class . ':getPackageMilestones');
          $group->patch('/package-milestones/packages/{package_id:[0-9]+}', MilestoneAction::class . ':updatePackageMilestones');
          $group->delete('/package-milestones/packages/{package_id:[0-9]+}', MilestoneAction::class . ':deletePackageMilestones');

          $group->post('/package-milestones/{package_milestone_id:[0-9]+}/start', MilestoneAction::class . ':startMilestone');
          $group->post('/package-milestones/{package_milestone_id:[0-9]+}/complete', MilestoneAction::class . ':completeMilestone');
      });

      $app->group('/v1/project/{project_id:[0-9]+}/tender/{tender_id:[0-9]+}/shortlisted-subcontractors', function ($group) {
          $group->get('', ShortlistSubcontractorAction::class . ':getShortlistSubcontractor');
          $group->get('/{id:[0-9]+}', ShortlistSubcontractorAction::class . ':getById');
          $group->post('', ShortlistSubcontractorAction::class . ':createShortlistuSbcontractors');
          $group->patch('/{id:[0-9]+}', ShortlistSubcontractorAction::class . ':updateById');
          $group->delete('/{id:[0-9]+}', ShortlistSubcontractorAction::class . ':deleteById');
      });
      $app->group('/v1/project/{project_id:[0-9]+}/tender/{ids:\[[0-9,]+\]}/shortlisted-subcontractors', function ($group) {
          $group->get('', ShortlistSubcontractorAction::class . ':getShortlistSubcontractorsByTenderIds');
      });

      $app->group('/v1/approval-workflow-configurations', function ($group) {
          $group->get('/{aid:[0-9]+}/type/{approval_type}', ApprovalWorkflowConfigurationAction::class . ':fetchWorkflowConfigurations');
          $group->post('/{aid:[0-9]+}/type/{type}', ApprovalWorkflowConfigurationAction::class . ':createApprovalWorkflow');
          $group->get('/approval-types', ApprovalWorkflowConfigurationAction::class . ':listApprovalTypes');
          $group->get('/approval-types/{approval_type}', ApprovalWorkflowConfigurationAction::class . ':fetchApprovalType');
          $group->get('/{aid:[0-9]+}/account_roles/{approval_type}', ApprovalWorkflowConfigurationAction::class . ':fetchApprovalLevelRoles');
          $group->post('/level-workflows/bulk', ApprovalWorkflowConfigurationAction::class . ':bulkCreateApprovalLevelWorkflows');
          $group->get('/{aid:[0-9]+}/type/{approval_type}/order-by-sorting', ApprovalWorkflowConfigurationAction::class . ':fetchWorkflowConfigurationsByOrder');
      });

      $app->group('/v1/approval-workflow-process', function ($group) {
          $group->post('', ApprovalWorkflowConfigurationAction::class . ':createApprovalWorkflowProcess');
          $group->get('/{entity_type}/{entity_id:[0-9]+}', ApprovalWorkflowConfigurationAction::class . ':fetchApprovalWorkflowProcessByEntity');
          $group->patch('/{entity_type}/{entity_id:[0-9]+}/advance', ApprovalWorkflowConfigurationAction::class . ':completeCurrentAndStartNextWorkflowLevelByEntity');
          $group->delete('/{entity_type}/{entity_id:[0-9]+}', ApprovalWorkflowConfigurationAction::class . ':deleteApprovalWorkflowProcessByEntity');
          $group->patch('/workflow/{id:[0-9]+}', ApprovalWorkflowConfigurationAction::class . ':updateApprovalLevelWorkflow');
      });

      $app->group('/v1/project/{project_id:[0-9]+}/account-group-mapping', function ($group) {
          $group->get('', AccountGroupProjectMappingAction::class . ':getAll');
          $group->post('', AccountGroupProjectMappingAction::class . ':createAccountGroupProjectMapping');
          $group->delete('/{id:[0-9]+}', AccountGroupProjectMappingAction::class . ':deleteById');
          $group->delete('', AccountGroupProjectMappingAction::class . ':deleteAllByProject');
      });
  };
