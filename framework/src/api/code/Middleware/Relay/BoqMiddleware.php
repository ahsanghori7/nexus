<?php

namespace Api\Middleware\Relay;

use Api\Middleware\Pdf\boq\BoqPdfMiddleware;
use Api\Middleware\QsaiMiddleware;
use Api\Middleware\Transactions\QuoteMiddleware;
use Api\Model\BoQ\Entity;
use Api\Data\Boq\Entity as BoqEntity;
use Api\Data\Boq\Resource as BoqResource;
use Api\Model\BoQ\Item;
use Api\Model\BoQ\Resource;
use App\Api\S3;
use Core\Data\Shape;
use Core\Middleware\ServiceMiddleware;
use Core\Data\Collection;
use Core\Middleware\Exception as MiddlewareException;
use Core\Service\Manager;
use Prosper\Middleware\EmailMiddleware;



class BoqMiddleware extends ServiceMiddleware
{

    public const SERVICE = 'project';

    /**
     * Key for Consistent Shape Access
     */
    public const BOQ_KEY  = "boq";

    public const BOQ_RESOURCE_TYPE_KEY = "resource_types";

    public const GENERATION_UNAVAILABLE_MSG = "We couldn’t complete the AI generation request. Something went wrong on our side while processing your request. \nPlease try running the generation again. If this keeps happening, please contact support and mention this error.";

    /**
     * @param string $idKey
     * @param string $saveKey
     * @return callable
     */
    public static function fetchByProjectId(string $idKey, string $saveKey = self::BOQ_KEY): callable
    {
        return function (Shape $action) use ($saveKey, $idKey) {
            if (!$projectId = $action->get($idKey)) {
                throw new MiddlewareException("missingProjectId", "No project id provided from the shape key $idKey");
            }
            $collection = Manager::getService('project')->fetch("boq/" . $projectId)->getCollection('data',  BoqEntity::class);
            if (!count($collection)) {
                throw new MiddlewareException("noEntityFound", "No BOQ found with Project ID : $projectId");
            }
            $action->set($saveKey, $collection);
        };
    }

    /**
     * @param string $idKey
     * @param string $saveKey
     * @return callable
     *
     */
    public static function fetchByEntityId(string $idKey, string $saveKey = self::BOQ_KEY): callable
    {
        return function (Shape $action) use ($idKey, $saveKey) {
            if (!$id = $action->get($idKey)) {
                throw new MiddlewareException("missingProjectId", "No project id provided from the shape key $idKey");
            }
            try {
                $data = Manager::getService('project')->fetch("boq/entity/" . $id)->get('data');
            } catch (\Exception $e) {
                $data = [];
            }

            if (!count($data)) {
                throw new MiddlewareException("noEntityFound", "No BOQ found with ID : $id");
            }

            $action->set($saveKey, new BoqEntity($data->get()));
        };
    }

    /**
     * @param string $idKey
     * @param string $saveKey
     * @return callable
     * TODO: Refactor these the three methods for getting a BOQ for project_id, entity_id and tender_id as they are
     * all pretty much identicle apart from the project service url
     */
    public static function fetchByTenderId(string $idKey, string $saveKey = self::BOQ_KEY): callable
    {
        return function (Shape $action) use ($idKey, $saveKey) {

            $id = $action->get($idKey);
            try {
                $res = Manager::getService('project')->fetch("boq/entity/tender/" . $id);
                $data = $res->get('data');
            } catch (\Core\Service\Exception\RestException $e) {
                if ($e->getCode() == 404) {
                    throw new MiddlewareException("noEntityFound", "No BOQ found for Tender ($id)");
                }
                throw new MiddlewareException(
                    "EndpointFetchFailure",
                    $e->getMessage(),
                    $e->getCode(),
                    $e
                );
            }

            //Project Service throws a 404 if there is no BOQ, so dont think it will ever get here.
            if (!count($data)) {
                throw new MiddlewareException("noEntityFound", "No BOQ found for Tender : $id");
            }

            $action->set($saveKey, new BoqEntity($data->get()));
        };
    }



    /**
     * @param string $idKey
     * @return \Closure
     */
    public static function createEntity(string $idKey): \Closure
    {
        return function (Shape $action) use ($idKey) {
            Entity::createEntityFromTenderId($action->get($idKey));
        };
    }

