<?php
declare(strict_types=1);

namespace App\Application\Actions\Role;

use App\Application\Actions\Action;
use App\Application\Actions\ActionPayload;
use App\Domain\Account\AccountRepository;
use Psr\Log\LoggerInterface;
use Psr\Http\Message\ResponseInterface as Response;
use Psr\Http\Message\ServerRequestInterface as Request;

class AccountRoleAction extends Action
{
    /**
     * Default content type
     * @var string
     */
    protected $defaultContentType = "application/json";

    /**
     * Constructor
     */
    public function __construct(LoggerInterface $logger)
    {
        parent::__construct($logger);
        $this->repository = new AccountRepository();
    }

    public function fetchAction(Request $request, Response $response, array $args): Response
    {
        try {
            $account_id = (int) ($args['account_id'] ?? 0);

            if (!$account_id) {
                return $this->badRequest($response);
            }

            $params = $request->getQueryParams();
            $user_type = (string) ($params['user_type'] ?? '');
            $user_type_id = (int) ($params['user_type_id'] ?? 0);

            $results = $this->repository->listAccountRolesWithPermissions($account_id, $user_type, $user_type_id);

            return $this->respond(
                $response,
                new ActionPayload(200, $results)
            );
        } catch (\Exception $e) {
            return $this->respond($response, new ActionPayload(400, [
                "error" => $e->getMessage()
            ]));
        }
    }

    public function fetchByIds(Request $request, Response $response, array $args): Response
    {
        try {
            $params = $request->getQueryParams();
            $ids = isset($params['account_role_ids']) ? explode(',', $params['account_role_ids']) : [];

            $results = $this->repository->getModel("account_role")->getWhereIn("id", $ids);

            return $this->respond(
                $response,
                new ActionPayload(200, $results)
            );
        } catch (\Exception $e) {
            return $this->respond($response, new ActionPayload(400, [
                "error" => $e->getMessage()
            ]));
        }
    }

    public function createAction(Request $request, Response $response, array $args): Response
    {
        try {
            $account_id = $args['account_id'] ?? 0;

            $body = $request->getBody()->getContents();
            $data = json_decode($body, true);

            $user_type_id = $data['user_type_id'] ?? null;
            $label = $data['label'] ?? null;
            $description = $data['description'] ?? null;
            $permissionIds = $this->extractPermissionIds($data['permissions'] ?? $data['permission_ids'] ?? []);

            if (!$account_id || empty($user_type_id) || empty($label))  {
                return $this->badRequest($response);
            }

            $statusCode = 400;
            $payloadData = ["error" => "Failed to create account role"];

            $account_role = $this->repository->getModel('account_role');
            if ($account_role && $account_role->labelExistsForAccount((int) $account_id, $label, null)) {
                $payloadData = ["error" => "A role with this name already exists for this account"];
            } elseif ($account_role) {
                $savedRole = $this->repository->getModel('account_role')->save([
                    'account_id' => (int) $account_id,
                    'role_id' => (int) $user_type_id,
                    'label' => $label,
                    'description' => $description
                ]);

                $roleId = (int) $savedRole->getId();
                $this->repository->replaceAccountRolePermissions($roleId, $permissionIds);

                $roleData = $this->repository->getAccountRoleWithPermissions($roleId);
                $statusCode = 200;
                $payloadData = $roleData ?? ['status' => 'success'];
            }

            return $this->respond($response, new ActionPayload($statusCode, $payloadData));
        } catch (\Exception $e) {
            return $this->respond($response, new ActionPayload(400, [
                "error" => $e->getMessage()
            ]));
        }
    }

