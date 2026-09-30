<?php

declare(strict_types=1);

namespace App\Application\Actions\BoQ;

use App\Application\Actions\Action;
use App\Application\Actions\ActionPayload;
use App\Domain\Project\BoQ\Entity;
use App\Domain\Project\ProjectRepository;
use Psr\Http\Message\ResponseInterface as Response;
use Psr\Http\Message\ServerRequestInterface as Request;
use Psr\Log\LoggerInterface;

/**
 * Class UserAction
 * @package App\Application\Actions\User
 */
class BoQAction extends Action
{

  public const DELETE_STATUS_ID = 4;

  public const DEFAULT_ITEM_TYPE = 'item';

  public const ENTITY_TABLE = 'boqEntity';

  /**
   * @var string[]
   */
  protected $boqItemTypes = [
    "section" => "Section",
    "item" => "Item",
    "grouped" => "Grouped Heading",
  ];

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
   * @param Request $request
   * @param Response $response
   * @param array $args
   * @return Response
   */
  public function getBoqQuotePresenceByProject(Request $request, Response $response, array $args): Response
  {
    $pid = intval($args["pid"]);
    if (!$pid) {
      return $this->badRequest($response);
    }

    $entities = $this->repository->getModel('boqEntity')
      ->select('id', 'tender_id')
      ->whereHas('tender', function ($query) use ($pid) {
        $query->where('project_id', $pid);
      })
      ->with(['entries' => function ($query) {
        $query->select('id', 'boq_entity_id');
      }])
      ->get();

    if ($entities->isEmpty()) {
      return $this->respond($response, new ActionPayload(200, []));
    }

    $allItemIds = $entities->flatMap(fn($e) => $e->entries->pluck('id'))->all();

    $quotedItemIds = $this->repository->getModel('boqQuoteItem')
      ->whereIn('boq_item_id', $allItemIds)
      ->distinct()
      ->pluck('boq_item_id')
      ->all();

    $result = [];

    foreach ($entities as $entity) {
      $tenderId = $entity->tender_id ?? null;
      if (!$tenderId) continue;

      $itemIds = $entity->entries->pluck('id')->all();
      if (empty($itemIds)) {
        $result[$tenderId] = false;
        continue;
      }

      $result[$tenderId] = !empty(array_intersect($itemIds, $quotedItemIds));
    }

    return $this->respond($response, new ActionPayload(200, $result));
  }

  /**
   * @param Request $request
   * @param Response $response
   * @param array $args
   * @return Response
   */
  public function getBoqQuoteDocumentsByProject(Request $request, Response $response, array $args): Response
  {
    $pid = intval($args['pid']);
    if (!$pid) {
      return $this->badRequest($response);
    }

    $result = $this->repository->getBoqQuoteDocumentsByProject($pid);

    return $this->respond($response, new ActionPayload(200, $result));
  }