    /**
     * @param string $eidKey
     * @param string $aidKey
     * @param string $resourceDataKey
     * @param string $type
     * @return \Closure
     */
    public static function saveResource(string $eidKey, string $aidKey,  string $resourceDataKey, string $typeKey): \Closure
    {
        return function (Shape $action) use ($eidKey, $aidKey, $resourceDataKey, $typeKey) {
            $eid  = $action->get($eidKey);
            $aid = $action->get($aidKey);
            $resource = $action->get($resourceDataKey, []);
            if ($resource) {
                $status = Item::getStatusByLabel("draft");
                if (!isset($resource['id']) || !$resource['id']) {
                    $type = $action->get($typeKey);
                    Resource::addResource($eid, $resource['text'], $aid, $type->get("id"), $status);
                } else {
                    $resourceData = Resource::getResourceById($resource['id']);
                    if ($resourceData) {
                        $status = isset($resourceData['resource_version']) ? $resourceData['resource_version']['status'] : null;
                        $currentVersion = $status ? $resourceData['resource_version']['version'] : 0;
                        if ($status === Item::getStatusByLabel("draft")) {
                            Resource::updateResource($resource['id'], ['text' => $resource['text']]);
                        } else {
                            $version = $currentVersion + 1;
                            $idResourceType = $resourceData["boq_resource_type_id"];
                            $data = new Shape([
                                'boq_id' => $eid,
                                'boq_resource_type_id' => $idResourceType,
                                'text' => $resource['text'],
                                'id_account' => $aid,
                                'version' => $version,
                                'status' => Item::getStatusByLabel("draft")
                            ]);
                            Resource::createResourceVersion($data);
                        }
                    }
                }
            }
        };
    }

    /**
     * @param string $eidKey
     * @param string $itemsKey
     * @return \Closure
     */
    public static function saveItems(string $eidKey, string $itemsKey): \Closure
    {
        return function (Shape $action) use ($eidKey, $itemsKey) {

            $eid               = $action->get($eidKey);
            $isNew = $action->get('json.is_new') ?? false;
            $isPublished = Entity::hasPublishedVersion($eid);
            $currentVersion = Entity::getLatestVersionByEntityId($eid);
            $items = $action->get($itemsKey, []);
            foreach ($items as $item) {
                $item["boq_entity_id"] = $eid;
                if ($isPublished) {
                    $item["version"] = $currentVersion + 1;
                    $item["status"] = Item::getStatusByLabel("deleted") === intval($item["item_version"]["status"]) ?
                        $item["item_version"]["status"] : Item::getStatusByLabel("draft");
                    $id = (is_numeric($item["id"])) ? Item::createNewVersion(new Shape($item)) : $id = Item::addItem(new Shape($item));
                } else {
                    $id = $item["id"] ?? 0;
                    $item["version"] = $currentVersion;
                    if ($id && is_numeric($id)) {
                        Item::updateItem(new Shape($item));
                        $id = $item["boq_item_id"];
                        $version    = $item["item_version"]["version"];
                        $version_id = $item["item_version"]["id"];
                        $status     = $item["item_version"]["status"];
                        if ($version && $status === Item::getStatusByLabel("deleted")) {
                            Item::deleteByVersionId($version_id);
                        }
                    } else if ($isNew === false) {
                        $id = Item::addItem(new Shape($item));
                    }
                }
            }
        };
    }

    /**
     * @param string $itemsKey
     * @return \Closure
     * @throws MiddlewareException
     */
    public static function validateBudget($itemsKey): \Closure
    {
        return function (Shape $action) use ($itemsKey) {
            $budget = 0;
            if (!empty($action->get($itemsKey))) {
                foreach ($action->get($itemsKey) as $value) {
                    if (!self::isValidPrecision($value['budget_rate'])) {
                        throw new MiddlewareException("payloadError", "Budget Rate must not exceed 12 digits of precision.");
                    }
                    $budgetTotal = 0;
                    if ($value['budget_total']) {
                        $budgetTotal = $value['budget_total'];
                    } else {
                        $budgetTotal = $value['budget_rate'] * $value['quantity'];
                    }
                    $budget = $budget + $budgetTotal;
                    if (!self::isValidPrecision($budgetTotal)) {
                        throw new MiddlewareException("payloadError", "Budget Total must not exceed 12 digits of precision.");
                    }
                }
            }

            $budget = $budget * 100;
            if (!self::isValidPrecision($budget)) {
                throw new MiddlewareException("payloadError", "Total must not exceed 12 digits of precision.");
            }
        };
    }

