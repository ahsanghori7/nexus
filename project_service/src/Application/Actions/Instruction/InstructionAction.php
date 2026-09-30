<?php

declare(strict_types=1);

namespace App\Application\Actions\Instruction;

use Psr\Http\Message\ResponseInterface as Response;
use Psr\Http\Message\ServerRequestInterface as Request;
use Psr\Log\LoggerInterface;
use App\Application\Actions\Action;
use App\Application\Actions\ActionPayload;
use App\Domain\Project\ProjectRepository;

/**
 * Class InstructionAction
 * @package App\Application\Actions\Instruction
 */
class InstructionAction extends Action
{

    /**
     * Default content type for account action data is json
     * @var string
     */
    protected $defaultContentType = "application/json";

    /**
     * @codeCoverageIgnore
     * AccountAction constructor.
     * @param LoggerInterface $logger
     */
    public function __construct(LoggerInterface $logger, ?ProjectRepository $repository = null)
    {
        parent::__construct($logger);
        $this->repository = $repository ?? new ProjectRepository();
    }

    /**
     * @codeCoverageIgnore
     * @param Request $request
     * @param Response $response
     * @param array $args
     * @return Response
     */
    public function listTypes(Request $request, Response $response, array $args): Response
    {
        return $this->listByModel($response, "instructionType");
    }

    /**
     * @codeCoverageIgnore
     * @param Request $request
     * @param Response $response
     * @param array $args
     * @return Response
     */
    public function listStatus(Request $request, Response $response, array $args): Response
    {
        return $this->listByModel($response, "instructionStatus");
    }


    /**
     * @param Request $request
     * @param Response $response
     * @param array $args
     * @return Response
     * @throws \Exception
     */
    public function listInstructionById(Request $request, Response $response, array $args): Response
    {

        $instruction = $this->repository
            ->getModel('instruction')
            ->select([
                'instruction.*',
                'transaction.price as order_value',
                'transaction.subcontractor_id as subcontractor_id',
                'tender.id as tid',
                'tender.project_id as pid',
                'tender.label as tender_label',
                'tender.budget as budget'
            ])
            ->join('transaction', 'instruction.transaction_id', '=', 'transaction.id')
            ->join('tender', 'transaction.tender_id', '=', 'tender.id')
            ->where(["instruction.id" => (int)$args["id"]]);

        if ($instruction->exists()) {
            return $this->respond(
                $response,
                (new ActionPayload(200, $instruction->first()->toArray()))
            );
        }

        return $this->notFound($response);
    }

    /**
     * @param Request $request
     * @param Response $response
     * @param array $args
     * @return Response
     * @throws \Exception
     */
    public function listInstruction(Request $request, Response $response, array $args): Response
    {
        $transactions = $this->repository
            ->getModel('instruction')
            ->where($request->getQueryParams());

        if ($transactions->exists()) {
            return $this->respond(
                $response,
                (new ActionPayload(200, $transactions->get()->toArray()))
            );
        }

        return $this->notFound($response);
    }

    /**
     * @param Request $request
     * @param Response $response
     * @param array $args
     * @return Response
     * @throws \App\Domain\DomainException
     */
    public function createInstruction(Request $request, Response $response, array $args = []): Response
    {
        $transaction = $this->repository->getModel("instruction");
        $data = $this->getData();
        $id = $transaction->store($data)->getId();
        return $this->respond(
            $response,
            new ActionPayload(200, ['id' => $id])
        );
    }

    /**
     * @param Request $request
     * @param Response $response
     * @param array $args
     * @return Response
     * @throws \Exception
     */
    public function updateInstructionById(Request $request, Response $response, array $args): Response
    {
        $instruction = $this->repository->getModel("instruction")->where("id", (int)$args["id"]);
        if ($instruction && $instruction->exists()) {
            $instruction->update($this->getData());
            return $this->noContent($response);
        }
        return $this->notFound($response);
    }

    /**
     * @param Request $request
     * @param Response $response
     * @param array $args
     * @return Response
     */
    public function deleteById(Request $request, Response $response, array $args): Response
    {
        $this->repository->getModel("instruction")->deleteById((int) $args["id"]);
        return $this->noContent($response);
    }
}