  /**
   * @param Request $request
   * @param Response $response
   * @param array $args
   * @return Response
   * @throws \Exception
   */
  public function listBoQ(Request $request, Response $response, array $args): Response
  {
    $pid = intval($args["pid"]);
    $params = $request->getQueryParams();

    if ($pid) {
      $entityModel = $this->repository->getModel('boqEntity');
      $entities = $entityModel
        ->whereHas('tender', function ($query) use ($pid) {
          $query->where('project_id', $pid);
        })
        ->with(['tender' => function ($tender) use ($pid) {
          $tender->where('project_id', $pid);
        }])
        ->with('entries.itemMappings')
        ->with('note.resourceMappings.resourceVersion');

      if (isset($params['status'])) {
        $entities = $entities->with('entries.itemMappings.itemVersion', function ($query) use ($params) {
          $params['status'] = ltrim($params['status'], "[");
          $params['status'] = rtrim($params['status'], "]");
          $statuses = explode(",", $params['status']);
          $query->whereIn('status', $statuses);
        });
      } else {
        $entities = $entities->with('entries.itemMappings.itemVersion');
      }

      $entities = $entities->get()->toArray();
      return $this->respond(
        $response,
        new ActionPayload(200, $entities)
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
  public function getEntityById(Request $request, Response $response, array $args): Response
  {
    $eid = intval($args["eid"]);
    $params = $request->getQueryParams();

    if (!$eid) {
      return $this->badRequest($response);
    }

    $entity = $this->repository->getModel('boqEntity')->where('id', $eid)
      ->with('tender')
      ->with('entries.itemMappings')
      ->with('note', 'note');

    return $this->processFetchEntity($entity, $response, $params);
  }

  /**
   * @param Request $request
   * @param Response $response
   * @param array $args
   * @return Response
   * @throws \Exception
   */
  public function getResourceById(Request $request, Response $response, array $args): Response
  {
    $id = intval($args["id"]);

    if (!$id) {
      return $this->badRequest($response);
    }

    $resource = $this->repository->getModel('boqResourceMapping')->where('boq_resource_id', $id)->with('resourceVersion')->with("resourceData");
    if ($resource->exists()) {
      $resource = $resource->first()->toArray();
      return $this->respond(
        $response,
        new ActionPayload(200, $resource)
      );
    } else {
      return $this->respond(
        $response,
        (new ActionPayload(200, []))
      );
    }
  }

  /**
   * @param Request $request
   * @param Response $response
   * @param array $args
   * @return Response
   * @throws \Exception
   */
  public function getResourcesByEntityId(Request $request, Response $response, array $args): Response
  {
    $eid = intval($args["eid"]);

    if (!$eid) {
      return $this->badRequest($response);
    }

    $resource = $this->repository->getModel('boqResourceMapping')->where('boq_id', $eid)->with('resourceVersion')->with("resourceData");
    if ($resource->exists()) {
      $resource = $resource->get()->toArray();
      return $this->respond(
        $response,
        new ActionPayload(200, $resource)
      );
    } else {
      return $this->respond(
        $response,
        (new ActionPayload(200, []))
      );
    }
  }

  /**
   * @param Builder $builder
   * @param array $params
   * @param Response $response
   */
  private function processFetchEntity($builder, Response $response, array $params = [])
  {

    if (isset($params['status'])) {
      $entity = $builder->with('entries.itemMappings.itemVersion', function ($query) use ($params) {
        $params['status'] = ltrim($params['status'], "[");
        $params['status'] = rtrim($params['status'], "]");
        $statuses = explode(",", $params['status']);
        $query->whereIn('status', $statuses);
      });
    } else {
      $entity = $builder->with('entries.itemMappings.itemVersion');
    }

    if ($entity->exists()) {
      $entity = $entity->first()->toArray();
      return $this->respond(
        $response,
        new ActionPayload(200, $entity)
      );
    } else {
      return $this->notFound($response);
    }
  }

  /**
   * @param Request $request
   * @param Response $response
   * @param array $args
   * @return Response
   * @throws \Exception
   */
  public function getEntityByTenderId(Request $request, Response $response, array $args): Response
  {
    $tid = intval($args["tid"]);
    $params = $request->getQueryParams();

    if (!$tid) {
      return $this->badRequest($response);
    }

    $entity = $this->repository->getModel('boqEntity')->where('tender_id', $tid)
      ->with(['tender' => function ($tender) use ($tid) {
        $tender->where('id', $tid);
      }])
      ->with('entries.itemMappings')
      ->with('note.resourceMappings.resourceVersion');

    return self::processFetchEntity($entity, $response, $params);
  }



  /**
   * @param Request $request
   * @param Response $response
   * @param array $args
   * @return Response
   * @throws \Exception
   */
  public function createEntity(Request $request, Response $response, array $args): Response
  {
    $entityModel = $this->repository->getModel('boqEntity');

    $tid = $args["tid"];
    $id = $entityModel->store(["tender_id" => trim($tid)])->getId();

    return $this->respond(
      $response,
      new ActionPayload(200, $id)
    );
  }

  /**
   * @param Request $request
   * @param Response $response
   * @param array $args
   * @return Response
   * @throws \Exception
   */
  public function updateEntity(Request $request, Response $response, array $args): Response
  {
    $entityModel = $this->repository->getModel('boqEntity')->where('id', $args["id"]);
    if ($entityModel->exists()) {
      $data = $this->getData();
      $entityModel->update($data);
      return $this->noContent($response);
    }

    return $this->notFound($response);
  }

  /**
   * @param Request $request
   * @param Response $response
   * @param $args
   * @return Response
   * @throws \Exception
   */
  public function deleteItemById(Request $request, Response $response, $args): Response
  {
    $id = $args['id'] ?? 0;
    $itemModel = $this->repository->getModel('boqItemVersion')->where('id', $id);
    if ($itemModel->exists()) {
      $itemModel->update(['status' => self::DELETE_STATUS_ID]);
      return $this->noContent($response);
    }
    return $this->noContent($response);
  }

  /**
   * @param Request $request
   * @param Response $response
   * @param array $args
   * @return Response
   * @throws \App\Domain\DomainException
   */
  public function updateItem(Request $request, Response $response, array $args): Response
  {
    $id = $args['id'] ?? 0;
    $data = $this->getData();
    $idEntity = $data["boq_entity_id"] ?? 0;
    $version = $data['version'] ?? null;
    $entityModel = $this->repository->getModel('boqEntity')->where('id', $idEntity);
    if ($entityModel->exists()) {
      $itemModel = $this->repository->getModel('boqItemMapping')->where('id', $id);
      if ($itemModel->exists()) {
        unset($data['boq_entity_id'], $data['version']);
        $itemModel->update($data);

        //create new version
        if ($version) {
          $this->repository->getModel('boqItemVersion')->store([
            'boq_item_mapping_id' => $id,
            'status' => 2,
            'version' => $version
          ]);
        }
      }
      return $this->noContent($response);
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
  public function updateItemMapping(Request $request, Response $response, array $args): Response
  {
    $id = $args['id'] ?? 0;
    $data = $this->getData();
    $itemVersion = $this->repository->getModel('boqItemVersion')->where('boq_item_mapping_id', $id);
    if ($itemVersion && $itemVersion->exists()) {
      $itemVersion->update($data);
      return $this->noContent($response);
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
  public function updateResourceMapping(Request $request, Response $response, array $args): Response
  {
    $id = $args['id'] ?? 0;
    $data = $this->getData();
    $resourceVersion = $this->repository->getModel('boqResourceVersion')->where('boq_resource_mapping_id', $id);
    if ($resourceVersion && $resourceVersion->exists()) {
      $resourceVersion->update($data);
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
  public function createResource(Request $request, Response $response, array $args): Response
  {
    $data = $this->getData();
    $boqId = $data["boq_id"] ?? "";
    $boqType = $data["type"] ?? "";
    $text = $data["text"] ?? "";
    $idAccount = $data["id_account"] ?? "";
    $status = $data["status"] ?? "";
    $version = $data["version"] ?? 1;

    $idResource = 0;
    $boqTypeModel = $this->repository->getModel(self::ENTITY_TABLE)->where('id', $boqId);
    if ($boqTypeModel->exists()) {
      $resourceModel = $this->repository->getModel('boqResource');
      $idResource = $resourceModel->store(["text" => $text, "id_account" => $idAccount])->getId();
      if ($idResource) {
        $idMapping = $this->repository->getModel('boqResourceMapping')->store([
          "boq_id" => $boqId,
          "boq_resource_id" => $idResource,
          "boq_resource_type_id" => $boqType,
        ])->getId();
        if ($idMapping) {
          $this->repository->getModel('boqResourceVersion')->store([
            'boq_resource_mapping_id' => $idMapping,
            'version' => $version,
            'status' => $status
          ])->getId();
        }
      }
    }


    return $this->respond(
      $response,
      new ActionPayload(200, ['id' => $idResource])
    );
  }

  /**
   * @param Request $request
   * @param Response $response
   * @param array $args
   * @return Response
   * @throws \App\Domain\DomainException
   */
  public function updateResourceById(Request $request, Response $response, array $args): Response
  {
    $id = $args['id'] ?? 0;
    $data = $this->getData();
    $resourceModel = $this->repository->getModel("boqResource")->where('id', $id);
    if ($resourceModel->exists()) {
      $resourceModel->update(['text' => $data['text']]);
    }
    return $this->respond(
      $response,
      new ActionPayload(200, ['success' => true])
    );
  }


  /**
   * @param Request $request
   * @param Response $response
   * @param array $args
   * @return Response
   * @throws \Exception
   */
  public function createItem(Request $request, Response $response, array $args): Response
  {
    $data = $this->getData();
    $version_id = $data['version_id'] ?? null;
    unset($data['version_id']);
    $eid = $data["boq_entity_id"] ?? 0;
    $entityModel = $this->repository->getModel('boqEntity')->where('id', $eid);
    if ($entityModel->exists()) {
      $itemModel = $this->repository->getModel('boqItem');
      $itemId = $itemModel->store(['boq_entity_id' => $eid])->getId();
      if ($itemId) {
        $data['boq_item_id'] = $itemId;
        $itemMappingId = $this->repository->getModel('boqItemMapping')->store($data)->getId();
        if ($itemMappingId) {
          $this->repository->getModel('boqItemVersion')->store([
            'boq_item_mapping_id' => $itemMappingId,
            'version'             => $version_id
          ])->getId();
        }
      }
      return $this->respond(
        $response,
        new ActionPayload(200, ['id' => $itemId])
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
  public function createItemVersion(Request $request, Response $response, array $args): Response
  {
    $data = $this->getData();
    $id = $args['id'] ?? 0;
    $version_id = $data['version_id'] ?? null;
    $status = $data['status'] ?? null;
    unset($data['version_id']);
    unset($data['status']);
    $itemModel = $this->repository->getModel('boqItem')->where('id', $id);
    if ($itemModel->exists()) {
      $itemMappingId = $this->repository->getModel('boqItemMapping')->store($data)->getId();
      if ($itemMappingId) {
        $this->repository->getModel('boqItemVersion')->store([
          'boq_item_mapping_id' => $itemMappingId,
          'version'             => $version_id,
          'status'              => $status
        ])->getId();
      }
      return $this->respond(
        $response,
        new ActionPayload(200, ['id' => $itemMappingId])
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
  public function createResourceVersion(Request $request, Response $response, array $args): Response
  {
    $data = $this->getData();
    $text = $data['text'] ?? "";
    $aid = $data['id_account'] ?? "";
    $version = $data['version'] ?? null;
    $status = $data['status'] ?? null;
    unset($data['text']);
    unset($data['id_account']);
    unset($data['version']);
    unset($data['status']);

    $newResourceId = $this->repository->getModel('boqResource')->store(['text' => $text, 'id_account' => $aid])->getId();
    if ($newResourceId) {
      $data['boq_resource_id'] = $newResourceId;
      $res = $this->repository->getModel('boqResourceMapping')->store($data);
      $resourceMappingId = $res->getId();
      if ($resourceMappingId) {
        $this->repository->getModel('boqResourceVersion')->store([
          'boq_resource_mapping_id' => $resourceMappingId,
          'version'             => $version,
          'status'              => $status
        ])->getId();
      }
      return $this->respond(
        $response,
        new ActionPayload(200, ['id' => $resourceMappingId])
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
  public function listUnit(Request $request, Response $response, array $args): Response
  {
    $units = $this->repository->getModel('unit');
    if ($units->exists()) {
      return $this->respond(
        $response,
        (new ActionPayload(200, $units->get()->toArray()))
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
  public function getTypes(Request $request, Response $response, array $args): Response
  {
    $types = $this->repository->getModel('boqResourceType');
    if ($types->exists()) {
      return $this->respond(
        $response,
        (new ActionPayload(200, $types->get()->toArray()))
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
  public function getSummary(Request $request, Response $response, array $args): Response
  {
    // TODO: Complete function
    return $this->notFound($response);
  }
}