    /**
     * @param float|string $number
     * @param int $max
     * @return bool
     */
    private static function isValidPrecision($number, $max = 12): bool
    {
        return strlen(str_replace('.', '', $number)) <= $max;
    }

    /**
     * @return \Closure
     */
    public static function increaseBoQVersion(): \Closure
    {
        return function (Shape $action) {
            $json = $action->get("json");
            $collection = $action->get("collection");
            // TODO: Check why this is an array
            if (count($collection)) {
                $boq = array_shift($collection);
                $items = $boq["entries"] ?? [];
                foreach ($items as $item) {
                    $status = 2; // draft
                    $version = $json->get("version");
                    Item::updateItemMapping($item["id"], ['status' => $status]);
                    Item::updateItemMapping($item["id"], ['version' => $version]);
                    Resource::updateResourceMapping($item["resource_id"], ['status' => $status]);
                    Resource::updateResourceMapping($item["resource_id"], ['version' => $version]);
                }
            }
        };
    }

    /**
     * @param string $dataKey
     * @param string $excludeKeys
     * @param string $saveKey
     * @param string $historyKey
     * @return \Closure
     */
    public static function parseEntitiesEntries(string $dataKey, string $excludeKeys = 'exclude_keys', string $saveKey = 'collection', string $historyKey = 'tender_history'): \Closure
    {
        return function (Shape $action) use ($dataKey, $excludeKeys, $saveKey, $historyKey) {
            $collection = $action->get($dataKey) instanceof Collection ? $action->get($dataKey) : new Collection([$action->get($dataKey)], Shape::class);
            $result = Item::parseEntries($collection, $action->get($excludeKeys, []), $action->get($historyKey, []));
            $action->set($saveKey, new Collection(array_values($result), Shape::class));
        };
    }

    /**
     * @param string $dataKey
     * @param string $excludeKeys
     * @param string $saveKey
     * @param string $historyKey
     * @return \Closure
     */
    public static function getLastVersionResource(string $resourceKey): \Closure
    {
        return function (Shape $action) use ($resourceKey) {
            $action->getCollection('boq')->map(function ($entity) use ($resourceKey) {
                $resources = $entity->get($resourceKey);
                usort($resources, function ($a, $b) {
                    return $b['resource_mappings']['resource_version']['version'] - $a['resource_mappings']['resource_version']['version'];
                });
                $lastResource = array_shift($resources);
                $entity->set($resourceKey, $lastResource);
                return $entity;
            });
        };
    }

    /**
     * @param string $dataKey
     * @param string $saveKey
     * @return \Closure
     */
    public static function getItemsDifferences(string $dataKey = 'entries', string $saveKey = 'differences'): \Closure
    {
        return function (Shape $action) use ($dataKey, $saveKey) {
            $differences = [];
            $entity = $action->get($dataKey);
            (new Collection($entity->get("entries"), Shape::class))->map(function ($item) use (&$differences) {
                $mappings = $item->get("item_mappings", []);
                $mappings = array_filter($mappings, function ($item) {
                    return $item['item_version'];
                });
                if ($mappings) {
                    Item::getItemsDifferences(Item::sortByLatestVersion($mappings), $differences);
                }
            });
            $action->set($saveKey, Item::getItemsLatestVersionDifferences($differences, Entity::getLatestVersionByEntityId($entity->get("id"))));
        };
    }

    /**
     * @param string $statusKey
     * @param string $eidKey
     * @return \Closure
     */
    public static function updateStatus(string $statusKey = 'json.status', string $eidKey = 'uriArgs.eid'): \Closure
    {
        return function (Shape $action) use ($statusKey, $eidKey) {
            $status = $action->int($statusKey);
            $action->get("collection")->map(function ($item) use ($status) {
                (new Collection($item->get("entries"), Shape::class))->map(function ($entry) use ($status) {
                    Item::updateItemMapping($entry, ['status' => $status]);
                });
            });
            $eid  = $action->get($eidKey);
            $resources = Resource::getResourcesByEntityId($eid);
            $resource = BoqResource::getLatestResource($resources);
            Resource::updateResourceMapping($resource["id"], ['status' => $status]);
        };
    }

