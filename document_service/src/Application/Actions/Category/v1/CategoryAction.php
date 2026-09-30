<?php

declare(strict_types=1);

namespace App\Application\Actions\Category\v1;

use Psr\Http\Message\ResponseInterface as Response;
use Psr\Http\Message\ServerRequestInterface as Request;
use Psr\Log\LoggerInterface;

use App\Application\Actions\Action;
use App\Application\Actions\ActionPayload;
use App\Domain\Document\DocumentRepository;
use App\Domain\Document\CategoryRepository;

/**
 * Class ProjectAction
 * @package App\Application\Actions\Project
 */
class CategoryAction extends Action
{
    public const DEFAULT_ENTITY_TYPE = 'project';

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
        $this->repository = new CategoryRepository();
    }

    /**
     * @param Request $request
     * @param Response $response
     * @return Response
     * @throws \Exception
     */
    public function list(Request $request, Response $response): Response
    {
        $params = $request->getQueryParams();
        $document = $this->repository
            ->getModel('category')
            ->select(['*','document_categories.id as cid','document_categories.parent_id as c_parent_id', "document.parent_id as d_parent_id"])
            ->leftJoin('document_category_mapping', 'document_category_mapping.category_id', '=', 'document_categories.id')
            ->leftJoin('document', 'document.id', '=', 'document_category_mapping.document_id');

        if (isset($params['entity_id'])) {
            $document->where(function ($query) use ($params) {
                $query->where('entity_id', '=', $params['entity_id']);
            });
            unset($params['entity_id']);
        }

        if (isset($params['parent_id'])) {
            $document->where(function ($query) use ($params) {
                $query->where('document_categories.parent_id', '=', $params['parent_id']);
            });
            unset($params['parent_id']);
        }

        if (isset($params['pids'])) {
            $pids = explode(",", str_replace(["[", "]"], "", $params["pids"]));
            $document->whereIn('document_categories.parent_id', $pids);
            unset($params['pids']);
        }

        if (isset($params['entity_type']) && !$params['entity_type']) {
            $params['entity_type'] = self::DEFAULT_ENTITY_TYPE;
        }

        if (isset($params['cids'])) {
            $document->whereIn('document_categories.id', $params['cids']);
            unset($params['cids']);
        }

        if (isset($params['doc_parent_id'])) {
            $document->where('document.parent_id', '=', $params['doc_parent_id']);
            unset($params['doc_parent_id']);
        }

        if (isset($params['dids'])) {
            $dids = explode(",", str_replace(["[", "]"], "", $params["dids"]));
            $document->whereIn('document.id', $dids);
            unset($params['dids']);
        }

        $document->where($params);


        $documents = [];

        if ($document->exists()) {
            foreach ($document->get()->toArray() as $key => $value) {
                $documents[$value['cid']]['id'] = $value['cid'];
                $documents[$value['cid']]['label'] = $value['label'];
                $documents[$value['cid']]['entity_id'] = $value['entity_id'];
                $documents[$value['cid']]['entity_type'] = $value['entity_type'];
                $documents[$value['cid']]['parent_id'] = $value['c_parent_id'];

                /*
                 * If there is a document
                 */
                if ($value['id']) {
                    $doc = (new DocumentRepository())->getModel()->populate($value);
                    $doc['parent_id'] = $value['d_parent_id'];
                    $documents[$value['cid']]['documents'][] = $doc;
                } else {
                    $documents[$value['cid']]['documents'] = [];
                }
            }
        }

        return $this->respond(
            $response,
            (new ActionPayload(200, $documents))
        );
    }

    /***
     * @param Request $request
     * @param Response $response
     * @param $args
     * @return Response
     */
    public function create(Request $request, Response $response): Response
    {
        $data = $this->getData();

        $entity_id = $data['entity_id'] ?? false;
        $label = $data['label'] ?? false;
        $type = $data['entity_type'] ?? self::DEFAULT_ENTITY_TYPE;
        $parent_id = $data['parent_id'] ?? 0;
        if ($entity_id && $label) {
            $category = $this->repository->addCategory(
                [
                    'entity_id' => (int)$entity_id,
                    'label' => $label,
                    'entity_type' => $type,
                    'parent_id' => (int)$parent_id,
                ],
            );
            return $this->respond(
                $response,
                (new ActionPayload(200, ['id' => $category->getId()]))
            );
        }

        return $this->badRequest($response);
    }

    /**
     * @param Request $request
     * @param Response $response
     * @return Response
     * @throws \App\Domain\DomainException
     */
    public function createDefaults(Request $request, Response $response): Response
    {
        $data = $this->getData();
        $defaults = $this->repository->constants("default_cats");
        $parent_id = $data['parent_id'] ?? 0;
        $inherit_parent = $data['inherit_parent'] ?? false;
        if ($parent_id && $inherit_parent) {
            $parentCats = $this->repository->getModel()->where(["entity_id" => $data["parent_id"]]);
            foreach ($parentCats->get()->toArray() as $cat) {
                if (!in_array($cat["label"], $defaults)) {
                    $defaults[] = $cat["label"];
                }
            }
        }

        foreach ($defaults as $label) {
            $data["label"] = $label;
            $category = $this->repository->addCategory($data);
        }
        $params = $request->getQueryParams();
        if (isset($params['all_project_inc']) && $params['all_project_inc']) {
            $data["label"] = $this->repository::ALL_FILES_LABEL;
            $data["entity_type"] = $this->repository::ALL_FILES_TYPE;
            $category = $this->repository->addCategory($data);
        }
        return $this->noContent($response);
    }

    /**
     * @param Request $request
     * @param Response $response
     * @param $args
     * @return Response
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
     * @param $args
     * @return Response
     */
    public function getById(Request $request, Response $response, $args): Response
    {
        $model = $this->repository->getModel();
        $category = $this->repository->getModel()
            ->with("documents")
            ->where(["id" => $args["id"]]);

        $data = $category->exists() ? $category->get()->toArray()[0] : [];
        return $this->respond(
            $response,
            new ActionPayload(200, $data)
        );
    }

    /**
     * @param Request $request
     * @param Response $response
     * @param $args
     * @return Response
     */
    public function documents(Request $request, Response $response, $args)
    {
        $id = (int)$args["id"];
        $mappings = $this->repository->getMappingQuery($id)->get()->toArray();
        return $this->respond(
            $response,
            new ActionPayload(200, $mappings)
        );
    }

    /**
     * @param Request $request
     * @param Response $response
     * @param $args
     * @return Response
     * @throws \App\Domain\DomainException
     */
    public function addDocument(Request $request, Response $response, $args)
    {
        $cat = $this->repository->getModel()->newQuery()->where(["id" => $args["id"]]);
        $doc = (new DocumentRepository())->getModel()->newQuery()->where(["id" => $args["did"]]);
        if (!$doc->exists() || !$cat->exists()) {
            return $this->notFound($response);
        }

        $this->repository->getModel("categoryMapping")->store([
            "document_id" => $args["did"],
            "category_id" => $args["id"]
        ]);

        return $this->noContent($response);
    }

    /**
     * @param Request $request
     * @param Response $response
     * @param $args
     * @return Response
     * @throws \App\Domain\DomainException
     */
    public function addBulkDocuments(Request $request, Response $response, $args): Response
    {
        $cat = $this->repository->getModel()->where(["id" => $args["id"]]);
        if (!$cat->exists()) {
            return $this->notFound($response);
        }

        $bulk = [];
        foreach ($this->getData()['documents'] ?? [] as $document) {
            $bulk[] = [
                "document_id" => (int)$document,
                "category_id" => $args["id"]
            ];
        }
        $this->repository->getModel("categoryMapping")::upsert($bulk, ['document_id','category_id']);

        return $this->noContent($response);
    }

    /**
     * @param Request $request
     * @param Response $response
     * @param $args
     * @return Response
     */
    public function deleteByEntityId(Request $request, Response $response, $args): Response
    {
        $categories = $this->repository->getModel()->where(["entity_id" => $args["id"]])->delete();
        return $this->noContent($response);
    }

    /**
     * @param Request $request
     * @param Response $response
     * @param $args
     * @return Response
     */
    public function cloneMapping(Request $request, Response $response, $args): Response
    {
        $category = $this->repository->getModel()->where(["id" => $args["id"]]);
        if (!$category->exists()) {
            return $this->notFound($response);
        }

        $mappings = $this->repository->getModel("categoryMapping")->where(["category_id" => $args["clone"]]);
        $docs     = [];
        foreach ($mappings->get()->toArray() as $mapping) {
            //Only Add new Mappings to results response, insertIgnore returns 0 on ignore
            if ($this->repository->getModel("categoryMapping")->insertOrIgnore([
                "category_id" => $args["id"],
                "document_id" => $mapping["document_id"]
            ])) {
                $docs[] = $mapping["document_id"];
            }
        }

        $results = ($docs) ? (new DocumentRepository())->getModel()->newQuery()->whereIn("id", $docs)->get()->toArray() : [];
        return $this->respond(
            $response,
            new ActionPayload(200, $results)
        );
    }

    /**
     * @param Request $request
     * @param Response $response
     * @param $args
     * @return Response
     * @throws \Exception
     */
    public function removeDocument(Request $request, Response $response, $args): Response
    {
        $data = $this->getData();
        $did  = (int) $args["did"];
        if (isset($data["owner_id"])) {
            if (!(new DocumentRepository())->documentHasOwner($did, (int)$data["owner_id"])) {
                return $this->noAuth($response);
            }
        }

        $this->repository->getModel("categoryMapping")
            ->where(["category_id" => $args["id"], "document_id" => $did])
            ->delete();

        return $this->noContent($response);
    }

    /**
     * @param Request $request
     * @param Response $response
     * @param $args
     * @return Response
     */
    public function search(Request $request, Response $response, $args): Response
    {
        $term  = urldecode($args["term"]);
        $model = $this->repository->getModel()->where(
            'label',
            'like',
            '%' . $term . '%'
        )->where($request->getQueryParams());

        $results = $model->get()->toArray();
        return $this->respond(
            $response,
            (new ActionPayload(203, $results))
        );
    }

    /**
     * @param Request $request
     * @param Response $response
     * @param $args
     * @return Response
     */
    public function getDocumentCategories(Request $request, Response $response, $args): Response
    {
        $did  = (int) $args["did"];
        $model = $this->repository->getModel('categoryMapping')->where(['document_id' => $did]);

        $results = $model->get()->toArray();
        return $this->respond(
            $response,
            (new ActionPayload(200, $results))
        );
    }
}
