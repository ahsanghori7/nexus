<?php

declare(strict_types=1);

use App\Application\Actions\Account\AccountAction;
use App\Application\Actions\Model\ModelAction;
use App\Application\Actions\Account\SSOAction;
use App\Application\Actions\Distance\DistanceAction;
use App\Application\Actions\Token\TokenAction;
use App\Application\Actions\Token\TokenHistoryAction;
use App\Application\Actions\Trade\TradeAction;
use App\Application\Actions\User\UserAction;
use App\Application\Actions\Trade\CategoryAction;
use App\Application\Actions\Region\RegionAction;
use App\Application\Actions\ProjectType\ProjectTypeAction;
use App\Application\Actions\Account\SupplyChainAction;
use App\Application\Actions\Approval\ApprovalAction;
use App\Application\Actions\Prequalification\PrequalificationAction;
use App\Application\Actions\Email\EmailAction;
use App\Application\Actions\Feature\FeatureAction;
use App\Application\Actions\Role\RoleAction;
use App\Application\Actions\Role\RoleMappingAction;
use App\Application\Actions\Role\AccountRoleAction;
use App\Application\Actions\Account\AccountGroupAction;
use App\Application\Actions\Role\AccountRoleUserMappingAction;

use App\Application\Actions\Threshold\ThresholdAction;
use App\Application\Actions\Permission\PermissionAction;
use App\Application\Actions\Account\ProviderAction;
use App\Application\Actions\ApiClient\ApiClientAction;
use App\Application\Actions\Notification\NotificationAction;
use Psr\Http\Message\ResponseInterface as Response;
use Psr\Http\Message\ServerRequestInterface as Request;
use Slim\App;
use Slim\Interfaces\RouteCollectorProxyInterface as Group;

require_once __DIR__ . '/v2/routes.php';


