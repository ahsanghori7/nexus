<?php
declare(strict_types=1);

namespace App\Application\Actions\Role;

use App\Application\Actions\Action;
use App\Application\Actions\ActionPayload;
use App\Domain\Account\AccountRepository;
use Psr\Log\LoggerInterface;
use Psr\Http\Message\ResponseInterface as Response;
use Psr\Http\Message\ServerRequestInterface as Request;
use App\Application\Actions\ActionError;
use Exception;

class AccountRoleUserMappingAction extends Action
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
        $this->repository = new \App\Domain\Account\AccountRepository();
    }

    public function updateAccountRoleAction(Request $request, Response $response, array $args): Response
    {
        try {
            $user_id = (int) $args['user_id'];
            $body = $request->getBody()->getContents();
            $data = json_decode($body, true);
            $role_id = (int) $data['role_id'];

            if (!$user_id || !$role_id) {
                return $this->badRequest($response);
            }

            $updated = $this->repository->updateAccountRoleMapping($user_id, $role_id);

            if($updated) {
                return $this->respond(
                    $response,
                    new ActionPayload(200, ['status' => 'success'])
                );
            }

            throw new \Exception("Could not update user role.");

        } catch (\Exception $e) {
            return $this->respond($response, new ActionPayload(400, [
                "error" => $e->getMessage()
            ]));
        }
    }

    public function deleteAccountRoleAction(Request $request, Response $response, array $args): Response
    {
        try {
            $user_id = (int) $args['user_id'];

            if (!$user_id) {
                return $this->badRequest($response);
            }

            $this->repository->deleteAccountRoleMapping($user_id);

            return $this->respond(
                $response,
                new ActionPayload(200, ['status' => 'success'])
            );
        } catch (\Exception $e) {
            return $this->respond($response, new ActionPayload(400, [
                "error" => $e->getMessage()
            ]));
        }
    }
}
