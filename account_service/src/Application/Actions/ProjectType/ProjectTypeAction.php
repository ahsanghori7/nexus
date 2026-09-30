<?php
declare(strict_types=1);

namespace App\Application\Actions\ProjectType;

use Psr\Http\Message\ResponseInterface as Response;
use Psr\Http\Message\ServerRequestInterface as Request;
use Psr\Log\LoggerInterface;

use App\Application\Actions\Action;
use App\Application\Actions\ActionPayload;
use App\Domain\ProjectType\ProjectTypeRepository;

/**
 * Class TradeAction
 * @package App\Application\Actions\ProjectTypeAction
 */
class ProjectTypeAction extends Action
{
    /**
     * Default content type for account action data is json
     * @var string
     */
    protected $defaultContentType = "application/json";

    /**
     * AccountAction constructor.
     * @param LoggerInterface $logger
     */
    public function __construct(LoggerInterface $logger)
    {
        parent::__construct($logger);
        $this->repository = new ProjectTypeRepository();
    }

    /**
     * @param Request $request
     * @param Response $response
     * @param array $args
     * @return Response
     */
    public function getTypes(Request $request, Response $response, array $args): Response
    {
        return $this->listByModel($response, "projecttypeMapping", [
            'account_id' => (int)$args['id']
        ]);
    }

    /**
     * @param Request $request
     * @param Response $response
     * @param array $args
     * @return Response
     * @throws \App\Domain\DomainException
     * @throws \ReflectionException
     */
    public function updateTypes(Request $request, Response $response, array $args): Response
    {
        $this->repository->getModel('projecttypeMapping')->deleteWhere(['account_id' => (int) $args["id"]]);
        foreach($this->getData() as $type){
            $this->repository->getModel("projecttypeMapping")->save(['account_id' => (int)$args['id'], 'type_id' => (int)$type]);
        }
        return $this->noContent($response);
    }
}
