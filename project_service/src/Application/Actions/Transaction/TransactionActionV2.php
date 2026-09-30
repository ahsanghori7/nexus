<?php
declare(strict_types=1);

namespace App\Application\Actions\Transaction;

use App\Domain\AbstractRepository;
use App\Domain\Project\ProjectRepository;
use App\Domain\Transaction\TransactionRepository;
use Psr\Http\Message\ResponseInterface as Response;
use Psr\Http\Message\ServerRequestInterface as Request;
use App\Application\Actions\ActionPayload;
use Psr\Log\LoggerInterface;

/**
 * Class TransactionAction
 * @package App\Application\Actions\Transaction
 */
class TransactionActionV2 extends TransactionAction
{

    /**
     * @var AbstractRepository|ProjectRepository
     */
    protected AbstractRepository $projectRepository;

    /**
     * @codeCoverageIgnore
     * TransactionAction constructor.
     * @param LoggerInterface $logger
     */
    public function __construct(LoggerInterface $logger)
    {
        parent::__construct($logger);
        $this->repository        = new TransactionRepository();
        $this->projectRepository = new ProjectRepository();
    }

    /**
     * @param Request $request
     * @param Response $response
     * @param array $args
     * @return Response
     */
    public function listTransaction(Request $request, Response $response, array $args): Response
    {
        $transactions = $this->repository
            ->getModel('transaction')
            ->with("quote.itemMapping")
            ->with("document");

        $params = $request->getQueryParams();
        $where  = [];
        foreach(["id" => "transaction.id", "sid" => "transaction.subcontractor_id", "tid" => "transaction.tender_id"] as $k => $v ){
            if(isset($params[$k])){
                $where[$v] = $params[$k];
            }
        }
        if($where) {
            $transactions = $transactions->where($where);
        }

        return $this->respond(
            $response,
            (new ActionPayload(200, $transactions->get()->toArray()))
        );
    }

    /**
     * @param Request $request
     * @param Response $response
     * @param array $args
     * @return Response
     * @throws \App\Domain\DomainException
     */
    public function create(Request $request, Response $response, array $args=[]): Response
    {
        $transaction = $this->repository->getModel("transaction");
        $id = $transaction->store($this->getData())->getId();
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
     */
    public function handleTransactionItems(Request $request, Response $response, array $args): Response
    {
        $items          = $this->getData();
        $failed         = [];
        $newIds         = [];
        foreach($items as $item) {
            $quoteItemModel = $this->projectRepository->getModel("boqQuoteItem");
            $id        = $item["id"] ?? false;
            $boqItemId = $item["boq_item_id"] ?? false;
            if(!isset($item["transaction_id"])) {
                $item["transaction_id"] = $args['tid'];
            }
            try{
                if(!$boqItemId) {
                    throw new \Exception("Item Missing boq_item_id");
                }

                $prepped = $quoteItemModel->clean($item);
                if(!$id) {
                    $newIds[$boqItemId] = $quoteItemModel->store($prepped)->getId();
                }
                else {
                    $res = $quoteItemModel->where("id", "=", $id)->update($prepped);
                    if(!$res) {
                        throw new \Exception("Failed to update item");
                    }
                }
            }
            catch(\Exception $e) {
                $failed[str_replace(" ", "_", $e->getMessage())][] = $item;
            }
        }

        return $this->respond(
            $response,
            new ActionPayload(200, ["failed" => $failed, "ids" => $newIds])
        );
    }

    /**
     * @param Request $request
     * @param Response $response
     * @param array $args
     * @return Response
     * @throws \App\Domain\DomainException
     */
    public function addDocument(Request $request, Response $response, array $args): Response
    {
        $data = (array)$this->getData() + ['transaction_id' => (int)$args['tid']];

        if (empty($data['name']) || empty($data['s3_key'])) {
            return $this->badRequest($response, 'Missing required fields: name, s3_key');
        }

        $data['quote_version'] = (int)($data['quote_version'] ?? 1) ?: 1;

        $document = $this->repository->getModel("transactionDocument")->store($data);

        return $this->respond(
            $response,
            new ActionPayload(200, ['id' => $document->getId()])
        );
    }

    /**
     * @param Request $request
     * @param Response $response
     * @param array $args
     * @return Response
     * @throws \App\Domain\DomainException
     */
    public function deleteDocument(Request $request, Response $response, array $args): Response
    {
        $tid        = (int)$args['tid'];
        $transaction = $this->repository->getModel("transactionDocument");
        $transaction->deleteById($tid);
        return $this->respond(
            $response,
            new ActionPayload(200, ['success' => true])
        );
    }
}