return function (App $app) {

    V2Routes::register($app);

    $app->get('/', function (Request $request, Response $response) {
        $response->getBody()->write('OK!');
        return $response;
    });

    $app->group('/v1/model', function (Group $group) {
        $group->get('/describe/{resource:[a-zA-Z_]+}[/{model:[a-zA-Z_]+}]', ModelAction::class . ':describe');
    });

    $app->group('/v1/account', function (Group $group) {
        $group->post('/{account_id:[0-9]+}/account_role', AccountRoleAction::class . ':createAction');
        $group->get('/{account_id:[0-9]+}/account_roles', AccountRoleAction::class . ':fetchAction');
        $group->get('/account-roles', AccountRoleAction::class . ':fetchByIds');
        $group->patch('/{account_id:[0-9]+}/account_role/{id:[0-9]+}', AccountRoleAction::class . ':updateAction');
        $group->delete('/{account_id:[0-9]+}/account_role/{id:[0-9]+}', AccountRoleAction::class . ':deleteAction');
        $group->post('/{account_id:[0-9]+}/group', AccountGroupAction::class . ':createGroup');
        $group->patch('/{account_id:[0-9]+}/group/{group_id:[0-9]+}', AccountGroupAction::class . ':updateGroup');
        $group->get('/{account_id:[0-9]+}/groups', AccountGroupAction::class . ':listGroup');
        $group->get('/{account_id:[0-9]+}/group/{id:[0-9]+}', AccountGroupAction::class . ':getById');
        $group->get('/{account_id:[0-9]+}/users', AccountAction::class . ':fetchAccountUsers');
        $group->post('/{account_id:[0-9]+}/user/{user_id:[0-9]+}/group', AccountGroupAction::class . ':assignUserGroup');
        $group->patch('/{account_id:[0-9]+}/user/{user_id:[0-9]+}/group', AccountGroupAction::class . ':updateUserGroup');
        $group->get('/{account_id:[0-9]+}/user/{user_id:[0-9]+}/group', AccountGroupAction::class . ':getUserGroup');
        $group->delete('/{account_id:[0-9]+}/users/{user_id:[0-9]+}/groups/{group_id:[0-9]+}', AccountGroupAction::class . ':deleteUserGroup');
        $group->patch('/{user_id:[0-9]+}/account_role_user_mapping', AccountRoleUserMappingAction::class . ':updateAccountRoleAction');
        $group->delete('/{user_id:[0-9]+}/account_role_user_mapping', AccountRoleUserMappingAction::class . ':deleteAccountRoleAction');
        $group->get('/{account_id:[0-9]+}/account_role_users/{account_role_id:[0-9]+}', AccountRoleAction::class . ':fetchUsersAction');

        $group->get('', AccountAction::class . ':list');
        $group->get('/search', AccountAction::class . ':search');
        $group->get('/list', AccountAction::class . ':listAllAccounts');
        $group->get('/{ids:\[[0-9,]+\]}', AccountAction::class . ':listAccounts');
        $group->get('/type', AccountAction::class . ':listTypes');
        $group->get('/user-types', AccountAction::class . ':listUserTypes');
        $group->get('/subscription', AccountAction::class . ':listSubscriptions');
        //This is the new line, but the files encoding was set to windows, so changing it to unix makes git think the whole files has changed
        $group->get('/subscription/{id:[0-9]+}', AccountAction::class . ':getModelById');
        $group->get('/subscription/website/{website_id:[0-9]+}', AccountAction::class . ':getSubscriptionsByFilter');
        $group->get('/website', AccountAction::class . ':listAllWebsites');
        $group->post('', AccountAction::class . ':create');
        $group->get('/{id:[0-9]+}', AccountAction::class . ':getById');
        $group->delete('/{id:[0-9]+}', AccountAction::class . ':deleteById');
        $group->patch('/{id:[0-9]+}', AccountAction::class . ':updateById');
        $group->get('/{id:[0-9]+}/membership', AccountAction::class . ":getMembership");
        $group->patch('/{id:[0-9]+}/membership', AccountAction::class . ":updateMembership");
        $group->post('/membership', AccountAction::class . ':createMembership');
        $group->get('/membership', AccountAction::class . ':listAccountsByMembership');
        $group->patch('/{id:[0-9]+}/meta', AccountAction::class . ":updateMeta");

        $group->get('/offerings', AccountAction::class . ':getAllOfferings');

        /**
         * SSO Routes
         */
        $group->get('/sso/{provider}/login', SSOAction::class . ':sso_login');
        $group->get('/sso/provider', SSOAction::class . ':listSSOProviders');
        $group->get('/{id:[0-9]+}/sso/provider', SSOAction::class . ':getSSOProviderAccountMapping');

        /**
         * Provider Routes
         */
        $group->get('/{id:[0-9]+}/provider/{provider:\w+}', ProviderAction::class . ':getProviderAccountMapping');


        $group->get('/activation_link/{email}', AccountAction::class . ':activation_link');
        $group->patch('/activate_account/{token:\w+}', AccountAction::class . ':activate_account');

        $group->get('/payment_request/{id:[0-9]+}', AccountAction::class . ':paymentRequest');

        $group->patch('/auto_loader/{token:\w+}', AccountAction::class . ':autoLoader');
        $group->patch('/opt_in/{token:\w+}', AccountAction::class . ':optIn');

        $group->get('/{id:[0-9]+}/session', AccountAction::class . ':getSession');
        $group->post('/{id:[0-9]+}/session', AccountAction::class . ':makeSession');
        $group->delete('/{id:[0-9]+}/session', AccountAction::class . ':closeSession');

        $group->get('/{id:[0-9]+}/region', RegionAction::class . ':getRegions');
        $group->get('/{id:[0-9]+}/trades', TradeAction::class . ':getTrades');
        $group->get('/{id:[0-9]+}/projecttypes', ProjectTypeAction::class . ':getTypes');

        $group->patch('/{id:[0-9]+}/region', RegionAction::class . ':updateAccountRegions');
        $group->patch('/{id:[0-9]+}/trades', TradeAction::class . ':updateTrades');
        $group->patch('/{id:[0-9]+}/projecttypes', ProjectTypeAction::class . ':updateTypes');

        $group->get('/supply_chain', SupplyChainAction::class . ':getAllSupplyChain');
        $group->get('/{id:[0-9]+}/supply_chain', SupplyChainAction::class . ':getAll');
        $group->get('/{id:[0-9]+}/supply_chain/subcontractor/{sid:[0-9]+}', SupplyChainAction::class . ':subContractorData');
        $group->post('/{id:[0-9]+}/supply_chain', SupplyChainAction::class . ':addSub');
        $group->post('/{id:[0-9]+}/supply_chain/external', SupplyChainAction::class . ':addExternal');
        $group->patch('/{id:[0-9]+}/supply_chain/external/{child:[0-9]+}', SupplyChainAction::class . ':updateExternal');
        $group->delete('/{id:[0-9]+}/supply_chain/{child:[0-9]+}', SupplyChainAction::class . ':deleteSub');

        $group->patch('/{id:[0-9]+}/supply_chain/{child:[0-9]+}/trade', SupplyChainAction::class . ':mapTrades');
        $group->patch('/{id:[0-9]+}/supply_chain/{child:[0-9]+}/region', SupplyChainAction::class . ':mapRegion');

        $group->get('/{id:[0-9]+}/supply_chain/added_to', SupplyChainAction::class . ':getAddedToContractors');
        $group->get('/{id:[0-9]+}/supply_chain_v2', SupplyChainAction::class . ':getSupplyChainByAccountId');

        $group->get('/customer_health_score', AccountAction::class . ':getAccountsCustomerHealthScore');
        $group->patch('/customer_health_score', AccountAction::class . ':updateAccountsCustomerHealthScore');
        $group->delete('/customer_health_score/{aid:[0-9]+}', AccountAction::class . ':deleteAccountsCustomerHealthScore');
        $group->get('/all', AccountAction::class . ':all');

        $group->get('/{id:[0-9]+}/engagement', AccountAction::class . ":getEngagement");
        $group->get('/{ids:\[[0-9,]+\]}/engagements', AccountAction::class . ":getEngagements");
        $group->get('/tracking', AccountAction::class . ':getTracking');
        $group->get('/tracking/type', AccountAction::class . ':getTrackingType');
        $group->get('/{id:[0-9]+}/organisation', AccountAction::class . ":getOrganisation");
        $group->post('/{id:[0-9]+}/organisation', AccountAction::class . ':createOrganisation');
        $group->patch('/{aid:[0-9]+}/organisation/{id:[0-9]+}', AccountAction::class . ':updateOrganisationMember');
        $group->delete('/{aid:[0-9]+}/organisation/{id:[0-9]+}', AccountAction::class . ':deleteOrganisationMember');
        $group->delete('/{aid:[0-9]+}/organisation/{id:[0-9]+}/user_id', AccountAction::class . ':deleteOrganisationMemberByUserId');
        $group->get('/organisation/type', AccountAction::class . ':getOrganisationRoleType');

        $group->get('/region/{rid:[0-9]+}', AccountAction::class . ':getAccountsByRegion');
    });

    $app->group('/v1/prequalification', function (Group $group) {
        $group->patch('/{id:[0-9]+}/company_information', PrequalificationAction::class . ':updateCompanyById');
        $group->patch('/{id:[0-9]+}/organisation', PrequalificationAction::class . ':updateOrganisationById');
        $group->patch('/{id:[0-9]+}/turnover', PrequalificationAction::class . ':updateTurnoverById');
        $group->patch('/{id:[0-9]+}/references', PrequalificationAction::class . ':updateReferencesById');
        $group->patch('/{id:[0-9]+}/reference/{rid:[0-9]+}', PrequalificationAction::class . ':updateReferenceById');
        $group->patch('/{id:[0-9]+}/statuses', PrequalificationAction::class . ':updateStatusesById');
        $group->get('/sections', PrequalificationAction::class . ':getPrequalificationSections');
        $group->get('/section_list', PrequalificationAction::class . ':getPrequalificationSectionList');
        $group->get('/{id:[0-9]+}/sections', PrequalificationAction::class . ':getPrequalificationSectionStatuses');
        $group->post('/{id:[0-9]+}/sections', PrequalificationAction::class . ':createPrequalificationSectionStatuses');
        $group->patch('/{id:[0-9]+}/sections', PrequalificationAction::class . ':updatePrequalificationSectionStatuses');
        $group->patch('/{id:[0-9]+}/section', PrequalificationAction::class . ':updateSection');
        $group->get('/{id:[0-9]+}', PrequalificationAction::class . ':getPrequalificationById');
    });

    $app->group('/v1/distance', function (Group $group) {
        $group->get('', DistanceAction::class . ':list');
        $group->post('', DistanceAction::class . ':addDistances');
    });

    $app->group('/v1/token', function (Group $group) {
        $group->get('/type', TokenAction::class . ':listTypes');
        $group->post('/disable/bulk', TokenAction::class . ':disableBulk');
        $group->delete('/{token:\w+}', TokenAction::class . ':disable');
        $group->post('', TokenAction::class . ':createToken');
        $group->get('/verify/{token:\w+}', TokenAction::class . ':verifyToken');
        $group->get('', TokenAction::class . ':listTokens');
        $group->patch('/{token:\w+}/meta', TokenAction::class . ':addMetaToken');
        $group->delete('/user/{id:\d+}', TokenAction::class . ':deleteByUserId');
    });

    $app->group('/v1/api_client', function (Group $group) {
        $group->post('/authenticate', ApiClientAction::class . ':authenticate');
        $group->get('/{id:[0-9]+}', ApiClientAction::class . ':loadById');
        $group->post('/{id:[0-9]+}/audit', ApiClientAction::class . ':writeAudit');
        $group->get('/business_unit/account/{account_id:[0-9]+}', ApiClientAction::class . ':listBusinessUnitsByAccount');
        $group->get('/{id:[0-9]+}/business_unit', ApiClientAction::class . ':listBusinessUnits');
        $group->get('/{id:[0-9]+}/business_unit/{code}', ApiClientAction::class . ':resolveBusinessUnit');
    });

    $app->group('/v1/token_history', function (Group $group) {
        $group->get('', TokenHistoryAction::class . ':listTokenHistory');
        $group->get('/issued', TokenHistoryAction::class . ':listTokenHistoryIssued');
        $group->post('/issued', TokenHistoryAction::class . ':createTokenIssuedHistory');
        $group->get('/used', TokenHistoryAction::class . ':listTokenHistoryUsed');
        $group->post('/used', TokenHistoryAction::class . ':createTokenUsedHistory');
    });

    $app->group('/v1/email', function (Group $group) {
        $group->patch('/unsubscribe/{token:[\w\+\/=]+}/{email_id:[0-9]+}', EmailAction::class . ':unsubscribe');
        $group->get('/blacklist', EmailAction::class . ':listBlacklist');
        $group->get('/types', EmailAction::class . ':listTypes');
        $group->post('/log', EmailAction::class . ':logEvent');
        $group->get('/logs', EmailAction::class . ':listEmailLogs');
        $group->get('/logs-by-entity', EmailAction::class . ':listEmailLogsByEntity');
        $group->get('/logs-by-entity-account', EmailAction::class . ':listEmailLogsByEntityAccount');
    });

    $app->group('/v1/user', function (Group $group) {
        $group->get('', UserAction::class . ':list');
        $group->get('/{ids:\[[0-9,]+\]}', UserAction::class . ':listUsersById');
        $group->get('/search', UserAction::class . ':listUsersByField');
        $group->get('/account/{ids:\[[0-9,]+\]}', UserAction::class . ':listUsersByAccountId');
        $group->get('/all', UserAction::class . ':all');
        $group->post('', UserAction::class . ':create');

        $group->delete('/{id:[0-9]+}', UserAction::class . ':delete');

        $group->get('/type', UserAction::class . ':listTypes');

        $group->post('/session', UserAction::class . ':login');
        $group->delete('/session/{token:\w+}', UserAction::class . ':logout');
        $group->get('/session/{token:\w+}', UserAction::class . ':verify');
        $group->patch('/session/{token:\w+}', UserAction::class . ':updateMeta');
        $group->get('/renew_session/{token:\w+}', UserAction::class . ':renew');

        $group->get('/reset_password/{email}', UserAction::class . ':reset_password');
        $group->post('/renew_password', UserAction::class . ':renew_password');
        $group->get('/check_password', UserAction::class . ':checkPassword');

        $group->get('/{id:[0-9]+}/profile', UserAction::class . ':getById');
        $group->patch('/{id:[0-9]+}/profile', UserAction::class . ':updateById');
        $group->get('/{id:[0-9]+}/token/auto_loader', UserAction::class . ':createAutoLoaderToken');
        $group->get('/session_usage/{token:\w+}', UserAction::class . ':getSessionUsage');
        $group->patch('/session_usage/{token:\w+}', UserAction::class . ':incrementSessionUsage');

        $group->get('/{id:[0-9]+}/engagement', UserAction::class . ":getEngagement");
        // Handle user notifications
        $group->get('/{id:[0-9]+}/notifications', UserAction::class . ":getNotifications");
        $group->post('/notifications', UserAction::class . ":createNotification");
        $group->patch('/notifications/{nid:[0-9]+}', UserAction::class . ":updateNotificationById");

        $group->get('/user_action_types', UserAction::class . ':getUserActionTypes');
        $group->get('/{id:[0-9]+}/account-roles', UserAction::class . ':getUserAccountRoles');
        $group->get('/{ids:\[[0-9,]+\]}/account-roles', UserAction::class . ':getUsersWithAccountRoles');
    });

    $app->group('/v1/trade_category', function (Group $group) {
        $group->get('', CategoryAction::class . ':list');
        $group->post('', CategoryAction::class . ':create');

        $group->post('/package', CategoryAction::class . ':createPackage');
        $group->patch('/package/{id:[0-9]+}', TradeAction::class . ':updateById');
        $group->delete('/package/{id:[0-9]+}', TradeAction::class . ':deleteById');

        $group->patch('/{id:[0-9]+}', CategoryAction::class . ':updateById');
        $group->delete('/{id:[0-9]+}', CategoryAction::class . ':deleteById');
    });

    $app->group('/v1/trade_group', function (Group $group) {
        $group->get('/{type:[0-9]+}', TradeAction::class . ':getTradeGroup');
    });

    $app->group('/v1/region', function (Group $group) {
        $group->get('', RegionAction::class . ':list');
        $group->get('/group', RegionAction::class . ':getRegionGroup');
        $group->post('', RegionAction::class . ':createRegion');
        $group->patch('/{id:[0-9]+}', RegionAction::class . ':updateById');
        $group->delete('/{id:[0-9]+}', RegionAction::class . ':deleteById');
    });

    $app->group('/v1/trade', function (Group $group) {
        $group->get('', TradeAction::class . ':all');
    });

    $app->group('/v1/feature', function (Group $group) {
        $group->get('/account-feature/{aid:[0-9]+}', FeatureAction::class . ':getAccountFeature');
        $group->post('/account-feature', FeatureAction::class . ':createAccountFeature');
        $group->get('', FeatureAction::class . ':fetchFeatures');
        $group->get('/accounts', FeatureAction::class . ':fetchAccountsWithFeatures');
        $group->get('/accounts/{aid:[0-9]+}', FeatureAction::class . ':fetchAccountsWithFeatures');
        $group->patch('/accounts', FeatureAction::class . ':updateAccountsFeatures');
        $group->delete('/accounts/{aid:[0-9]+}', FeatureAction::class . ':deleteAccountsFeatures');
        $group->get('/envelope/{aid:[0-9]+}', FeatureAction::class . ':fetchAccountEnvelopes');
        $group->patch('/envelope/{aid:[0-9]+}', FeatureAction::class . ':updateEnvelopes');
        $group->get('/account-features-mapping', FeatureAction::class . ':getAccountsFeaturesMapping');
        $group->post('/account-features-mapping', FeatureAction::class . ':createAccountsFeaturesMapping');
        $group->patch('/{feature:[0-9]+}/account_mapping/{maid:[0-9]+}', FeatureAction::class . ':updateAccountsFeaturesMapping');
    });

    $app->group('/v1/thresholds', function (Group $group) {
        $group->get('/{aid:[0-9]+}', ThresholdAction::class . ':fetchThresholds');
        $group->post('', ThresholdAction::class . ':createThreshold');
        $group->patch('/{id:[0-9]+}', ThresholdAction::class . ':updateById');
        $group->delete('/{id:[0-9]+}', ThresholdAction::class . ':deleteById');
        $group->delete('/account/{aid:[0-9]+}', ThresholdAction::class . ':deleteByAccountId');
        $group->get('/{aid:[0-9]+}/users', ThresholdAction::class . ':getUsersByOrderValue');
        $group->delete('/user/{user_id:[0-9]+}', ThresholdAction::class . ':deleteUserMappings');
        $group->post('/user', ThresholdAction::class . ':createUserMapping');
        $group->get('/user', ThresholdAction::class . ':getAllUserMappings');
        $group->get('/user/{user_id:[0-9]+}', ThresholdAction::class . ':getUserMappings');
        $group->get('/threshold/{threshold_id:[0-9]+}/users', ThresholdAction::class . ':getUsersByThresholdId');
    });

    $app->group('/v1/permissions', function (Group $group) {
        $group->get('', PermissionAction::class . ':fetchPermissions');
        $group->get('/mappings', PermissionAction::class . ':getAllPermissionMappings');
        $group->get('/permission_key', PermissionAction::class . ':getPermissionByKey');
        $group->get('/user/{user_id:[0-9]+}', PermissionAction::class . ':getUserPermissionMappings');
        $group->post('/user', PermissionAction::class . ':createUserPermissionMapping');
        $group->delete('/user/{user_id:[0-9]+}[/{permission_id:[0-9]+}]', PermissionAction::class . ':deleteUserPermissionMappings');
    });

    $app->group('/v1/approvals', function (Group $group) {
        $group->get('/trapprovers', ApprovalAction::class . ':getTRApprovers');
        $group->get('/{account_id:[0-9]+}/tiapprovers', ApprovalAction::class . ':getTIApprovers');
        $group->get('/slapprovers', ApprovalAction::class . ':getSLApprovers');
        $group->get('/{aid:[0-9]+}/trapprovers', ApprovalAction::class . ':getTRApprovers');
    });

    $app->group('/v1/roles', function (Group $group) {
        $group->get('/roles-level', RoleAction::class . ':getRoleLevel');
        $group->patch('/mapping/{user_id:[0-9]+}', RoleMappingAction::class . ':updateRole');
    });

    $app->group('/v1/account-actions', function (Group $group) {
        $group->post('', AccountAction::class . ':createAction');
        $group->get('/fetch-action', AccountAction::class . ':fetchAction');
    });

    $app->group('/v1/notification', function (Group $group) {
        $group->post('', NotificationAction::class . ':create');
        $group->get('', NotificationAction::class . ':getAll');
        $group->get('/unread_count', NotificationAction::class . ':unreadCount');
        $group->patch('/mark_all_read', NotificationAction::class . ':markAllRead');
        $group->patch('/{id:[0-9]+}/read', NotificationAction::class . ':markRead');
    });
};
