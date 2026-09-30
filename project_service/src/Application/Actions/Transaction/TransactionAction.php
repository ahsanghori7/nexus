<?php
declare(strict_types=1);

namespace App\Application\Actions\Transaction;

use Psr\Http\Message\ResponseInterface as Response;
use Psr\Http\Message\ServerRequestInterface as Request;
use Psr\Log\LoggerInterface;

use App\Infrastructure\Persistence\S3;
use App\Infrastructure\Environment as Env;
use App\Application\Actions\Action;
use App\Application\Actions\ActionPayload;
use App\Domain\Project\ProjectRepository;
use Slim\Psr7\UploadedFile;
use ZipArchive;

/**
 * Class TransactionAction
 * @package App\Application\Actions\Transaction
 */
class TransactionAction extends Action
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
        return $this->listByModel($response, "transactionType");
    }

    /**
     * @param Request $request
     * @param Response $response
     * @param array $args
     * @return Response
     * @throws \Exception
     */
    public function listTransactionById(Request $request, Response $response, array $args): Response
    {
        $transaction = $this->repository
            ->getModel('transaction')
            ->with("tender")
            ->with('quote')
            ->where(["transaction.id" => (int)$args["id"]]);

        if ($transaction->exists()) {
            return $this->respond(
                $response,
                (new ActionPayload(200, $transaction->get()->toArray()))
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
    public function listTransactionByIds(Request $request, Response $response, array $args): Response
    {
        $ids = explode(",", str_replace(["[","]"], "", $args["ids"]));
        $transactions = $this->repository
            ->getModel('transaction')
            ->with("tender")
            ->whereIn("transaction.tender_id", $ids);
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
     * @throws \Exception
     */
    public function listTransaction(Request $request, Response $response, array $args): Response
    {
        $transactions = $this->repository
            ->getModel('transaction')
            ->with("tender")
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
    public function create(Request $request, Response $response, array $args=[]): Response
    {
        $transaction = $this->repository->getModel("transaction");
        $data = $this->getData();
        $data['tender_id'] = $args['tid'];
        if (isset($data['price']) && empty($data['forecast'])) {
            $data['forecast'] = $data['price'];
        }
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
     */
    public function addFile(Request $request, Response $response, array $args): Response
    {

        $quote_file = $_FILES['file'] ?? [];
        $data = $request->getParsedBody();

        /**
         * Store the file to aws if the quote has one
         */
        if ($quote_file) {

            $tempZipDir = Env::getValue("TEMP_ZIP_DIRECTORY");
            $tempFilesDir = Env::getValue("TEMP_FILES_DIRECTORY");

            $zipName = $data['subcontractor_id'] . ".zip";
            if (!isset($data['qid'])) {
                return $this->badRequest($response, 'Missing transaction id (qid)');
            }
            $qid = (int)$data['qid'];

            $pathZip = $tempZipDir . "/" . $zipName;
            $pathFilesSubcontractor = $tempFilesDir . "/" . $data['subcontractor_id'];

            S3::transactionUnzipFiles((int)$data['pid'], (int)$data['tid'], $zipName, $pathZip, $pathFilesSubcontractor, $qid);

            $zip = new ZipArchive;
            $res = $zip->open($pathZip, ZIPARCHIVE::CREATE);

            if ($res === true) {
                $zip->addFile($quote_file['tmp_name'], $quote_file['name']);
                $zip->close();
            }

            $zipFile = new UploadedFile(
                $pathZip,
                $zipName,
                'application/zip',
                filesize($pathZip),
                0,
                false
            );

            S3::upload($zipFile, (int)$data['pid'], (int)$data['tid'], $qid);
            S3::transactionClearTempFiles($pathZip, $pathFilesSubcontractor);

            try {
                $s3Key = S3::uploadTransactionDocument($quote_file['tmp_name'], $quote_file['name'], $qid);
                $this->repository->replaceTransactionDocument($qid, $quote_file['name'], $s3Key);
            } catch (\Exception $e) {
                // Dual-write: the zip above stays the authoritative copy, so a
                // failed per-file capture must not fail the upload.
                $this->logger->error("Quote document capture failed for transaction $qid: " . $e->getMessage());
            }

            return $this->noContent($response);
        }

        return $this->badRequest($response);
    }

    /**
     * Fetch multiple transactions by their transaction.id
     *
     * Example: GET /v1/transaction/transactions/3,2,1,9
    */
    public function listTransactionsByTransactionIds(Request $request, Response $response, array $args): Response
    {
        $ids = explode(",", str_replace(["[", "]"], "", $args["ids"]));

        $transactions = $this->repository
            ->getModel('transaction')
            ->with("tender")
            ->whereIn("transaction.id", $ids);

        if ($transactions->exists()) {
            return $this->respond(
                $response,
                (new ActionPayload(200, $transactions->get()->toArray()))
            );
        }

        return $this->notFound($response);
    }

}