    /**
     * @param string $statusKey
     * @param string $eidKey
     * @return \Closure
     */
    public static function loadResourceTypes(string $typesKey = self::BOQ_RESOURCE_TYPE_KEY): \Closure
    {
        return function (Shape $action) use ($typesKey) {
            $types = Manager::getService('project')->fetch("boq/resource/type")->getCollection('data');
            $action->set($typesKey, $types);
        };
    }


    /**
     * @param string $saveKey
     * @return \Closure
     */
    public static function preparePDFData(string $saveKey = 'pdf_data'): \Closure
    {
        return function (Shape $action) use ($saveKey) {
            $location = $action->getCollection("regions")->filterByStringField("id", $action->get("project.region"));
            if ($location->count()) {
                $region = $location->first()->get("label");
            }

            $data = [
                'differences' => $action->get("differences", []),
                'differences_documents' => $action->get("differences_documents", []),
                'boq' => [
                    'reason'        => $action->get("boq_reason"),
                    'version'       => Entity::getLatestVersionByEntityId($action->get("uriArgs.eid")),
                    'addendum_date' => date("Y-m-d"),
                    'eid'           => $action->get("uriArgs.eid")
                ],
                'project' => [
                    'name'     => $action->get("project.name"),
                    'location' => $region ?? '',
                ],
                'tender' => [
                    'label' => $action->get("tender.label", $action->get("boq.tender.label")),
                ],
                'account' => [
                    'company_name' => $action->get("account.name"),
                    'name'         => $action->get("user.display_name"),
                    'job'          => $action->get("user.job_title"),
                    'email'        => $action->get("user.email"),
                    'phone'        => $action->get("user.contact_number"),
                ],
                'contractor' => [
                    'name' => $action->get("contractor_enquiry_user.display_name")
                ]
            ];
            $action->set($saveKey, $data);
        };
    }

    /**
     * @return \Closure
     */
    public static function sendAddendumEmailWithAttachment(): \Closure
    {
        return function (Shape $action) {
            $pdf_data = new Shape($action->get("pdf_data"));
            $subcontractors = $action->getCollection("subcontractors");
            $action->getCollection("accounts")->map(function ($account) use ($action, $pdf_data, $subcontractors) {
                $pdf_data->merge(new Shape([
                    'subcontractor' => [
                        'sent_date' => $subcontractors->filterByField("id", $account->int("id"))->first()->get("sent_date"),
                        'name'      => $account->get("name"),
                    ]
                ]));
                $action->set("pdf_data", $pdf_data);
                BoqPdfMiddleware::generateAddendumPDF()($action);
                $document_path = sprintf("%s/%s/%s", "quotes", $account->int("id"), $pdf_data->get("boq.eid"));
                BoqPdfMiddleware::uploadToS3($document_path)($action);
                BoqPdfMiddleware::getS3UploadedKey($document_path)($action);
                EmailMiddleware::send("BOQ Addendum Sent", [
                    "sender"    => $action->get("user"),
                    "recipient" => $account->getCollection("users")->first()->get(),
                    "extra" => [
                        "project_name" => $pdf_data->get("project.name"),
                        "package_name" => $pdf_data->get("tender.label"),
                        "reason" => $pdf_data->get("boq.reason"),
                        "company" => $action->get("account.name"),
                        "contractor_user_name" => $action->get("user.firstname"),
                        "contractor_email" => $action->get("user.email"),
                        "first_name"  => $account->get("name"),
                        "attachments" => [[
                            'name' => $action->get("pdf.name"),
                            'url'  => $document_path . "/" . $action->get("pdf.name"),
                            's3'   => [
                                'tmp_name' => $action->get("pdf.path"),
                                'bucket'   => "document",
                                'key'      => $action->get("uploaded_key")
                            ]
                        ]]
                    ]
                ])($action);
                BoqPdfMiddleware::cleanTmpFile("pdf")($action);
            });
        };
    }

