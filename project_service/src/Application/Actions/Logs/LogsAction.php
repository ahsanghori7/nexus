<?php
declare(strict_types=1);

namespace App\Application\Actions\Logs;

use App\Application\Actions\Action;
use App\Application\Actions\ActionPayload;
use App\Domain\Logs\LogsRepository;
use Psr\Http\Message\ResponseInterface as Response;
use Psr\Http\Message\ServerRequestInterface as Request;
use Psr\Log\LoggerInterface;

class LogsAction extends Action
{
    /** @var LogsRepository */
    protected $repository;

    public function __construct(LoggerInterface $logger, LogsRepository $repository)
    {
        parent::__construct($logger);
        $this->repository = $repository;
    }

    /**
     * @param Request $request
     * @param Response $response
     * @param array $args
     * @return Response
     */
    public function bulkCreate(Request $request, Response $response, array $args): Response
    {
        $records = $this->getData("records", []);
        if (!$records || !is_array($records)) {
            return $this->badRequest($response);
        }

        return $this->respond($response, new ActionPayload(200, $this->repository->bulkCreate($records)));
    }
}
