<?php
declare(strict_types=1);

namespace App\Application\Actions\Document\v1;

use App\Api\Project;
use App\Domain\Document\DocumentRepository;

use Aws\Exception\MultipartUploadException;

use Psr\Http\Message\ResponseInterface as Response;
use Psr\Http\Message\ServerRequestInterface as Request;
use Psr\Log\LoggerInterface;

use App\Application\Actions\Action;
use App\Application\Actions\ActionPayload;

use App\Infrastructure\Environment as Env;
use Exception;
use Slim\Psr7\UploadedFile;

/**
 * Class DocumentAction
 * @package App\Application\Actions\Document
 */
class DocumentAction extends Action{

    public const DOCUMENT_UPLOAD_KEY = 'document';

    /**
     * Default content type for account action data is json
     * @var string
     */
    protected $defaultContentType = "application/json";

    /**
     * AccountAction constructor.
     * @param LoggerInterface $logger
     */
    public function __construct (LoggerInterface $logger)
    {
        parent::__construct($logger);
        $this->repository = new DocumentRepository();
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
        $document = $this->repository->getModel()
            ->with("owner")
            ->where(["id" => $args["id"]]);

        $data = $document->exists() ? $document->get()->toArray()[0] : [];
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
    public function getChildren(Request $request, Response $response, $args): Response
    {
        $id = (int)$args["id"];

        $params = $request->getQueryParams();

        $owner_id = $params['owner_id'] ?? null;
        if($owner_id) {
            unset($params['owner_id']);
        }


        $parent = $this->repository->getModel()
            ->where(['id' => $id]);

        if(!$parent){
            return $this->respond(
                $response,
                (new ActionPayload(200, []))
            );
        }

        $children = $this->repository->getModel()
            ->where(array_merge(['parent_id' => $id], $params));

        /*
         * Try to get the document content for a user
         */
        if($owner_id){
            $children->join("document_owner_mapping", function($join) use ($owner_id) {
                    $join->on('document.id', '=', 'document_owner_mapping.document_id');
                    $join->where('document_owner_mapping.owner_id','=', $owner_id);
                });
        }

        $parent = $parent->get()->toArray()[0] ?? [];
        return $this->respond(
            $response,
            (new ActionPayload(200, [
                'parent' => $parent,
                'children' => $children->get()->toArray(),
            ]))
        );

    }

    /**
     * @param Request $request
     * @param Response $response
     * @param $args
     * @return Response
     * @throws \Exception
     */
    public function getCategories(Request $request, Response $response, $args): Response
    {
        $id = (int)$args["id"];
        $parent = $this->repository->getModel()
            ->where(['id' => $id]);

        if(!$parent){
            return $this->respond(
                $response,
                (new ActionPayload(200, []))
            );
        }

        $category = $this->repository->getModel('categoryMapping')
            ->where(['document_id' => $id])
            ->leftJoin("document_categories", function($join){
                $join->on('document_categories.id', '=', 'document_category_mapping.category_id');
            });

        $category->where($request->getQueryParams());

        if($category->exists()){
            $data = $category->get()->toArray();
        }

        return $this->respond(
            $response,
            (new ActionPayload(200, $data ?? []))
        );
    }

    /**
     * Return the provider folder mapping for a given identifier.
     *
     */
    public function getProviderFolder(Request $request, Response $response, $args): Response
    {
        $providerId = $args["provider"];
        $identifier = $args["identifier"];

        $identifiers = array_filter(array_map(static function($id) {
            return strtoupper(trim((string)$id));
        }, explode(',', $identifier)));

        $query = $this->repository->getModel('documentProviderFolder')
            ->newQuery()
            ->where('provider_id', $providerId)
            ->whereIn('identifier', $identifiers);

        $rows = $query->get();
        $data = [];
        foreach ($rows as $row) {
            $data[$row->identifier] = $row->toArray();
        }

        return $this->respond(
            $response,
            (new ActionPayload(200, $data))
        );
    }

    /**
     * @param Request $request
     * @param Response $response
     * @param $args
     * @return Response
     * @throws \Exception
     */
    public function getSigners(Request $request, Response $response, $args): Response
    {
        $id = (int)$args["id"];
        $params = $request->getQueryParams();
        $filter = [];
        if(isset($params['user_id'])){
            $filter['signer_user_id'] = $params['user_id'];
            unset($params['user_id']);
        }
        $children = $this->repository->getModel("documentSignatory")
            ->with(["signer" => function($query) use ($filter){
                $query->where($filter);
            }])
            ->where(array_merge(['document_id' => $id], $params))
            ->orderBy('created_at', 'desc');
        return $this->respond(
            $response,
            (new ActionPayload(200, $children->get()->toArray() ?? []))
        );
    }

    /**
     * @param Request $request
     * @param Response $response
     * @param $args
     * @return Response
     * @throws \Exception
     */
    public function getSignersInGroups(Request $request, Response $response, $args): Response
    {
        $ids = explode(",", str_replace(["[", "]"], "", $args["ids"]));
        $values = $this->repository->getModel("documentSignatory")
        ->with("signer")
        ->whereIn('document_id', $ids)
        ->orderBy('created_at', 'desc')
        ->get()->toArray();

        $results = [];
        foreach ($ids as $id) {
            $results[$id] = array_filter($values, function ($item) use ($id) {
                return intval($item["document_id"]) === intval($id);
            });
        }

        return $this->respond(
            $response,
            (new ActionPayload(200, $results))
        );
    }

    /**
     * @param Request $request
     * @param Response $response
     * @param $args
     * @return Response
     * @throws \Exception
     */
    public function getSignatoryByDocumentId(Request $request, Response $response, $args): Response
    {
        $id = (int)$args["id"];
        $params = $request->getQueryParams();
        $result = $this->repository->getModel("documentSignatory")
            ->where(array_merge(['document_id' => $id], $params));
        if($result->exists()) {
            $data = $result->orderBy("id", "desc")->first()->toArray();
        }
        return $this->respond(
            $response,
            (new ActionPayload(200, $data ?? []))
        );
    }

    /**
     * @param Request $request
     * @param Response $response
     * @param $args
     * @return Response
     * @throws \Exception
     */
    public function getSignatoryByEnvelopeId(Request $request, Response $response, $args): Response
    {
        $idEnvelope = $args["token"];
        $params = $request->getQueryParams();
        $result = $this->repository->getModel("documentSignatory")
            ->where(array_merge(['signatory_id' => $idEnvelope], $params));
        if($result->exists()) {
            $data = $result->first()->toArray();
        }
        return $this->respond(
            $response,
            (new ActionPayload(200, $data ?? []))
        );
    }


    /**
     * @param Request $request
     * @param Response $response
     * @param $args
     * @return Response
     * @throws \Exception
     */
    public function getSignatory(Request $request, Response $response, $args): Response
    {
        $params = $request->getQueryParams();
        $result = $this->repository->getModel("documentSignatory")
            ->with("signer");

        if(isset($params['id'])){
            $result->where(['signatory_id' => $params['id']]);
        }

        $filter = [];
        if(isset($params['status_id'])){
            $filter['signer_status_id'] = $params['status_id'];
        }
        if(isset($params['user_id'])){
            $filter['signer_user_id'] = $params['user_id'];
        }

        if($filter){
            $result = $result->with(["signer" => function($query) use ($filter){
                $query->where($filter);
            }])
            ->whereHas('signer', function($query) use ($filter) {
                $query->where($filter);
            });
            $data = $result->get()->toArray();
        }
        else{
            if($result->exists()) {
                $data = $result->first()->toArray();
            }
        }
        return $this->respond(
            $response,
            (new ActionPayload(200, $data ?? []))
        );
    }

    /**
     * @param Request $request
     * @param Response $response
     * @param $args
     * @return Response
     * @throws \Exception
     */

    public function createSignatory(Request $request, Response $response, $args): Response
    {
        $data = $this->getData();
        $res = $this->repository->getModel("documentSignatory")->store([
            'document_id'  => $data['document_id'],
            'signatory_id' => $data['signatory_id']
        ]);
        return $this->respond(
            $response,
            (new ActionPayload(200, ['id' => $res->getId()]))
        );
    }

    /**
     * @param Request $request
     * @param Response $response
     * @param $args
     * @return Response
     * @throws \App\Domain\DomainException
     */
    public function createSigner(Request $request, Response $response, $args): Response
    {
        $id = (int)$args["id"];
        $data = $this->getData();
        $res = $this->repository->getModel("documentSignatorySigner")->store([
            'signatory_id'      => $id,
            'signer_user_id'    => $data['user_id'],
            'signer_status_id'  => $data['status_id'],
            'signer_created_at' => date("Y-m-d H:i:s")
        ]);
        return $this->respond(
            $response,
            (new ActionPayload(200, ['id' => $res->getId()]))
        );
    }

    /**
     * @param Request $request
     * @param Response $response
     * @param $args
     * @return Response
     * @throws \App\Domain\DomainException
     * @throws \ReflectionException
     */
    public function updateSigner(Request $request, Response $response, $args): Response
    {
        $data = $this->getData();
        $model = $this->repository->getModel("documentSignatory")->load($args["id"], 'signatory_id');
        if (!$model->isLoaded()) {
            return $this->notFound($response);
        }
        $model = $this->repository->getModel("documentSignatorySigner")->findOne([
            'signatory_id'   => $model->getId(),
            'signer_user_id' => $data['user_id']
        ]);
        if (!$model->isLoaded()) {
            return $this->notFound($response);
        }
        $model->store([
            'signer_status_id'  => $this->getData('status_id'),
            'signer_updated_at' => date("Y-m-d H:i:s"),
        ]);
        return $this->respond(
            $response,
            (new ActionPayload(200, ['success' => true]))
        );
    }

    /**
     * @param Request $request
     * @param Response $response
     * @param $args
     * @return Response
     * @throws \Exception
     */
    public function getStatus(Request $request, Response $response, $args): Response
    {
        $params = $request->getQueryParams();
        $model = $this->repository->getModel("documentSignatoryStatus");
        if($params){
            $model = $model->where($params);
        }
        return $this->respond(
            $response,
            new ActionPayload(200, $model->get()->toArray())
        );
    }

    /**
     * @param Request $request
     * @param Response $response
     * @param $args
     * @return Response
     */
    public function clone(Request $request, Response $response, $args): Response
    {
        $id = (int)$args["id"];

        $parent = $this->repository->getModel()
            ->where(['id' => $id]);
        if(!$parent){
            return $this->respond(
                $response,
                (new ActionPayload(200, []))
            );
        }

        $data =  $parent->get()->toArray()[0];
        foreach($this->getData() as $key => $value){
            $data[$key] = $value;
        }
        unset($data['id']);
        $rec = $this->repository->getModel()->store($data);

        if(isset($data['owner_id'])){
            $this->repository->createDocumentOwnerMapping([
                'document_id' => $rec->getId(),
                'owner_id' => $data['owner_id']
            ]);
        }

        return $this->respond(
            $response,
            (new ActionPayload(200, ['id' => $rec->getId()]))
        );
    }

    /**
     * @param Request $request
     * @param Response $response
     * @return Response
     */
    public function list(Request $request, Response $response): Response
    {
        $params = $request->getQueryParams();

        $typesIn  = [
            'type' => false,
            'subtype' => false
        ];

        foreach($typesIn as $key => $type){
            if(isset($params[$key]) && strpos($params[$key], ",",) ){
                $typesIn[$key] = explode(",", $params[$key]);
                unset($params[$key]);
            }
        }

        $document = $this->repository
            ->getModel()
            ->with('category')
            ->with("tender")
            ->with("owner");

        if(isset($params["owner_id"])) {
            $document->whereHas("owner", function($q) use($params) {
                return $q->where("owner_id", '=', (int) $params["owner_id"]);
            });
            unset($params["owner_id"]);
        }

        if(isset($params['ids'])){
            $document->whereIn('document.id', $params['ids']);
            unset($params['ids']);
        }

        $document->where($params);

        foreach($typesIn as $type => $typeIn){
            if($typeIn){
                $document->whereIn($type, $typeIn);
            }
        }

        return $this->respond(
            $response,
            (new ActionPayload(200, $document->get()->toArray()))
        );
    }

    /**
     * @param Request $request
     * @param Response $response
     * @param $args
     * @return Response
     * @throws \Exception
     */
    public function getOwner(Request $request, Response $response, $args): Response
    {
        $res = $this->repository
            ->getModel('documentOwnerMapping')
            ->where(['document_id' => $args['id']]);

        $owners = [];
        if($res->exists()){
            foreach($res->get()->toArray() as $owner){
                $owners[] = $owner['owner_id'];
            }
        }

        return $this->respond(
            $response,
            (new ActionPayload(200, $owners))
        );
    }

    /**
     * @param Request $request
     * @param Response $response
     * @param $args
     * @return Response
     * @throws \Exception
     */
    public function updateOwner(Request $request, Response $response, $args): Response
    {
        $data = $this->getData();
        $this->repository->createDocumentOwnerMapping([
            'document_id' => $args['id'],
            'owner_id'    => $data['owner_id']
        ]);
        return $this->respond(
            $response,
            (new ActionPayload(200, ['success' => true]))
        );
    }

    /***
     * @param Request $request
     * @param Response $response
     * @param $args
     * @return Response
     */
    public function createTender(Request $request, Response $response, $args): Response
    {
        $data = $this->getData();

        $tender_id = $data['tender_id'] ?? false;
        if($tender_id){
            $document = $this->repository->getModel('document')->load($args["id"]);
            if($document->isLoaded()) {
                $this->repository->addDocumentTender(
                    [
                        'tender_id' => (int)$tender_id,
                        'document_id' => (int)$args["id"]
                    ],
                );
                return $this->noContent($response);
            }
        }

        return $this->badRequest($response);
    }

    /**
     * @param Request $request
     * @return mixed
     * @throws \Exception
     */
    public function getUploadedDocument(Request $request) {

        $files = $request->getUploadedFiles();
        $file = $files[self::DOCUMENT_UPLOAD_KEY] ?? false;

        if(!$file){
            throw new \Exception("Missing Document Upload");
        }
        return $file;
    }

    /**
     * @param Request $request
     * @param Response $response
     * @param $args
     * @return Response
     * @throws \Exception
     */
    public function delete(Request $request, Response $response, $args): Response
    {
        $data = $this->getData();
        $did  = (int) $args["id"];
        if(isset($data["owner_id"])) {
            if(!$this->repository->documentHasOwner($did, (int)$data["owner_id"])) {
                return $this->noAuth($response);
            }
        }

        $this->repository->getModel()->where(["id" => $did])->delete();
        return $this->respond(
            $response,
            (new ActionPayload(203, ['success' => true]))
        );
    }

    /**
     * @param Request $request
     * @param Response $response
     * @return Response
     */
    public function create(Request $request, Response $response): Response
    {
        $data = $this->getData();

        if(!isset($data['owner_id'])) {
            throw new \Exception("Missing owner id");
        }

        //We seem to need to flag this as is causes an error with eloquence.
        if(isset($data["meta"]) && is_array($data["meta"])) {
            $data["meta"] = json_encode($data["meta"]);
        }

        $id = $this->repository->create($data);
        if($id) {
            if(isset($data["category"])) {
                $this->repository->createCategoryMapping([
                    'document_id' => $id,
                    'category_id' => $data['category']
                ]);
            }
            $this->repository->createDocumentOwnerMapping([
                'document_id' => $id,
                'owner_id' => $data['owner_id']
            ]);
            return $this->respond(
                $response,
                new ActionPayload(200, ['id' => $id])
            );
        }
        return $this->badRequest($response);
    }

    /***
     * @param Request $request
     * @param Response $response
     * @param $args
     * @return Response
     */
    public function createCategory(Request $request, Response $response, $args): Response
    {
        $data = $this->getData();

        $category_label = $data['category_label'] ?? false;
        $category_pid = $data['category_pid'] ?? false;

        if($category_label && $category_pid){
            $this->repository->addDocumentCategory(
                [
                    'label' => $category_label,
                    'entity_id' => (int)$category_pid,
                ],
            );
            return $this->noContent($response);
        }

        return $this->badRequest($response);
    }

    /**
     * @param Request $request
     * @param Response $response
     * @param $args
     * @return Response
     * @throws \Exception
     */
    public function deleteTenderById(Request $request, Response $response, $args): Response
    {
        $this->repository->getModel('tender')->deleteBy(['tender_id' => $args["tid"]]);
        return $this->noContent($response);
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
     * @param $args
     * @return Response
     * @throws \Exception
     */
    public function listTypes(Request $request, Response $response, $args): Response
    {
        $model = $this->repository->getModel("documentType");
        return $this->respond(
            $response,
            new ActionPayload(200, $model->get()->toArray())
        );
    }

    /**
     * @param Request $request
     * @param Response $response
     * @param $args
     * @return Response
     * @throws \Exception
     */
    public function listSubTypes(Request $request, Response $response, $args): Response
    {
        $model = $this->repository->getModel("documentSubType");
        return $this->respond(
            $response,
            new ActionPayload(200, $model->get()->toArray())
        );
    }



    /**
     * @param Request $request
     * @param Response $response
     * @param $args
     * @return Response
     * @throws \Exception
     */
    public function unmappedDocuments(Request $request, Response $response, $args): Response
    {
        $docType = $this->repository->getModel("documentType")->where(["id" => $args["type"]]);
        if($docType->exists()) {
            $type = $docType->get()->toArray()[0];
            $docs = $this->repository->getModel()
                ->select(['*','document.id as id'])
                ->where(["type" => $type["id"]])
                ->leftJoin("document_category_mapping", function($join){
                    $join->on('document.id', '=', 'document_category_mapping.document_id');
                })
                ->whereNull('document_category_mapping.document_id');

            return $this->respond(
                $response,
                new ActionPayload(200, $docs->get()->toArray())
            );
        }
        return $this->notFound($response);
    }

    /**
     * @param Request $request
     * @param Response $response
     * @param $args
     * @return Response
     */
    public function search(Request $request, Response $response, $args)
    {
        $params = $request->getQueryParams();
        $term = urldecode($args["term"]);
        $ownerId = $params["owner"] ?? false;

        $model = $this->repository->getModel()->where(
            'name', 'like', '%' . $term . '%'
        )->with("owner");

        $documents = $this->repository->filterByCategory($model,
            $params["entity_id"] ?? null,
            $params["parent_id"] ?? null
        );
        if($ownerId) {
            $results = [];
            foreach($documents as $document) {
                if(in_array($ownerId, array_map(function($i){ return $i["owner_id"]; }, $document["owner"]))) {
                    $results[] = $document;
                }
            }
        }
        else {
            $results  = $documents;
        }

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
     * @throws \Exception
     */
    public function requested(Request $request, Response $response, $args)
    {
        $params = $request->getQueryParams();
        //allow to search by null|empty values
        if(isset($params['request_fullfilled_at']) && (!$params['request_fullfilled_at'] || $params['request_fullfilled_at'] === "isNull")){
            $params['request_fullfilled_at'] = null;
        }

        $results = $this->repository->getModel("documentRequest")->where($params)->get()->toArray();
        return $this->respond(
            $response,
            (new ActionPayload(200, $results))
        );
    }

    /***
     * @param Request $request
     * @param Response $response
     * @param $args
     * @return Response
     */
    public function createRequest(Request $request, Response $response, $args): Response
    {
        $data = $this->getData();
        try{
            $res = $this->repository->getModel("documentRequest")->store($data);
            return $this->respond(
                $response,
                new ActionPayload(200, ['id' => $res->getId()])
            );
        }catch (\Exception $e){

        }
        return $this->badRequest($response);
    }

    /**
     * @param Request $request
     * @param Response $response
     * @param $args
     * @return Response
     * @throws \App\Domain\DomainException
     */
    public function fullfillRequest(Request $request, Response $response, $args): Response
    {
        $data = $this->getData();
        $id = (int)($args["id"] ?? 0);
        if($id){
            $request = $this->repository->getModel('documentRequest')->load($args["id"]);
            if (!$request->isLoaded()) {
                return $this->notFound($response);
            }
            $request->store($data);
        }
        return $this->badRequest($response);
    }

    /**
     * @param Request $request
     * @param Response $response
     * @param $args
     * @return Response
     * @throws \Exception
     */
    public function listRequestTypes(Request $request, Response $response, $args): Response
    {
        $model = $this->repository->getModel("documentRequestType");
        return $this->respond(
            $response,
            new ActionPayload(200, $model->get()->toArray())
        );
    }

    /**
     * @param Request $request
     * @param Response $response
     * @param $args
     * @return Response
     */
    public function mapRequestDocument(Request $request, Response $response, $args): Response
    {
        $data = $this->getData();
        try{
            $this->repository->getModel("documentRequestMapping")->store($data);
            return $this->respond(
                $response,
                new ActionPayload(200, ['success' => true])
            );
        }catch (\Exception $e){

        }
        return $this->badRequest($response);
    }

    public function removeOwner(Request $request, Response $response, $args): Response
    {
        $queryParams = $request->getQueryParams();

        $this->repository->getModel('documentOwnerMapping')
            ->newQuery()
            ->where([
                'document_id' => $args['id'],
                'owner_id'    => $queryParams['owner_id'] ?? null
            ])
            ->delete();

        return $this->respond(
            $response,
            (new ActionPayload(200, ['success' => true]))
        );
    }

}