    public function updateAction(Request $request, Response $response, array $args): Response
    {
        try {
            $account_id = (int) ($args['account_id'] ?? 0);
            $id = (int) ($args['id'] ?? 0);

            $body = $request->getBody()->getContents();
            $data = json_decode($body, true);

            $user_type_id = (int) ($data['user_type_id'] ?? 0);
            $label = $data['label'] ?? '';
            $description = $data['description'] ?? '';
            $permissionIds = $this->extractPermissionIds($data['permissions'] ?? $data['permission_ids'] ?? []);

            $statusCode = 200;
            $payloadData = ['status' => 'success'];

            if(($account_id == 0) || ($user_type_id == 0) || ($label == '') || ($id == 0)) {
                $statusCode = 400;
                $payloadData = ['error' => 'Bad Request'];
            } else {
                $account_role = $this->repository->getModel('account_role')->load($id, 'id');

                if (!$account_role->isLoaded()) {
                    $statusCode = 404;
                    $payloadData = [
                        "error" => "Account Role not found"
                    ];
                } elseif ($this->isDuplicateLabelForUpdate($account_id, $label, $id)) {
                    $statusCode = 400;
                    $payloadData = [
                        "error" => "A role with this name already exists for this account"
                    ];
                } else {
                     $account_role->save([
                        'account_id' => (int) $account_id,
                        'role_id' => (int) $user_type_id,
                        'label' => $label,
                        'description' => $description
                    ]);

                    $this->repository->replaceAccountRolePermissions($id, $permissionIds);

                    $roleData = $this->repository->getAccountRoleWithPermissions($id);
                    $payloadData = $roleData ?? ['status' => 'success'];
                }
            }

            return $this->respond($response, new ActionPayload($statusCode, $payloadData));
        } catch (\Exception $e) {
            return $this->respond($response, new ActionPayload(400, [
                "error" => $e->getMessage()
            ]));
        }
    }

    public function deleteAction(Request $request, Response $response, array $args): Response
    {
        try {
            $account_id = (int) ($args['account_id'] ?? 0);
            $id = (int) ($args['id'] ?? 0);

            if (!$account_id || !$id) {
                return $this->respond($response, new ActionPayload(400, [
                    "error" => "Bad Request"
                ]));
            }

            $deleted = $this->repository->deleteAccountRoleById($account_id, $id);

            $payload = $deleted
                ? new ActionPayload(200, ['status' => 'success'])
                : new ActionPayload(400, ["error" => "Unable to delete account role"]);

            return $this->respond($response, $payload);
        } catch (\Exception $e) {
            return $this->respond($response, new ActionPayload(400, [
                "error" => $e->getMessage()
            ]));
        }
    }

    public function fetchUsersAction(Request $request, Response $response, array $args): Response
    {
        try {
            $account_id = $args['account_id'] ?? 0;
            $account_role_id = $args['account_role_id'] ?? 0;
            $params = $request->getQueryParams();
            $project_group_id = $params['project_group_id'] ?? 0;
            $exclude_user_id = $params['exclude_user_id'] ?? 0;

            $results = $this->repository->listUsersActions($account_id , $account_role_id , $project_group_id, $exclude_user_id);

            return $this->respond(
                $response,
                new ActionPayload(200, $results)
            );
        } catch (\Exception $e) {
            return $this->respond($response, new ActionPayload(400, [
                "error" => $e->getMessage()
            ]));
        }
    }

    /**
     * Check if a label is already used by another role for the same account.
     * Excludes the role being updated from the check to allow updating with the same name.
     *
     * @param int $accountId
     * @param string $label
     * @param int $currentRoleId The ID of the role being updated (used to exclude from check)
     * @return bool True if another role with this label exists, false otherwise
     */
    private function isDuplicateLabelForUpdate(int $accountId, string $label, int $currentRoleId): bool
    {
        $account_role = $this->repository->getModel('account_role');
        return $account_role && $account_role->labelExistsForAccount($accountId, $label, $currentRoleId);
    }

    /**
     * @param array<int, mixed> $permissions
     * @return array<int, int>
     */
    private function extractPermissionIds(array $permissions): array
    {
        $permissionIds = [];

        foreach ($permissions as $permission) {
            if (is_array($permission)) {
                if (isset($permission['permission_id'])) {
                    $permissionIds[] = (int) $permission['permission_id'];
                    continue;
                }

                if (isset($permission['id'])) {
                    $permissionIds[] = (int) $permission['id'];
                    continue;
                }
            }

            $permissionIds[] = (int) $permission;
        }

        return array_values(array_filter(array_unique($permissionIds)));
    }

}
