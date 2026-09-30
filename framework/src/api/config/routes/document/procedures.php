<?php

use Api\Middleware\ApprovalMiddleware;
use Api\Middleware\DocumentMiddleware;
use Core\Middleware\Conditional;
use Core\Middleware\Service\AccountMiddleware;
use Core\Middleware\Procedure;
use Core\Middleware\Service\UserMiddleware;
use Core\Middleware\Exception as MiddlewareException;

$allowed_account_types = array_merge(AccountMiddleware::MAIN_CONTRACTOR_TYPE, AccountMiddleware::SUBCONTRACTOR_TYPE);
$admin_type = AccountMiddleware::ADMIN_TYPE;

Procedure::registerActions(
    //Check if contractors and subcontractors have access to the document
    //Always allow admin access
    "documentCheckOwnership", [
        function ($a) use ($allowed_account_types, $admin_type) {
            AccountMiddleware::ifIsATypeOf(array_merge($allowed_account_types,$admin_type), function($a) use ($allowed_account_types) {
                DocumentMiddleware::fetchDocument(Procedure::getData("key")($a), Procedure::getData("value")($a))($a);
                AccountMiddleware::ifIsATypeOf($allowed_account_types, function($a) {
                    DocumentMiddleware::checkDocumentOwnershipById()($a);
                }, onlyCallbackOnTrue:true)($a);
            }, onlyCallbackOnTrue:true)($a);
        },
    ]
);

Procedure::registerActions(
    "verifyApproverWithLevel", [
        UserMiddleware::loadUserAccountRoles('user.id', 'user_roles'),
        function ($shape) {
            $shape->set('isApprovalLevel', !is_null($shape->get('order_approval.approval_level_workflow_id')));
            $entity = [
                'entity_type' => 'document',
                'entity_id' => $shape->get("uriArgs.did")
            ];
            $shape->set('entity', $entity);
        },
        Conditional::isTrue('isApprovalLevel', [
            ApprovalMiddleware::fetchApprovalLevelWorkflowByEntity('entity', 'approval_level_workflow_by_entity'),
            function ($shape) {
                $data = $shape->getCollection('approval_level_workflow_by_entity');
                $inProgressWorkflow = $data->filterByField('status', 'in_progress')->first();
                $metaData = json_decode($inProgressWorkflow->get('meta'), true);
                if (!in_array($shape->get('user_roles.account_role_id'), $metaData['roles'])) {
                    throw new MiddlewareException("forbidden", "You do not have the required role at the current in-progress approval level to approve or reject this order.");
                }
            },
        ], true)
    ]
);
