<?php
declare(strict_types=1);

namespace App\Application\Actions\Tender;

use Psr\Http\Message\ResponseInterface as Response;
use Psr\Http\Message\ServerRequestInterface as Request;
use Psr\Log\LoggerInterface;

use App\Application\Actions\Action;
use App\Application\Actions\ActionPayload;
use App\Domain\Project\ProjectRepository;
use App\Infrastructure\Persistence\S3;

/**
 * Class ProjectAction
 * @package App\Application\Actions\Project
 */
class TenderAction extends Action
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
  public function __construct (LoggerInterface $logger, ?ProjectRepository $repository = null)
  {
    parent::__construct($logger);
    $this->repository = $repository ?? new ProjectRepository();
  }

  /**
   * @param Request $request
   * @param Response $response
   * @param array $args
   * @return Response
   * @throws \Exception
   */
  public function listTender(Request $request, Response $response, array $args): Response
  {
        $params = $request->getQueryParams();

        $sortBy     = $params['sortBy'] ?? '';
        $sortByType = $params['sortByType'] ?? 'DESC';
        if(isset($params['sortBy'])){
            unset($params['sortBy'], $params['sortByType']);
        }

        $ids = [];
        if(isset($params['ids'])){
            $ids = explode(",", str_replace(["[","]"], "", $params["ids"]));
            unset($params['ids']);
        }

        $model = $this->repository->getModel("tender")
                ->select(['project.*', 'project.author_id as project_creator', 'project.created_at as pca', 'tender.*', 'tender_history.*', 'tender_history.created_at as ca','tender.id as tid'])
                ->leftJoin('tender_history', 'tender.id', '=', 'tender_id')
                ->join('project', 'tender.project_id', '=', 'project.id')
                ->where($params);

        if($ids){
            $model->whereIn('project_id', $ids);
        }

        if($sortBy){
            $model->orderBy(sprintf("tender_history.%s", $sortBy), $sortByType);
        }

    if($model->exists()){
        $history = $this->repository->aggregateTenderHistory($model);
      return $this->respond(
        $response,
        new ActionPayload(200, $history)
      );
    }
    return $this->notFound($response);
  }

  /**
   * GET /v1/tender/labels?ids=1,2,3
  */
  public function getTenderLabels(Request $request, Response $response, array $args): Response
  {
      $params = $request->getQueryParams();

      if (!isset($params['ids'])) {
          return $this->badRequest($response, "Missing 'ids' parameter");
      }

      $tenderIds = explode(",", str_replace(["[", "]"], "", $params['ids']));

      $tenders = $this->repository->getModel("tender")
          ->select(['id', 'label'])
          ->whereIn('id', $tenderIds)
          ->get()
          ->toArray();

      return $this->respond(
          $response,
          new ActionPayload(200, $tenders)
      );
  }

    /**
     * @param Request $request
     * @param Response $response
     * @param array $args
     * @throws \Exception
     */
  public function toggleArchived(Request $request, Response $response, array $args) {
      list("tid" => $tid, "sid" => $sid) = $args;
      $archive = ["tender_id" => $tid, "specialist_id" => $sid];
      $model = $this->repository->getModel("tenderHistoryArchive");
      $record = $model->where($archive);
      if($record->exists()) {
          $record->delete();
      }
      else {
          $model->store($archive);
      }
      return $this->noContent($response);
  }

    /**
     * @param Request $request
     * @param Response $response
     * @param array $args
     * @return Response
     * @throws \Exception
     */
  public function getDependency(Request $request, Response $response, array $args): Response {
      $tid = (int)$args["id"];
      $params = $request->getQueryParams();
      if(!isset($params['type'])){
          $params['type'] = 'parent';
      }
      $model = $this->repository->getModel("tender")->where(["tender.id" => (int) $args["id"]]);
      if($model->exists()) {
          if($params['type'] === 'parent') {
              $result = $this->repository->getDependenciesParentsByTenderId($tid);
          }
          else{
              $result = $this->repository->getDependenciesChildrenByTenderId($tid);
          }
          return $this->respond(
              $response,
              new ActionPayload(200,  $result ?? [])
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
  public function mapDependency(Request $request, Response $response, array $args): Response {
      $tid = (int)$args["id"];
      $data = $this->getData();

      if(!array_filter($data)){
          //delete all existing mapped depedencies
          $dependencyModel = $this->repository->getModel("tenderDependency")->where(["tender_id" => $tid]);
          if ( $dependencyModel->exists() ) {
            $dependencyModel->delete();
          }
          return $this->noContent($response);
      }

      //check for conflicts
      foreach ($data as $data_key => $dependency) {
          if($this->repository->checkDepedencyConfict($tid, $dependency['tender_id'])){
              unset($data[$data_key]);
          }
      }
      if($data) {
          //delete all existing mapped depedencies
          $dependencyModel = $this->repository->getModel("tenderDependency")->where(["tender_id" => $tid]);
          if ( $dependencyModel->exists() ) {
              $dependencyModel->delete();
          }
          //mapp new depedencies
          foreach ($data as $dependency) {
              $dependency['tender_parent_id'] = $dependency['tender_id'];
              $dependency['tender_id'] = $tid;
              $this->repository->getModel("tenderDependency")->store($dependency);
              $this->repository->createDependencyParent($dependency);
          }
          return $this->noContent($response);
      }

      return $this->badRequest($response);
  }


    /**
     * @param Request $request
     * @param Response $response
     * @param array $args
     * @return Response
     * @throws \Exception
     */
  public function listTenderById(Request $request, Response $response, array $args): Response {

      $model = $this->repository->getModel("tender")
          ->select(['project.*', 'transaction.*', 'project.author_id as project_creator', 'project.created_at as pca', 'tender.*', 'tender_history.*', 'tender_history.created_at as ca','tender.id as tid'])
          ->leftJoin('tender_history', 'tender.id', '=', 'tender_id')
          ->leftJoin('transaction', 'tender.id', '=', 'transaction.tender_id')
          ->join('project', 'tender.project_id', '=', 'project.id')
          ->where(["tender.id" => (int) $args["id"]]);

      if($model->exists()){
          $history = $this->repository->aggregateTenderHistory($model);
          $res = array_shift($history);
          $tender = $res["tender"];
          unset($res["tender"]);
          $tender["project"] = $res;
          return $this->respond(
              $response,
              new ActionPayload(200, $tender)
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
   *
   * Get list of tender history based on history id
   * The scope of this function is to provide a way to retrieve tender history information
   * as is needed for tokens analytics service
   */
  public function listTenderHistory(Request $request, Response $response, array $args): Response {

    $params = $request->getQueryParams();

    $model = $this->repository->getModel("tenderHistory")
      ->select(['tender_history.*', 'project.name', 'project.slug as project_slug', 'project.id as project_id',  'tender.label'])
      ->leftJoin('tender', 'tender_history.tender_id', '=', 'tender.id')
      ->join('project', 'tender.project_id', '=', 'project.id');

    if(isset($params['id'])) {
      $ids = explode(",", str_replace(["[", "]"], "", $params['id']));
      $model->whereIn("tender_history.id", $ids);
      unset($params['id']);
    }
    if(isset($params['created_at'])) {
      $model->whereDate("tender_history.created_at", $params['created_at']);
      unset($params['created_at']);
    }
    if(isset($params['created_start_date'])) {
      $model->whereDate("tender_history.created_at", ">=", $params['created_start_date']);
      unset($params['created_start_date']);
    }

    $aids = [];
    if(isset($params['author_ids'])){
        $aids = explode(",", str_replace(["[","]"], "", $params["author_ids"]));
        unset($params['author_ids']);
    }

    $tenderIds = [];
    if(isset($params['tender_ids'])){
        $tenderIds = explode(",", str_replace(["[","]"], "", $params["tender_ids"]));
        unset($params['tender_ids']);
    }

    $model->where($params);

    if($aids){
        $model->whereIn('tender_history.author_id', $aids);
    }

    if($tenderIds){
        $model->whereIn('tender_history.tender_id', $tenderIds);
    }

    $history = $model->get()->toArray();

    return $this->respond(
      $response,
      new ActionPayload(200, $history)
    );
  }

  /**
   * @param Request $request
   * @param Response $response
   * @param array $args
   * @return Response
   * @throws \App\Domain\DomainException
   */
  public function getTendersByProjects(Request $request, Response $response, array $args = []): Response
  {
    $pids = explode(",", str_replace(["[", "]"], "", $args["pids"]));
    $idStateSuggestion = 0;
    $tenders = $this->repository->getModel('tender')
    ->where("state", '!=', $idStateSuggestion)->whereIn("project_id", $pids);
    return $this->respond(
      $response,
      new ActionPayload(200, $tenders->get()->toArray())
    );
  }


/**
 * Get all the Quote Files for a tender from S3
   * @param Request $request
   * @param Response $response
   * @param array $args
   * @return Response
   * @throws \App\Domain\DomainException
 */
  public function getTenderQuoteFiles(Request $request, Response $response, array $args): Response {

    $tid = (int)$args["tid"];
    $tender   = $this->repository->getModel("tender")->with("project")->with("packages")->with('transaction')->where("id", $tid)->first();
    $responseData = [];
    if($tender) {
      $files = S3::listDirectory(
        S3::getBucketDestination(sprintf('%s/tenders/%s/transactions/quotes/', $tender->project_id, $tid))
      );
      foreach ($tender->transaction as $transaction) {
        $transactionFiles = S3::listDirectory(
          S3::getBucketDestination(sprintf('%s/tenders/%s/transactions/%s/quotes/', $tender->project_id, $tid, $transaction->id))
        );
        $files = array_values(array_unique(array_merge($files, $transactionFiles)));
      }

      $quotes = [];
      if($files) {
        foreach($files as  $file) {
          $sid = pathinfo($file, PATHINFO_FILENAME);
          $quotes[$sid] = $file;
        }
      }

      $responseData = [
          "package" => $tender->toArray(),
          "quotes"  => $quotes
        ];
    }

    return $this->respond(
      $response,
      new ActionPayload(200, $responseData)
    );
  }
}
