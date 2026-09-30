<?php

declare(strict_types=1);

namespace App\Application\Actions\Project;

use App\Infrastructure\Persistence\S3;
use App\Infrastructure\Environment as Env;
use Psr\Http\Message\ResponseInterface as Response;
use Psr\Http\Message\ServerRequestInterface as Request;
use Psr\Log\LoggerInterface;

use App\Application\Actions\Action;
use App\Application\Actions\ActionPayload;
use App\Domain\Project\ProjectRepository;
use App\Domain\Project\PartnerCatalogue\PartnerLinkConflict;
use App\Domain\Project\PartnerCatalogue\PartnerProjectCatalogueRepository;
use Slim\Psr7\UploadedFile;
use ZipArchive;

/**
 * Class ProjectAction
 * @package App\Application\Actions\Project
 */
class ProjectAction extends Action
{

  public const PROJECT_ERRORS = [
    'name' => 'Project name already exists',
    'create_failed' => 'Failed to create the project',
    'catalogue_not_found' => 'The selected Partner project could not be found',
    'catalogue_not_authorised' => 'The selected Partner project is not available for this account',
    'catalogue_linked' => 'The selected Partner project is already linked to a C-Link project',
    'catalogue_name_too_long' => 'The Partner project name is too long for a C-Link project'
  ];

  /** Mirrors the `project`.`name` column width. */
  public const PROJECT_NAME_MAX_LENGTH = 150;

  public const TENDER_SUGGESTED_ID = 0;
  public const TENDER_DRAFT_ID = 1;
  public const TENDER_PUBLISHED_ID = 2;

  private const PROCUREMENT_SELECT_COLUMNS = [
    'project.*', 'project.created_at as pca', 'tender.*', 'tender_history.*', 'tender_history.created_at as ca', 'tender.id as tid'
  ];

  /**
   * Default content type for account action data is json
   * @var string
   */
  protected $defaultContentType = "application/json";

  /**
   * @var PartnerProjectCatalogueRepository
   */
  private $partnerCatalogueRepository;

  /**
   * @codeCoverageIgnore
   * ProjectAction constructor.
   * @param LoggerInterface $logger
   * @param ProjectRepository|null $repository
   * @param PartnerProjectCatalogueRepository|null $partnerCatalogueRepository
   */
  public function __construct(
    LoggerInterface $logger,
    ?ProjectRepository $repository = null,
    ?PartnerProjectCatalogueRepository $partnerCatalogueRepository = null
  ) {
    parent::__construct($logger);
    $this->repository = $repository ?? new ProjectRepository();
    $this->partnerCatalogueRepository = $partnerCatalogueRepository ?? new PartnerProjectCatalogueRepository();
  }

  /**
   * @param Request $request
   * @param Response $response
   * @param array $args
   * @return Response
   * @throws \Exception
   */
  public function deleteTransactionById(Request $request, Response $response, array $args): Response
  {
    $this->repository->getModel('transaction')->deleteBy(['id' => $args["tid"]]);
    return $this->noContent($response);
  }

