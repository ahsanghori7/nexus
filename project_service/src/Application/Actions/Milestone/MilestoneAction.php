<?php

namespace App\Application\Actions\Milestone;

use App\Application\Actions\Action;
use App\Application\Actions\ActionError;
use App\Application\Actions\ActionPayload;
use App\Domain\Milestone\MilestoneRepository;
use Psr\Http\Message\ResponseInterface as Response;
use Psr\Http\Message\ServerRequestInterface as Request;
use Psr\Log\LoggerInterface;

class MilestoneAction extends Action {
  /** @var MilestoneRepository */
    protected $repository;

    public function __construct(LoggerInterface $logger, MilestoneRepository $repository)
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
    public function listByAccountId(Request $request, Response $response, array $args): Response {
      $accountId = (int)$args['account_id'];
      $milestones = $this->repository->getModel('accountMilestoneMapping')
          ->where('account_id', $accountId)
          ->orderBy('sort_order')
          ->select('id','label','lead_time','sort_order')
          ->get()->toArray();

      return $this->respond($response, new ActionPayload(200, $milestones));
    }

    /**
     * @param Request $request
     * @param Response $response
     * @param array $args
     * @return Response
     */
    public function listStatuses(Request $request, Response $response, array $args): Response {
      $milestoneStatuses = $this->repository->getModel('packageMilestoneStatus')->get();

      return $this->respond($response, new ActionPayload(200, $milestoneStatuses->toArray()));
    }

    public function listPackageMilestones(Request $request, Response $response, array $args): Response {
      $params = $request->getQueryParams();
      $packageIds = isset($params["package_ids"]) ? explode(',', $params["package_ids"]) : [];
      $packageMilestones = $this->repository->getModel('packageMilestone')
          ->whereIn('package_milestone.package_id', $packageIds)
          ->join('account_milestone_mapping', 'account_milestone_mapping.id', 'package_milestone.account_milestone_mapping_id')
          ->join('milestone', 'milestone.id', 'account_milestone_mapping.milestone_id')
          ->join('package_milestone_status', 'package_milestone_status.id', 'package_milestone.package_milestone_status_id')
          ->select(
            'package_milestone.id as id',
            'package_milestone.package_id',
            'account_milestone_mapping.label as label',
            'package_milestone.lead_time',
            'account_milestone_mapping.sort_order',
            'milestone.type',
            'package_milestone_status.label as status'
          );

      return $this->respond($response, new ActionPayload(200, $packageMilestones->get()->toArray()));
    }

    /**
     * @param Request $request
     * @param Response $response
     * @param array $args
     * @return Response
     */
    public function getPackageMilestones(Request $request, Response $response, array $args): Response {
      $packageId = (int)$args['package_id'];
      $packageMilestones = $this->repository->getModel('packageMilestone')
          ->where('package_id', $packageId)
          ->join('account_milestone_mapping', 'account_milestone_mapping.id', 'package_milestone.account_milestone_mapping_id')
          ->join('milestone', 'milestone.id', 'account_milestone_mapping.milestone_id')
          ->join('package_milestone_status', 'package_milestone_status.id', 'package_milestone.package_milestone_status_id')
          ->orderBy('account_milestone_mapping.sort_order')
          ->select(
            'package_milestone.id as id',
            'account_milestone_mapping.label as label',
            'milestone.label as default_label',
            'package_milestone.lead_time',
            'account_milestone_mapping.sort_order',
            'milestone.type',
            'planned_start_date',
            'planned_end_date',
            'actual_start_date',
            'actual_end_date',
            'package_milestone_status.label as status'
          );

      return $this->respond($response, new ActionPayload(200, $packageMilestones->get()->toArray()));
    }

    public function createPackageMilestones(Request $request, Response $response, array $args): Response {
      $data = $this->getData();

      foreach ($data as $milestoneData) {
        $this->repository->getModel('packageMilestone')->create($milestoneData);
      }

      return $this->respond($response, new ActionPayload(201, ['message' => 'Package milestones created successfully.']));
    }

