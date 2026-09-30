<?php
declare(strict_types=1);

namespace App\Application\Actions\Role;

use App\Application\Actions\Action;
use App\Application\Actions\ActionPayload;
use App\Domain\User\RoleRepository;
use Psr\Log\LoggerInterface;
use Psr\Http\Message\ResponseInterface as Response;
use Psr\Http\Message\ServerRequestInterface as Request;

class RoleAction extends Action
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

        $this->repository = new RoleRepository();
    }

    /**
     * GET /roles/roles-level
     * Returns all roles with their level values
     */
    public function getRoleLevel(Request $request, Response $response, array $args): Response
    {
        $roles = $this->repository->getRolesWithLevel();
        return $this->respond(
            $response,
            new ActionPayload(200, $roles)
        );
    }
}