  /**
   * @param Request $request
   * @param Response $response
   * @param array $args
   * @return Response
   * @throws \Exception
   */
  public function updateTransaction(Request $request, Response $response, array $args): Response
  {
    $transaction = $this->repository->getModel("transaction")->load((int)$args["tid"]);
    if ($transaction && $transaction->exists()) {
      $price = (string)$transaction->getData('price');
      $data = $this->getData();
      $trData = $this->repository->getModel('tender_recommendation')->where('transaction_id', $args["tid"])->where('status', '!=', 'Cancelled')->first();
      // We need to check if the price is being updated and if the tender recommendation is still in draft state, if so we want to update the forecast value as well to reflect the change in price
      if ($price !== $data['price'] && (!$trData || $trData->getAttributes()['status'] === 'Draft')) {
        // If there is a price change we want to update the value of forecast as well
        $data['forecast'] = $data['price'];
      }
      $transaction->store($data);
      return $this->noContent($response);
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
  public function listTransactionByProjectId(Request $request, Response $response, array $args): Response
  {

    $pid = (int)$args['id'];
    $transaction = $this->repository
      ->getModel('transaction')
      ->with(['tender' => function ($query) use ($pid) {
        $query->where('project_id', $pid);
      }]);

    if ($transaction->exists()) {
      $results = array_filter($transaction->get()->toArray(), function ($t) {
        return !is_null($t['tender']);
      });

      return $this->respond(
        $response,
        (new ActionPayload(200, $results))
      );
    }
    return $this->notFound($response);
  }


  /**
   * @param Request $request
   * @param Response $response
   * @return Response
   */
  public function list(Request $request, Response $response): Response
  {
    $params = $request->getQueryParams();

    $query = false;
    if (isset($params["query"])) {
      $query = $params["query"];
      unset($params["query"]);
    }

    $aids = [];
    $team_member_ids = [];

    // --- Extract filters ---
    if (isset($params['author_ids'])) {
      $aids = explode(",", str_replace(["[", "]"], "", $params["author_ids"]));
      unset($params['author_ids']);
    } elseif (isset($params['group_ids'])) {
      $aids = explode(",", str_replace(["[", "]"], "", $params["group_ids"]));
      unset($params['group_ids']);
    } elseif (isset($params["project_team_members"])) {
      $team_member_ids = explode(",", str_replace(["[", "]"], "", $params["project_team_members"]));
      unset($params['project_team_members']);
    }

    // --- Base Model ---
    $model = $this->repository->getModel()->with(["tender", "tender.packages"]);


    // --- ID filter ---
    if (isset($params['id'])) {
      $ids = explode(",", str_replace(["[", "]"], "", $params['id']));
      $model->whereIn("project.id", $ids);
      unset($params['id']);
    }

    // --- Apply remaining params as where filters ---
    $project = $model->where($params);

    // --- Text search & author/group mapping combined ---
    if ($query || $aids) {
      $project->where(function ($q) use ($query, $aids) {
        if ($query) {
          $q->orWhere("name", "LIKE", "%{$query}%");
        }
        if ($aids) {
          $q->whereIn('author_id', $aids)
            ->orWhereIn('group_id', $aids);
        }
      });
    }

    // --- Filter by team member mapping ---
    if ($team_member_ids) {
      if (isset($params['author_id'])) {
        $project->orWhereHas('teamMemberRoleMapping', function ($q) use ($team_member_ids) {
          $q->whereIn('user_id', $team_member_ids);
        });
      } else {
        $project->whereHas('teamMemberRoleMapping', function ($q) use ($team_member_ids) {
          $q->whereIn('user_id', $team_member_ids);
        });
      }
      // Make sure we only get unique projects
      $project->select('project.*')->groupBy('project.id');
    }

    return $this->respond(
      $response,
      (new ActionPayload(200, $project->get()->toArray()))
    );
  }

  /**
   * @param Request $request
   * @param Response $response
   * @param array $args
   * @return Response
   * @throws \Exception
   */
  public function getById(Request $request, Response $response, array $args): Response
  {
    $data = $this->repository
      ->getModel()
      ->with("tender")
      ->where(["id" => (int) $args["id"]]);

    $results = $data->get()->toArray();
    if (count($results) > 0) {
      return $this->respond(
        $response,
        (new ActionPayload(200, $results[0]))
      );
    }

    return $this->notFound($response);
  }

  /*
   * @TODO these needs to not be hardcoded
   */
  public function constants(Request $request, Response $response, $args): Response
  {
    return $this->respond(
      $response,
      new ActionPayload(200, $this->repository->constants())
    );
  }

  /**
   * @param Request $request
   * @param Response $response
   * @param array $args
   * @return Response
   */
  public function deleteByGroupId(Request $request, Response $response, array $args): Response
  {
    $this->repository->getModel()->deleteBy(['group_id' => $args["id"]]);
    return $this->noContent($response);
  }


  /**
   * @param Request $request
   * @param Response $response
   * @param array $args
   * @return Response
   * @throws \Exception
   */
  public function create(Request $request, Response $response, array $args = []): Response
  {
    $data = $this->getData();
    if (!$data) {
      return $this->badRequest($response);
    }

    $catalogue = null;
    $catalogueId = (int) ($data['partner_project_catalogue_id'] ?? 0);
    if ($catalogueId > 0) {
      $catalogue = $this->partnerCatalogueRepository->findById($catalogueId);

      if (!$catalogue) {
        return $this->projectError($response, self::PROJECT_ERRORS['catalogue_not_found']);
      }

      // resolve which business-unit mappings account is authorised to use.
      $authorised = array_map('intval', (array) ($data['authorised_business_unit_mapping_ids'] ?? []));
      if (!$authorised || !in_array((int) $catalogue->group_id, $authorised, true)) {
        return $this->projectError($response, self::PROJECT_ERRORS['catalogue_not_authorised']);
      }

      if (!empty($catalogue->c_link_project_id)) {
        return $this->projectError($response, self::PROJECT_ERRORS['catalogue_linked']);
      }

      // IFS owns the identity: overwrite whatever the browser posted.
      $data['name'] = (string) $catalogue->project_name;
      $data['reference'] = (string) $catalogue->project_code;

      if (mb_strlen($data['name']) > self::PROJECT_NAME_MAX_LENGTH) {
        return $this->projectError($response, self::PROJECT_ERRORS['catalogue_name_too_long']);
      }
    }

    // Not project columns.
    unset($data['partner_project_catalogue_id'], $data['authorised_business_unit_mapping_ids']);

    /**
     * Check to see if there is already a project with the same name
     */
    $existing = $this->repository->getModel()->load(trim($data['name'], ' '), "name");
    if ($existing->isLoaded()) {
      return $this->projectError($response, self::PROJECT_ERRORS['name']);
    }

    /**
     * Generate the slug based on the name
     */
    $data['slug'] = $this->repository->generateSlug($data['name']);

    try {
      // One unit of work: a failure must leave no project and an unlinked record.
      $id = (int) $this->repository->transaction(
        function () use ($data, $catalogue, $catalogueId): int {
          $id = (int) $this->repository->create($data);

          /**
           * Create entry to the project owner mapping
           */
          $this->repository->createProjectMapping(array(
            'project_id' => $id,
            'owner_id' => $data['group_id']
          ));


          // The IFS relationship lives on the catalogue record itself
          if ($catalogue && !$this->partnerCatalogueRepository->linkToProject($catalogueId, $id)) {
            throw new PartnerLinkConflict('Catalogue record already linked');
          }

          /**
           * Handle Asite integration if provided
           * Framework should pass provider_id in the request
           */
          if (isset($data['integration_id']) || isset($data['integration_name']) || isset($data['integration_uri'])) {
            // Get provider_id from request (framework resolves and passes it)
            $providerId = $data['provider_id'] ?? null;

            if (!$providerId) {
              // Log warning but don't fail - integration data will be ignored
              $this->logger->warning('Asite integration data provided but provider_id missing');
            } else {
              $this->repository->saveProjectIntegration($id, $providerId, [
                'integration_id' => $data['integration_id'] ?? null,
                'integration_name' => $data['integration_name'] ?? null,
                'integration_uri' => $data['integration_uri'] ?? null,
                'meta' => $data['meta'] ?? null
              ]);
            }
          }

          return $id;
        }
      );
    } catch (PartnerLinkConflict $e) {
      return $this->projectError($response, self::PROJECT_ERRORS['catalogue_linked']);
    } catch (\Throwable $e) {
      $this->logger->error('Project creation failed', [
        'partner_project_catalogue_id' => $catalogueId ?: null,
        'exception' => $e->getMessage(),
      ]);

      return $this->projectError($response, self::PROJECT_ERRORS['create_failed']);
    }

    return $this->respond(
      $response,
      new ActionPayload(200, array('status' => true, 'id' => $id))
    );
  }

  /**
   * @param Response $response
   * @param string $error
   * @return Response
   */
  private function projectError(Response $response, string $error): Response
  {
    return $this->respond(
      $response,
      new ActionPayload(200, ['status' => false, 'error' => $error])
    );
  }

  /**
   * @param Request $request
   * @param Response $response
   * @param array $args
   * @return Response
   * @throws \Exception
   */
  public function listPackages(Request $request, Response $response, array $args): Response
  {
    $params = $request->getQueryParams();
    $model = $this->repository->getModel("tender")->where("project_id", (int)$args["id"])->where($params);
    if ($model->exists()) {
      $data = $model->with("packages")->get()->toArray();
    }
    return $this->respond(
      $response,
      new ActionPayload(200, $data ?? [])
    );
  }


  /**
   * @param Request $request
   * @param Response $response
   * @param array $args
   * @return Response
   * @throws \Exception
   */
  public function updateTenderHistoryById(Request $request, Response $response, array $args): Response
  {
    $history = $this->repository->getModel("tenderHistory")->where("id", (int)$args["hid"]);
    if ($history && $history->exists()) {
      $history->update($this->getData());
      return $this->noContent($response);
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
  public function getTenderTransactionById(Request $request, Response $response, array $args): Response
  {
    $params = $request->getQueryParams();
    $model = $this->repository->getModel("tender")->where("id", (int)$args["tid"])
      ->with('transaction', function ($query) use ($params) {
        $query->where($params)->orderBy('quote_created', 'DESC');
      });

    if ($model->exists()) {
      return $this->respond(
        $response,
        new ActionPayload(200, $model->get()->toArray())
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
  public function getTenderHistoryById(Request $request, Response $response, array $args): Response
  {
    $params = $request->getQueryParams();
    $model = $this->repository->getModel("tender")->where("id", (int)$args["tid"])
      ->with('history', function ($query) use ($params) {
        $query
          ->where($params)
          ->orderBy('created_at', 'DESC')
          ->orderBy('id', 'DESC');
      });

    if ($model->exists()) {
      return $this->respond(
        $response,
        new ActionPayload(200, $model->get()->toArray())
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
  public function getLatestOrderHistoryByTenderIds(Request $request, Response $response, array $args): Response
  {
    $pid = (int)$args['id'];
    $tenderIds = array_values(array_filter(array_map(
      'intval',
      explode(',', str_replace(['[', ']'], '', $args['tids'] ?? ''))
    )));

    if (!$pid || !$tenderIds) {
      return $this->badRequest($response);
    }

    $rankedHistory = $this->repository->getModel('tenderHistory')
      ->selectRaw("
        tender_history.id,
        tender_history.tender_id,
        tender_history.specialist_id,
        tender_history.status_id,
        tender_history.meta,
        tender_history.created_at,
        tender_history.tender_history_type,
        tender_history_status.label as status,
        ROW_NUMBER() OVER (
          PARTITION BY tender_history.tender_id, tender_history.specialist_id
          ORDER BY tender_history.created_at DESC, tender_history.id DESC
        ) as rn
      ")
      ->join('tender', 'tender.id', '=', 'tender_history.tender_id')
      ->join('tender_history_status', 'tender_history.status_id', '=', 'tender_history_status.id')
      ->where('tender.project_id', $pid)
      ->where('tender_history.tender_history_type', 'Order')
      ->whereIn('tender_history.tender_id', $tenderIds);

    $rows = $this->repository->getModel('tenderHistory')
      ->fromSub($rankedHistory, 'ranked_history')
      ->select([
        'ranked_history.id',
        'ranked_history.tender_id',
        'ranked_history.specialist_id',
        'ranked_history.status_id',
        'ranked_history.meta',
        'ranked_history.created_at',
        'ranked_history.tender_history_type',
        'ranked_history.status',
      ])
      ->where('ranked_history.rn', 1)
      ->get()
      ->toArray();

    $data = [];
    foreach ($rows as $row) {
      $data[$row['tender_id']][$row['specialist_id']] = $row;
    }

    return $this->respond($response, new ActionPayload(200, $data));
  }

  /**
   * @param Request $request
   * @param Response $response
   * @param array $args
   * @return Response
   */
  public function deleteTenderHistoryById(Request $request, Response $response, array $args): Response
  {
    $history = $this->repository->getModel("tenderHistory")->where("id", (int)$args["hid"]);
    if ($history && $history->exists()) {
      $history->delete();
      return $this->noContent($response);
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
  public function getSummary(Request $request, Response $response, array $args): Response
  {
    $params = $request->getQueryParams();
    $pid = (int)$args["id"];

    $params['project_id'] = $pid;

    $project = $this->repository->getModel("project")->where(["id" => $pid]);
    if ($project->exists()) {
      $model = $this->repository->getModel("tender")
        ->select(['project.*', 'project.created_at as pca', 'tender.*', 'transaction.*', 'transaction.quote_created as qca', 'transaction.order_created as oca', 'tender.id as tid'])
        ->leftJoin('transaction', 'tender.id', '=', 'tender_id')
        ->join('project', 'tender.project_id', '=', 'project.id')
        ->where($params);

      return $this->respond(
        $response,
        new ActionPayload(200, $this->repository->getSummary($model))
      );
    }

    return $this->notFound($response);
  }

  /**
   * @param Request $request
   * @param Response $response
   * @param array $args
   * @return Response
   */
  public function getDashboardSummary(Request $request, Response $response, array $args): Response
  {
    $pid = (int)$args['id'];

    return $this->respond(
      $response,
      new ActionPayload(200, $this->repository->getProjectDashboardSummary($pid))
    );
  }

  /**
   * @param Request $request
   * @param Response $response
   * @param array $args
   * @return Response
   * @throws \Exception
   */
  public function  listTransactionsFiles(Request $request, Response $response, array $args): Response
  {
    $pid = (int)$args["id"];

    $project = $this->repository->getModel("project")->where(["id" => $pid]);
    if ($project->exists()) {

      $model = $this->repository->getModel('transaction')->getLatestQuotes($pid);
      $tenders = $this->repository->getModel('tender')->getTenderQuotes($pid, $model);

      $files = $this->repository->aggregateTenderTransactionFiles($tenders);

      return $this->respond(
        $response,
        new ActionPayload(200, $files)
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
  public function listTransactionDocuments(Request $_request, Response $response, array $args): Response
  {
    $pid = (int)$args["id"];

    $project = $this->repository->getModel("project")->where(["id" => $pid]);
    if ($project->exists()) {

      $documents = $this->repository->getTransactionDocumentsByProject($pid);

      return $this->respond(
        $response,
        new ActionPayload(200, $documents)
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
  public function listTransactions(Request $request, Response $response, array $args): Response
  {
    $params = $request->getQueryParams();
    $pid = (int)$args["id"];

    $filter_type = null;
    if (isset($params['type_id'])) {
      $filter_type = $params['type_id'];
      unset($params['type_id']);
    }

    $filter_status = null;
    if (isset($params['status_id'])) {
      $filter_status = $params['status_id'];
      unset($params['status_id']);
    }

    $project = $this->repository->getModel("project")->where(["id" => $pid]);
    if ($project->exists()) {

      $latestQuotes = $this->repository->getModel('transaction')->getLatestQuotes($pid);
      $tenders = $this->repository->getModel('tender')->getTenderQuotes($pid, $latestQuotes);
      $transaction = [];
      if ($tenders) {
        $transaction = $this->repository->aggregateTenderTransaction($tenders, $filter_status, $filter_type);
        if (isset($transaction[$pid])) {
          $project_data = $project->get()->toArray()[0];
          $transaction[$pid] = $project_data + $transaction[$pid];
        }
      }

      return $this->respond(
        $response,
        new ActionPayload(200, $transaction)
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
  public function listTenders(Request $request, Response $response, array $args): Response
  {
    $params = $request->getQueryParams();
    $pid = (int)$args["id"];

    $params['project_id'] = $pid;

    $project = $this->repository->getModel("project")->where(["id" => $pid]);
    if ($project->exists()) {
      $model = $this->repository->getModel("tender")
        ->select([
          'project.*',
          'project.author_id as project_creator',
          'project.created_at as pca',
          'tender.*',
          'tender_history.*',
          'tender_history.created_at as ca',
          'tender.id as tid',
          'tender_history_archive.id as archived'
        ])
        ->leftJoin('tender_history', 'tender.id', '=', 'tender_id')
        ->leftJoin('tender_history_archive', function ($j) {
          $j->on('tender.id', '=', 'tender_history_archive.tender_id');
          $j->on('tender_history.specialist_id', '=', 'tender_history_archive.specialist_id');
        })

        ->join('project', 'tender.project_id', '=', 'project.id')
        ->where($params);

      $history = $this->repository->aggregateTenderHistory($model);
      return $this->respond(
        $response,
        new ActionPayload(200, $history)
      );
    }

    return $this->notFound($response);
  }

  /**
   * @param Request $request
   * @param Response $response
   * @param array $args
   * @return Response
   */
  public function listTypes(Request $request, Response $response, array $args): Response
  {
    return $this->listByModel($response, "tenderHistoryType");
  }

  /**
   * @param Request $request
   * @param Response $response
   * @param array $args
   * @return Response
   * @throws \App\Domain\DomainException
   */
  public function createTenderHistory(Request $request, Response $response, array $args): Response
  {
    $model = $this->repository->getModel("tender")->where([
      "project_id" => (int)$args["id"],
      "id" => (int)$args["tid"],
    ]);

    if ($model->exists()) {
      $data = $this->getData();
      $data["tender_id"] = $args["tid"];
      $data["meta"] = $data["meta"] ?? "";
      $history = $this->repository->addTenderHistory($data);
      return $this->respond(
        $response,
        new ActionPayload(200, ['id' => $history->getId()])
      );
    }

    return $this->notFound($response);
  }

  /**
   * @param Request $request
   * @param Response $response
   * @param array $args
   * @return Response
   */
  public function bulkCreateTenderHistory(Request $request, Response $response, array $args): Response
  {
    $records = $this->getData("records", []);
    if (!$records || !is_array($records)) {
      return $this->badRequest($response);
    }

    $result = $this->repository->bulkAddTenderHistory((int)$args["id"], $records);

    return $this->respond(
      $response,
      new ActionPayload(200, $result)
    );
  }

  /***
   * @param Request $request
   * @param Response $response
   * @param array $args
   * @return Response
   */
  public function createTender(Request $request, Response $response, array $args): Response
  {
    $data = $this->getData();
    if ($data) {
      $label = $data["label"] ?? false;
      if ($label) {
        $packages = $data["packages"] ?? [];
        if (!is_array($packages)) {
          return $this->badRequest($response);
        }

        $group = $this->repository->createTender(
          (int)$args["id"],
          $label,
          $data,
          $packages
        );

        return $this->respond(
          $response,
          new ActionPayload(200, ['id' => $group->getId()])
        );
      }
    }
    return $this->badRequest($response);
  }

  /**
   * @param Request $request
   * @param Response $response
   * @param array $args
   * @return Response
   */
  public function bulkCreateTender(Request $request, Response $response, array $args): Response
  {
    $tenders = $this->getData("tenders", []);

    if (!$tenders || !is_array($tenders)) {
      return $this->badRequest($response);
    }

    $result = $this->repository->bulkCreateTender((int)$args["id"], $tenders);

    return $this->respond(
      $response,
      new ActionPayload(201, $result)
    );
  }

  public function bulkDeleteTender(Request $request, Response $response, array $args): Response
  {
    $tenderIds = $this->getData("tender_ids", []);

    if (!$tenderIds || !is_array($tenderIds)) {
      return $this->badRequest($response);
    }

    $this->repository->bulkDeleteTender((int)$args["id"], $tenderIds);

    return $this->noContent($response);
  }

  /**
   * @param Request $request
   * @param Response $response
   * @param array $args
   * @return Response
   * @throws \Exception
   */
  public function deleteTenderById(Request $request, Response $response, array $args): Response
  {
    $this->repository->getModel('tender')->deleteBy(['id' => $args["tid"]]);
    return $this->noContent($response);
  }

  /**
   * @param Request $request
   * @param Response $response
   * @param array $args
   * @return Response
   * @throws \Exception
   */
  public function togglePublishedState(Request $request, Response $response, array $args): Response
  {
    $data = $this->getData();
    $toggle = (bool)$data['toggle'] ? self::TENDER_PUBLISHED_ID : self::TENDER_DRAFT_ID;

    /*
       * We only need to change the state of tenders that are not suggested
       * as a suggested tender means that is not yet added to the project and is an action that
       * the main contractor should do
       */
    $tenders = $this->repository->getModel("tender")->where("project_id", (int)$args["id"])->where('state', '!=', self::TENDER_SUGGESTED_ID);
    $tenders->update(['state' => $toggle]);
    return $this->noContent($response);
  }

  /**
   * @param Request $request
   * @param Response $response
   * @param array $args
   * @return Response
   * @throws \Exception
   */
  public function updateTender(Request $request, Response $response, array $args): Response
  {
    $group = $this->repository->getModel("tender")->where("project_id", (int)$args["id"])->find((int)$args["tid"], ["id", "service", "start_on_site"]);
    if (!$group || !$group->exists()) {
      return $this->notFound($response);
    }

    $data = $this->getData();
    $mapping = $this->repository->getModel("package");
    $packages = $data["packages"] ?? null;

    if (array_key_exists("packages", $data)) {
      $this->syncTenderPackages($mapping, $group->getId(), $packages);
    }

    unset($data['packages']);

    $finalService = array_key_exists('service', $data) ? $data['service'] : $group->service;
    $finalStartOnSite = !empty($data['start_on_site'] ?? null) ? $data['start_on_site'] : $group->start_on_site;
    $data['status'] = $this->repository->resolveTenderStatus($finalService, $finalStartOnSite, !empty($packages));

    $tender = $this->repository->getModel("tender")->where('id', $group->getId());
    $tender->update($data);

    $updatedTender = $this->repository->getModel("tender")->where('id', $group->getId())->with('packages')->first();

    return $this->respond(
      $response,
      new ActionPayload(200, $updatedTender->toArray())
    );
  }

  /**
   * Syncs tender <-> package mappings. An empty $packages deletes all existing
   * mappings; otherwise only the delta between existing and new ids is applied.
   *
   * @param mixed $mapping
   * @param int $tenderId
   * @param array|null $packages
   * @return void
   */
  private function syncTenderPackages($mapping, int $tenderId, ?array $packages): void
  {
    if (empty($packages)) {
      $mapping::where('tender_id', $tenderId)->delete();
      return;
    }

    $existingPackageIds = $mapping::where('tender_id', $tenderId)->pluck('package_id')->map(fn($id) => (int)$id)->all();
    $newPackageIds = array_map('intval', $packages);

    $packagesToRemove = array_diff($existingPackageIds, $newPackageIds);
    $packagesToAdd = array_diff($newPackageIds, $existingPackageIds);

    if ($packagesToRemove) {
      $mapping::where('tender_id', $tenderId)->whereIn('package_id', $packagesToRemove)->delete();
    }
    if ($packagesToAdd) {
      $mapping::insert(array_map(fn($package) => [
        "tender_id" => $tenderId,
        "package_id" => $package,
      ], $packagesToAdd));
    }
  }

  /**
   * @param Request $request
   * @param Response $response
   * @param array $args
   * @return Response
   * @throws \Exception
   */
  public function getProcurement(Request $request, Response $response, array $args): Response
  {
    $params = $request->getQueryParams();
    $pid = (int)$args["id"];

    $params['project_id'] = $pid;
    $latestHistoryOnly = ($params['history'] ?? null) === 'latest';

    $model = $latestHistoryOnly
      ? $this->buildProcurementModelWithLatestHistoryOnly($pid)
      : $this->repository->getModel("tender")
        ->select(self::PROCUREMENT_SELECT_COLUMNS)
        ->leftJoin('tender_history', 'tender.id', '=', 'tender_id')
        ->join('project', 'tender.project_id', '=', 'project.id')
        ->where("project_id", "=", $pid)->where(function ($query) {
          $query->whereIn('tender_history_type', ['Interest', 'Enquiry'])->orWhereNull('tender_history_type');
        });

    if ($model->exists()) {
      $history = $this->repository->aggregateTenderHistory($model, $latestHistoryOnly);
      return $this->respond(
        $response,
        new ActionPayload(200, $history)
      );
    }

    return $this->respond(
      $response,
      new ActionPayload(200, [])
    );
  }

  /**
   * Build the procurement query joined against only the most-recent tender_history row per
   * (tender, type, specialist) group, selected at the DB level via ROW_NUMBER() instead of
   * fetching every history row and discarding the rest in PHP. Tie-break is deterministic:
   * created_at desc, then id desc — MAX(created_at) alone can return more than one row per
   * group when two entries share a timestamp (this happens in real data).
   *
   * @param int $pid
   * @return \Illuminate\Database\Eloquent\Builder
   */
  private function buildProcurementModelWithLatestHistoryOnly(int $pid)
  {
    $connection = $this->repository->getModel('tenderHistory')->getConnection();

    $ranked = $connection->table('tender_history')
      ->select(['id', 'tender_id', 'specialist_id', 'tender_history_type', 'author_id', 'status_id', 'meta', 'created_at'])
      ->selectRaw('ROW_NUMBER() OVER (PARTITION BY tender_id, tender_history_type, specialist_id ORDER BY created_at DESC, id DESC) AS rn')
      ->whereIn('tender_id', function ($query) use ($pid) {
        $query->select('id')->from('tender')->where('project_id', $pid);
      })
      ->whereIn('tender_history_type', ['Interest', 'Enquiry']);

    $latestHistory = $connection->query()->fromSub($ranked, 'ranked')->where('rn', 1);

    return $this->repository->getModel("tender")
      ->select(self::PROCUREMENT_SELECT_COLUMNS)
      ->leftJoinSub($latestHistory, 'tender_history', 'tender.id', '=', 'tender_history.tender_id')
      ->join('project', 'tender.project_id', '=', 'project.id')
      ->where("project_id", "=", $pid)->where(function ($query) {
        $query->whereIn('tender_history_type', ['Interest', 'Enquiry'])->orWhereNull('tender_history_type');
      });
  }

  /**
   * @param Request $request
   * @param Response $response
   * @param array $args
   * @return Response
   */
  public function getInterests(Request $request, Response $response, array $args): Response
  {
    return $this->respond(
      $response,
      new ActionPayload(200, $this->repository->getProjectInterests((int)$args["id"]))
    );
  }

  /**
   * @param Request $request
   * @param Response $response
   * @param $args
   * @return Response
   * @throws \Exception
   */
  public function getInstruction(Request $request, Response $response, $args): Response
  {
    $params = $request->getQueryParams();
    $pid = (int)$args["id"];

    $model = $this->repository->getModel("instruction")
      ->select([
        'instruction.*',
        'transaction.price as order_value',
        'transaction.subcontractor_id as subcontractor_id',
        'tender.id as tid',
        'tender.label as tender_label',
        'tender.budget as budget'
      ])
      ->join('transaction', 'instruction.transaction_id', '=', 'transaction.id')
      ->join('tender', 'transaction.tender_id', '=', 'tender.id')
      ->where("tender.project_id", "=", $pid);

    if (isset($params["type_id"])) {
      $model = $model->where('instruction.type_id', '=', (int)$params["type_id"]);
    }

    if ($model->exists()) {
      return $this->respond(
        $response,
        new ActionPayload(200, $model->get()->toArray())
      );
    }

    return $this->notFound($response);
  }

  /**
   * @param Request $request
   * @param Response $response
   * @param array $args
   * @return Response
   */
  public function getAwardedTenders(Request $request, Response $response, array $args): Response
  {
    $pid = (int)$args['id'];
    $params = $request->getQueryParams();
    $statusId = (int)($params['status_id'] ?? 7);
    $type = $params['tender_history_type'] ?? 'Enquiry';

    $tenders = $this->repository->getModel('tender')
      ->where('project_id', $pid)
      ->pluck('id')
      ->all();

    if (empty($tenders)) {
      return $this->respond($response, new ActionPayload(200, []));
    }

    $histories = $this->repository->getModel('tenderHistory')
      ->whereIn('tender_id', $tenders)
      ->where('tender_history_type', $type)
      ->where('status_id', $statusId)
      ->orderBy('created_at', 'DESC')
      ->get();

    $result = [];

    foreach ($histories as $history) {
      $tid = $history->tender_id;
      if (isset($result[$tid])) continue;

      $meta = json_decode($history->meta ?? '{}');

      $result[$tid] = [
        'name' => $meta->subcontractor ?? $meta->contact_name ?? null,
        'id'   => $history->specialist_id ?: ($meta->user_id ?? null)
      ];
    }

    return $this->respond($response, new ActionPayload(200, $result));
  }

  /**
   * @param Request $request
   * @param Response $response
   * @param array $args
   * @return Response
   * @throws \Exception
   */
  public function getTenderLog(Request $request, Response $response, array $args): Response
  {
    $tid = (int)$args["tid"];
    $sid = (int)$args["sid"];

    $rows = $this->repository->getModel("tenderHistory")
      ->select([
        'tender_history.id',
        'tender_history.created_at',
        'tender_history.meta',
        'tender_history.tender_history_type',
        'tender_history_status.id as status_id',
        'tender_history_status.label as status'
      ])
      ->join('tender_history_status', 'tender_history.status_id', '=', 'tender_history_status.id')
      ->where(["tender_history.tender_id" => $tid, "tender_history.specialist_id" => $sid])
      ->get()->toArray();

    foreach ($rows as &$row) {
      $row['meta'] = json_decode($row['meta']);
    }
    return $this->respond($response, new ActionPayload(200, $rows));
  }

  /**
   * @param Request $request
   * @param Response $response
   * @param array $args
   * @return Response
   * @throws \Exception
   */
  public function getByTenderId(Request $request, Response $response, array $args): Response
  {
    $model = $this->repository->getModel("tender")->where("project_id", (int)$args["id"])->where("id", (int)$args["tid"]);
    if ($model->exists()) {
      $data = $model->with("packages")->get();
      return $this->respond(
        $response,
        new ActionPayload(200, $data->toArray())
      );
    }
    return $this->notFound($response);
  }

  /**
   * Expose a near identicle endpoint that allows associcates to be return either by contractor or sub contractor
   * @param Request $request
   * @param Response $response
   * @param array $args
   * @return Response
   * @throws \Exception
   */
  public function associatesByFilter(Request $request, Response $response, array $args)
  {

    $latestHistory = $this->repository->getModel("tenderHistory")
      ->selectRaw('specialist_id,tender_id,tender_history.tender_history_type, MAX(cast(created_at as DateTime)) as created_at')
      ->groupBy(['specialist_id', 'tender_id', 'tender_history_type']);

    $model = $this->repository->getModel("project")
      ->select(['project.id as pid', "project.group_id as gid", "project.name", "tender.label",  'tender_history.specialist_id as sid', 'tender.id as tid'])
      ->join('tender', 'tender.project_id', '=', 'project.id')
      ->join('tender_history', 'tender.id', '=', 'tender_id')
      ->joinSub($latestHistory, 'history', static function ($query) {
        $query->on('tender_history.specialist_id', 'history.specialist_id');
        $query->on('tender_history.tender_id', 'history.tender_id');
        $query->on('tender_history.tender_history_type', 'history.tender_history_type');
        $query->on('tender_history.created_at', 'history.created_at');
      });
    $params = $request->getQueryParams();
    $key = "sid";
    if (isset($params["sid"])) {
      $model->where(["tender_history.specialist_id" => (int) $params["sid"]]);
      $key = "gid";
    } elseif (isset($params["group"])) {
      $model->where(["group_id" => (int) $params["group"]]);
    } else {
      throw new \Exception("Missing Required get arg group or sid");
    }

    $data = [];
    foreach ($model->get()->toArray() as $row) {
      $id = $row[$key];
      if (!isset($data[$id])) {
        $data[$id] = [
          "projects" => []
        ];
      }

      $pid = $row["pid"];
      if (!isset($data[$id]["projects"][$pid])) {
        $data[$id]["projects"][$pid] = [
          "name" => $row["name"],
          "packages" => []
        ];
      }
      $data[$id]["projects"][$pid]["packages"][$row["tid"]] = $row["label"];
    }
    return $this->respond(
      $response,
      new ActionPayload(200, $data)
    );
  }

  /**
   * @param Request $request
   * @param Response $response
   * @param array $args
   * @return Response
   * @throws \Exception
   */
  public function associates(Request $request, Response $response, array $args)
  {

    $latestHistory = $this->repository->getModel("tenderHistory")
      ->selectRaw('specialist_id,tender_id,tender_history.tender_history_type, MAX(cast(created_at as DateTime)) as created_at')
      ->groupBy(['specialist_id', 'tender_id', 'tender_history_type']);

    $model = $this->repository->getModel("project")
      ->select(['project.id as pid', "project.name", "tender.label",  'tender_history.specialist_id as sid', 'tender.id as tid'])
      ->join('tender', 'tender.project_id', '=', 'project.id')
      ->join('tender_history', 'tender.id', '=', 'tender_id')
      ->joinSub($latestHistory, 'history', static function ($query) {
        $query->on('tender_history.specialist_id', 'history.specialist_id');
        $query->on('tender_history.tender_id', 'history.tender_id');
        $query->on('tender_history.tender_history_type', 'history.tender_history_type');
        $query->on('tender_history.created_at', 'history.created_at');
      })
      ->where("group_id", "=", (int)$args["group_id"]);

    $data = [];
    foreach ($model->get()->toArray() as $row) {
      $sid = $row["sid"];
      if (!isset($data[$sid])) {
        $data[$sid] = [
          "projects" => []
        ];
      }

      $pid = $row["pid"];
      if (!isset($data[$sid]["projects"][$pid])) {
        $data[$sid]["projects"][$pid] = [
          "name" => $row["name"],
          "packages" => []
        ];
      }

      $data[$sid]["projects"][$pid]["packages"][$row["tid"]] = $row["label"];
    }
    return $this->respond(
      $response,
      new ActionPayload(200, $data)
    );
  }

  /**
   * @param Request $request
   * @param Response $response
   * @param array $args
   * @return Response
   */
  public function generateSlug(Request $request, Response $response, array $args)
  {
    $name = $this->repository->generateSlug($args['name']);
    return $this->respond(
      $response,
      new ActionPayload(200, $name)
    );
  }

  /**
   * @param Request $request
   * @param Response $response
   * @param array $args
   * @return Response
   * @throws \Exception
   */
  public function getDependency(Request $request, Response $response, array $args): Response
  {
    $pid = (int)$args["id"];
    $params = $request->getQueryParams();
    $type = $params['type'] ?? 'parent';

    $tenders = $this->repository
      ->getModel("tender")
      ->select(['id'])
      ->where(["project_id" => $pid])
      ->get()
      ->toArray();

    $tenderIds = array_map('intval', array_column($tenders, 'id'));
    $result = $this->repository->getProjectDependenciesByTenderIds($tenderIds, $type);

    return $this->respond(
      $response,
      new ActionPayload(200, $result)
    );
  }

  /**
   * @param Request $request
   * @param Response $response
   * @param array $args
   * @return Response
   * @throws \Exception
   */
  public function getCustomerHealthScore(Request $request, Response $response, array $args): Response
  {
    $pids = explode(",", str_replace(["[", "]"], "", $args["pids"]));
    $transaction = $this->repository
      ->getModel('transaction')
      ->with(['tender' => function ($query) use ($pids) {
        $query->whereIn('project_id', $pids);
      }]);
    return $this->respond(
      $response,
      (new ActionPayload(200, $transaction->get()->toArray()))
    );
  }

  /**
   * @param Request $request
   * @param Response $response
   * @param array $args
   * @return Response
   * @throws \Exception
   */
  public function listStatuses(Request $request, Response $response, array $args): Response
  {
    $statuses = $this->repository->getModel('project_entity_status');
    return $this->respond(
      $response,
      (new ActionPayload(200, $statuses->get()->toArray()))
    );
  }

  /**
   * @param Request $request
   * @param Response $response
   * @param array $args
   * @return Response
   * @throws \Exception
   */
  public function getTeam(Request $request, Response $response, array $args): Response
  {
    $model = $this->repository->getModel("project")
      ->where("id", (int)$args["id"])
      ->first();
    if (!$model) {
      return $this->notFound($response);
    }
    $data = $model->teamMemberRoleMapping()->with("teamMemberRole")->get();
    return $this->respond(
      $response,
      new ActionPayload(200, $data->toArray())
    );
  }

  /**
   * @param Request $request
   * @param Response $response
   * @param array $args
   * @return Response
   * @throws \App\Domain\DomainException
   */
  public function addTeamMember(Request $request, Response $response, array $args)
  {
    $data = $this->getData();
    $model = $this->repository->getModel("project")
      ->load((int)$args["id"]);
    if (!$model->isLoaded()) {
      return $this->notFound($response);
    }
    $teamMapping = $this->repository->getModel("teamMemberRoleMapping");
    $id = $teamMapping->store([
      "project_id" => (int)$args["id"],
      "user_id"    => $data["user_id"],
      "role_id"    => $data["role_id"]
    ])->getId();
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
   * @throws \App\Domain\DomainException
   */
  public function updateTeamMember(Request $request, Response $response, array $args)
  {
    $model = $this->repository->getModel("teamMemberRoleMapping")
      ->where("user_id", (int)$args["member"])
      ->where("project_id", (int)$args["id"])
      ->first();
    if (!$model) {
      return $this->notFound($response);
    }
    $model->store($this->getData());
    return $this->noContent($response);
  }

  /**
   * @param Request $request
   * @param Response $response
   * @param array $args
   * @return Response
   * @throws \Exception
   */
  public function removeTeamMember(Request $request, Response $response, array $args)
  {
    $model = $this->repository->getModel("teamMemberRoleMapping")
      ->where("id", (int)$args["member"])
      ->where("project_id", (int)$args["id"]);
    if (!$model) {
      return $this->notFound($response);
    }

    $this->repository->getModel("teamMemberRoleMapping")->deleteById((int)$args["member"]);
    return $this->noContent($response);
  }

  /**
   * @param Request $request
   * @param Response $response
   * @param array $args
   * @return Response
   */
  public function deleteTeamMemberRoleMappingByMember(Request $request, Response $response, array $args)
  {
    $this->repository->getModel("teamMemberRoleMapping")
      ->where("user_id", (int)$args["member"])->delete();
    return $this->noContent($response);
  }

  /**
   * @param Request $request
   * @param Response $response
   * @param array $args
   * @return Response
   * @throws \Exception
   */
  public function listTeamRoles(Request $request, Response $response, array $args): Response
  {
    $statuses = $this->repository->getModel('teamMemberRole');
    return $this->respond(
      $response,
      (new ActionPayload(200, $statuses->get()->toArray()))
    );
  }

  /**
   * Get project integration details for a provider
   *
   * Expects provider_id as a query param to avoid cross-service lookups.
   */
  public function getIntegration(Request $request, Response $response, array $args): Response
  {
    $projectId = (int)$args['id'];
    $providerId = $args['provider_id'] ?? null;
    if ($providerId === null || $providerId === '') {
      $this->logger->warning('getIntegration provider_id is required', ['args' => $args]);

      return $this->respond(
        $response,
        new ActionPayload(200, [])
      );
    }

    $providerId = (int)$providerId;

    $integration = $this->repository->getProjectIntegration($projectId, $providerId);

    if (!$integration) {
      return $this->respond(
        $response,
        new ActionPayload(200, [])
      );
    }

    $data = [
      'integration_id' => $integration->integration_id,
      'integration_name' => $integration->integration_name,
      'integration_uri' => $integration->integration_uri,
      'meta' => $integration->meta,
    ];

    return $this->respond(
      $response,
      new ActionPayload(200, $data)
    );
  }
}