    /**
     * @param Request $request
     * @param Response $response
     * @param array $args
     * @return Response
     */
    public function createBulkPackageMilestones(Request $request, Response $response, array $args): Response {
      $data = $this->getData();
      $isGrouped = is_array($data[0] ?? null) && array_is_list($data[0]);
      $milestones = $isGrouped ? array_merge(...$data) : $data;

      $fillable = array_flip([
        'account_milestone_mapping_id',
        'package_id',
        'planned_start_date',
        'planned_end_date',
        'actual_start_date',
        'actual_end_date',
        'package_milestone_status_id',
        'lead_time',
      ]);
      $milestones = array_map(
        fn (array $milestone) => array_intersect_key($milestone, $fillable),
        $milestones
      );

      try {
        if ($milestones) {
          $this->repository->getModel('packageMilestone')->insert($milestones);
        }
      } catch (\Exception $e) {
        return $this->respond($response, new ActionPayload(400, null, new ActionError(ActionError::SERVER_ERROR, $e->getMessage())));
      }

      return $this->respond($response, new ActionPayload(201, ['message' => 'Package milestones created successfully.']));
    }

    /**
     * @param Request $request
     * @param Response $response
     * @param array $args
     * @return Response
     */
    public function updatePackageMilestones(Request $request, Response $response, array $args): Response {
      $packageId = (int)$args['package_id'];
      $data = $this->getData();

      foreach ($data as $milestoneData) {
        $milestone = $this->repository->getModel('packageMilestone')
            ->where('id', $milestoneData['id'])
            ->first();

        if ($milestone) {
          $milestone->update($milestoneData);
        }
      }

      return $this->respond($response, new ActionPayload(200, ['message' => 'Package milestones updated successfully.']));
    }

    /**
     * @param Request $request
     * @param Response $response
     * @param array $args
     * @return Response
     */
    public function deletePackageMilestones(Request $request, Response $response, array $args): Response {
      $packageId = (int)$args['package_id'];
      $this->repository->getModel('packageMilestone')
          ->deleteBy(['package_id' => $packageId]);

      return $this->noContent($response);
    }

    public function getMilestoneList( Request $request, Response $response, array $args): Response {
      $milestone = $this->repository->getModel()->get();
      return $this->respond(
          $response,
          new ActionPayload(200, $milestone->toArray())
      );
    }

    public function createAccountMilestoneMapping( Request $request, Response $response, array $args): Response {
      $data = $this->getData();
      foreach ($data as $milestoneData) {
        $this->repository->getModel('accountMilestoneMapping')->create($milestoneData);
      }
      return $this->respond(
          $response,
          new ActionPayload(201, ['success' => true, 'message' => 'Milestones created successfully.']));
    }

    public function updateAccountMilestoneMapping(Request $request, Response $response, array $args): Response
    {
      $data = $this->getData();
      try {
        foreach ($data as $accountMilestoneData) {
          if($accountMilestoneData['id']) {

            if(isset($accountMilestoneData['is_deleted']) && $accountMilestoneData['is_deleted']) {
              $this->repository->getModel('accountMilestoneMapping')
                  ->where('id', $accountMilestoneData['id'])
                  ->delete();
              continue;
            }

            $milestone = $this->repository->getModel('accountMilestoneMapping')
                ->where('id', $accountMilestoneData['id'])
                ->first();

            if ($milestone) {
              $milestone->update($accountMilestoneData);
            }
          } else {
            $this->repository->getModel('accountMilestoneMapping')->create($accountMilestoneData);
          }
        }
      }
      catch (\Exception $e) {
        return $this->respond($response, new ActionPayload(400, null, new ActionError(ActionError::SERVER_ERROR, $e->getMessage())));
      }
      return $this->respond(
        $response,
        new ActionPayload(200, ['success' => true, 'message' => 'Milestones updated successfully.'])
      );
    }

    public function getAccountMilestoneMapping( Request $request, Response $response, array $args): Response {

      $accountId = (int) $args['account_id'];
      $mappings = $this->repository
        ->getModel('accountMilestoneMapping')
        ->where('account_id', $accountId)
        ->with('milestone')
        ->orderBy('sort_order')
        ->get();

      return $this->respond(
          $response,
          new ActionPayload(200, $mappings->toArray())
      );
    }