    /**
     * @return \Closure
     */
    public static function sendQuoteAddendumEmailWithAttachment(): \Closure
    {
        return function (Shape $action) {
            $pdf_data = new Shape($action->get("pdf_data"));
            $action->set("pdf_data", $pdf_data);
            BoqPdfMiddleware::generateAddendumPDF(pdf_type: "quote_addendum")($action);
            $document_path = sprintf("%s/%s/%s", "quotes", $action->get("user.account_id"), $pdf_data->get("boq.eid"));
            BoqPdfMiddleware::uploadToS3($document_path)($action);
            BoqPdfMiddleware::getS3UploadedKey($document_path)($action);
            EmailMiddleware::send("BOQ Quote Addendum Sent", [
                "sender"    => $action->get("user"),
                "recipient" => $action->get("contractor_enquiry_user")->get(),
                "extra" => [
                    "project_name" => $pdf_data->get("project.name"),
                    "package_name" => $pdf_data->get("tender.label"),
                    "reason" => $pdf_data->get("boq.reason"),
                    "company" => $action->get("account.name"),
                    "subcontractor_user_name" => $action->get("user.firstname"),
                    "subcontractor_email" => $action->get("user.email"),
                    "first_name"  => $pdf_data->get("account.name"),
                    "attachments" => [[
                        'name' => $action->get("pdf.name"),
                        'url'  => $document_path . "/" . $action->get("pdf.name"),
                        's3'   => [
                            'tmp_name' => $action->get("pdf.path"),
                            'bucket'   => "document",
                            'key'      => $action->get("uploaded_key")
                        ]
                    ]]
                ]
            ])($action);
            BoqPdfMiddleware::cleanTmpFile("pdf")($action);
        };
    }

    public static function relayToQsai(): \Closure
    {
        return function (Shape $action) {
            $files = $_FILES['boq_files'] ?? [];

            if (empty($files)) {
                throw new MiddlewareException("noEntityFound", "No BOQ file provided");
            }

            try {
                $entity_id = $action->get("uriArgs.entity_id") ?? null;
                $form = $action->getRoute()->getRequest()->getData()->getShape("form");

                $package_name = $form->get('package_name') ?? "";

                $data = [
                    'package_id' => $entity_id,
                    'package_name' => $package_name,
                    'processing_type' => "NORMALISATION",
                    'selected_sheets' => $form->get('selected_sheets', [])
                ];

                $data["files[0]"] = new \CURLFile(
                    $files['tmp_name'],
                    $files['type'],
                    $files['name']
                );

                $res = Manager::getService("qsai")->write("/api/boq", new Shape([
                    "data" => $data,
                    "headers" => [
                        "Content-Type" => "multipart/form-data"
                    ]
                ]));

                $code = $res->get("info.http_code");
                if (!in_array($code, [200, 202], true)) {
                    QsaiMiddleware::handleBoqErrorResponse($res, $action, self::GENERATION_UNAVAILABLE_MSG);
                }

                $content = $res->get("content");
                $decoded = json_decode($content, true);
                if (is_array($decoded)) {
                    $decoded["qsai_external_id"] = $entity_id;
                    $action->set("json", json_encode($decoded));
                } else {
                    $action->set("json", $content);
                }
            } catch (MiddlewareException $e) {
                throw $e;
            } catch (\Exception $e) {
                throw new MiddlewareException("noEntityFound", $e->getMessage());
            }
        };
    }

    /**
     * Fetch BOQ status from QSAI (GET endpoint)
     *
     * Polls QSAI for the normalised BOQ status.
     *
     * @param string $docIdKey Key where document ID is stored
     * @return \Closure
     */
    public static function fetchFromQsai(): \Closure
    {
        return function (Shape $action) {
            $entity_id = $action->get("uriArgs.entity_id");

            // makeRequest()/getResponse() rather than fetch(): fetch() throws a
            // RestException that flattens the QSAI body into a nested JSON string,
            // and we need the raw response to map error codes cleanly.
            $res = Manager::getService("qsai")
                ->makeRequest("/api/boq/" . $entity_id)
                ->getResponse();

            $code = $res->get("info.http_code");
            if ($code !== 200) {
                QsaiMiddleware::handleBoqErrorResponse($res, $action, self::GENERATION_UNAVAILABLE_MSG);
            }

            $action->set("json", $res->get("content"));
        };
    }

    public static function relayToQsaiForUpdate()
    {
        return function (Shape $action) {
            try {
                $qsai_external_id = $action->get("boq.id");
                if (!$qsai_external_id) {
                    throw new MiddlewareException("missingTenderId", "Missing tender id");
                }

                Manager::getService("qsai")
                ->update("/api/boq/" . $qsai_external_id, new Shape([
                    "data" => [
                        "marked_deleted" => true
                    ],
                    "headers" => [
                        "Content-Type" => "application/json"
                    ]
                ]));
            } catch (MiddlewareException $e) {
                throw $e;
            } catch (\Exception $e) {
                throw new MiddlewareException("noEntityFound", $e->getMessage());
            }
        };
    }
}