    /**
     * @param Request $request
     * @param Response $response
     * @param array $args
     * @return Response
     */
    public function getMilestoneByPackageMilestoneId(Request $request, Response $response, array $args): Response {
      $milestoneId = (int)$args['package_milestone_id'];

      $milestone = $this->repository->getModel('packageMilestone')
          ->where('package_milestone.id', $milestoneId)
          ->join('account_milestone_mapping', 'account_milestone_mapping.id', 'package_milestone.account_milestone_mapping_id')
          ->select(
            'account_milestone_mapping.id as id',
            'account_milestone_mapping.label as label',
            'planned_start_date',
            'planned_end_date',
            'actual_start_date',
            'actual_end_date'
          );
      if($milestone->exists()) {
        return $this->respond($response, new ActionPayload(200, $milestone->first()->toArray()));
      }

      return $this->respond($response, new ActionPayload(404, ['success' => false, 'message' => 'Package milestone not found.']));
    }

    /**
     * @param Request $request
     * @param Response $response
     * @param array $args
     * @return Response
     * @throws \Exception
     */
    public function startMilestone(Request $request, Response $response, array $args): Response {
      $milestoneId = (int)$args['package_milestone_id'];
      $data = $this->getData();
      $milestone = $this->repository->getModel('packageMilestone')->where("id", $milestoneId);

      if($milestone->exists()) {
        $milestoneStatuses = $this->repository->getModel('packageMilestoneStatus')->get()->toArray();
        $inProgressStatus = array_filter($milestoneStatuses, fn($item) => $item['label'] === 'In Progress');
        $inProgressStatusId = array_shift($inProgressStatus)['id'] ?? null;

        $data["package_milestone_status_id"] = $inProgressStatusId;

        try {
          $milestone->update($data);
        } catch(\Exception $e) {
          return $this->respond($response, new ActionPayload(400, null, new ActionError(ActionError::SERVER_ERROR, $e->getMessage())));
        }
      } else {
        return $this->respond($response, new ActionPayload(404, ['success' => false, 'message' => 'Package milestone not found.']));
      }

      return $this->respond($response, new ActionPayload(200, ['success' => true, 'message' => 'Package milestone updated successfully.']));
    }

    /**
     * @param Request $request
     * @param Response $response
     * @param array $args
     * @return Response
     * @throws \Exception
     */
    public function completeMilestone(Request $request, Response $response, array $args): Response {
      $milestoneId = (int)$args['package_milestone_id'];
      $data = $this->getData();

      $milestone = $this->repository->getModel('packageMilestone')->where("id", $milestoneId);

      if($milestone->exists()) {

        $milestoneStatuses = $this->repository->getModel('packageMilestoneStatus')->get()->toArray();
        $completedStatus = array_filter($milestoneStatuses, fn($item) => $item['label'] === 'Completed');
        $completedStatusId = array_shift($completedStatus)['id'] ?? null;

        $data["package_milestone_status_id"] = $completedStatusId;

        try {
          $milestone->update($data);
        } catch(\Exception $e) {
          return $this->respond($response, new ActionPayload(400, null, new ActionError(ActionError::SERVER_ERROR, $e->getMessage())));
        }
      } else {
        return $this->respond($response, new ActionPayload(404, ['success' => false, 'message' => 'Package milestone not found.']));
      }

      $packageId = $milestone->value('package_id');

      $packageMilestones = $this->repository->getModel('packageMilestone')
          ->where('package_id', $packageId)
          ->join('account_milestone_mapping', 'account_milestone_mapping.id', 'package_milestone.account_milestone_mapping_id')
          ->join('milestone', 'milestone.id', 'account_milestone_mapping.milestone_id')
          ->join('package_milestone_status', 'package_milestone_status.id', 'package_milestone.package_milestone_status_id')
          ->orderBy('account_milestone_mapping.sort_order', 'asc')
          ->select(
            'package_milestone.id as id',
            'account_milestone_mapping.label as label',
            'package_milestone.lead_time',
            'account_milestone_mapping.sort_order',
            'milestone.type',
            'planned_start_date',
            'planned_end_date',
            'actual_start_date',
            'actual_end_date',
            'package_milestone_status.label as status'
          )->get()->toArray();

      return $this->respond($response, new ActionPayload(200, [
        'milestones' => $packageMilestones,
        'success' => true,
        'message' => 'Package milestone updated successfully.'
        ]));
    }
}
