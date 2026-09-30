<?php


namespace App\Api;

use App\Api\BoQ\BoQ as BoQApi;
use App\Api\Document\Category;
use App\Api\Document\Category as DocCategoryApi;
use App\core\Request;
use App\Models\Abstraction;
use App\Models\Collection;
use App\Api\Tender as TenderApi;
use App\Models\Transaction;
use App\Models\User;
use App\Api\Client\Response\JsonResponse;
use App\Utility\Upload;
use App\Api\Document\Validator as DocValidator;
use App\Api\Email\Email;
use App\core\Config;
use App\Models\Document as DocumentModel;
use App\Models\Document\Category as DocumentCategoryModel;
use App\Models\Document\Collection as DocumentCollection;
use App\Models\Document\SubType;
use App\Models\Order as OrderModel;
use App\DocCreator\Snapshot\SnapshotService;
use App\Models\DownloadManager;
use App\DocCreator\DownloadManager\DownloadManagerFactory;

class Document extends Client
{
    /**
     * @var string[]
     */
    public static $allow_extensions = [
        'zip' => 'application/zip'
    ];

    public const DOCUMENT_STRUCTURAL_TYPE = 1;
    public const DOCUMENT_CONTRACTUAL_TYPE = 2;

    public const ENTITY_TENDER = 'tender';
    public const ENTITY_PROJECT = 'project';

    public const DOCUMENT_CONTRACTUAL_LABEL = 'contractual';

    /* TODO: Remove if we decide to drop draft orders work */
    public const DOCUMENT_STATUS_INACTIVE = ['Draft', 'Withdrew'];
    public const TOGGLE_DRAFT_WORK = false;
    public const DOCUMENT_STATUS_PUBLISHED_ID = 1;

    /**
     * @var array
     */
    protected static $forward_address = [];

    /**
     * @var array
     */
    protected static array $typeCache = [];

    /**
     * @var array
     */
    protected static $subtypeCache = null;


    const ENTITY_TYPE = "documents";
    const PO_PREFIX_LABEL = 'Purchase Order';
    const TENDER_INQUIRY_APPROVAL = "TENDER_INQUIRY_APPROVAL";
    /**
     * @var array
     */
    protected static $security = [
        "methods" => [
            "templates" => [
                "type" => "GET",
                "requires_session" => true
            ],
            "type" => [
                "type" => 'GET',
                "requires_session" => true
            ],
            "create" => [
                "type" => 'POST',
                "requires_session" => true,
                "pre_checks" => [
                    [DocValidator::class, "uploadedDocumentPresent"],
                    [DocValidator::class, "documentType"]
                ],
                "required_args" => [
                    "type" => "string"
                ]
            ],
            "replace" => [
                "type" => 'POST',
                "requires_session" => true,
                "required_args" => [
                    "did" => "int",
                    "id" => "int"
                ]
            ],
            "clone" => [
                "type" => 'POST',
                "requires_session" => true,
                "required_args" => [
                    "did" => "int"
                ]
            ],
            "remove" => [
                "type" => 'DELETE',
                "requires_session" => true,
                "pre_checks" => [[DocValidator::class, "isOwner"]],
                "required_args" => [
                    "did" => "int",
                ]
            ],
            "bulkDeleteFiles" => [
                "type" => 'DELETE',
                "requires_session" => true,
            ],
            "saveContent" => [
                "type" => "GET",
                "pre_checks" => [[DocValidator::class, "isOwner"]],
                "required_args" => [
                    "did" => "int"
                ],
            ],
            "getContent" => [
                "type" => "GET",
                "pre_checks" => [[DocValidator::class, "isOwner"]],
                "required_args" => [
                    "did" => "int"
                ]
            ],
            "restore" => [
                "type" => "PATCH",
                "requires_session" => true,
                "pre_checks" => [
                    [DocValidator::Class, "isOwner"],
                    [DocValidator::Class, "hasParent"]
                ],
                "required_args" => [
                    "did" => "int"
                ]
            ],
            "assignApprovers" => [
                "type" => "POST",
                "pre_checks" => [[DocValidator::class, "isOwner"]],
                "required_args" => [
                    "did" => "int"
                ]
            ],
            "orderApproval" => [
                "type" => "POST",
                "pre_checks" => [[DocValidator::class, "isOwner"]],
                "required_args" => [
                    "did" => "int"
                ]
            ]
        ]
    ];

    /**
     * @param string $k
     * @return false|string
     */
    public static function getForwardingAddress(string $k)
    {
        if (isset(self::$forward_address[$k])) {
            return baseUrl() . self::$forward_address[$k];
        }
        return false;
    }

    /**
     * @return array|\array[][]
     */
    public static function getSecurity()
    {
        return self::$security;
    }

    /**
     * This should be get Type UID not label
     * @param int $id
     * @return string
     */
    public static function getTypeUid(int $id): string
    {
        $types = self::getDocumentTypes();
        foreach ($types as $uid => $type_id) {
            if ($id === (int)$type_id) {
                return $uid;
            }
        }
        return "";
    }

    /**
     * @return Collection
     * @throws Exception
     */
    public static function getSubTypes(): Collection
    {
        if (!self::$subtypeCache) {
            self::$subtypeCache = new Collection(
                self::get("document/subtype"),
                SubType::class
            );
        }

        return self::$subtypeCache;
    }

    /**
     * @param string $step
     * @param string $url
     */
    public static function setForwardingAddress($step, $url)
    {
        self::$forward_address[$step] = $url;
    }

    /**
     * @return array
     */
    public static function getDocumentTypes(): array
    {
        if (!self::$typeCache) {
            foreach (self::get("document/type") as $type) {
                self::$typeCache[$type["uid"]] = $type["id"];
            }
        }

        return self::$typeCache;
    }

    /**
     * @param Request $request
     * @param User $user
     * @param array $args
     * @return JsonResponse
     */
    public static function type(Request $request, User $user, array $args): jsonResponse
    {
        return self::jsonResponse(self::getDocumentTypes());
    }

    /**
     * @param int $id
     * @param array $filters
     * @return DocumentModel
     * @throws Exception
     */
    public static function load(int $id, array $filters = []): Abstraction
    {
        return new DocumentModel(self::get("document/$id", $filters), $id);
    }

    /**
     * @param string $uid
     * @return array
     * @throws \Exception
     */
    public static function getDocumentType(string $match): int
    {
        $types = self::getDocumentTypes();
        foreach ($types as $uid => $typeId) {
            if (strcasecmp($uid, $match) === 0) {
                return $typeId;
            }
        }
        throw new \Exception("Unknown Type $match");
    }


    /**
     * @param int $type
     * @throws Exception
     */
    public static function deleteUnMapped(int $type)
    {
        $label = self::getTypeUid($type);
        $deleted = 0;
        if ($label) {
            $documents = self::get("document/type/$type/unmapped");
            foreach ($documents as $data) {
                if ((new DocumentModel($data, $data["id"]))->delete()) {
                    self::delete("document/" . $data["id"]);
                    $deleted += 1;
                }
            }
        } else {
            throw new \Exception("Invalid Type Id: $type");
        }
        return $deleted;
    }

    /**
     * @param Request $request
     * @param User $user
     * @param array $args
     * @return JsonResponse
     */
    public static function create(Request $request, User $user, array $args): jsonResponse
    {
        try {
            $bucket = self::getConfig()["s3_structural_bucket"];
            $data = $request->getData();
            $type = $args["type"];
            $document = $args["documents"][0];

            $res = self::post("document", [
                'owner_id'  => $user->getAccountId(),
                'type'      => (int) $type,
                "name"      => $document->getName(),
                "s3_bucket"    => $bucket,
            ]);

            $json = $res->json();
            $id = $json["data"]["id"] ?? null;
            if (!$id) {
                throw new \Exception("Api Failure: Failed to create document");
            }

            $upload = self::upload($document, $id, $bucket, [self::getTypeUid($args["type"])]);
            if ($upload) {
                $url = parse_url($upload["ObjectURL"]);
                self::patch("document/$id", ["s3_key" => ltrim($url["path"], "/")]);
            }

            return self::jsonResponse(["success" => true, 'id' => $id]);
        } catch (\Exception $e) {
            self::errorLog($e->getMessage());
            return self::jsonResponse(["success" => false, $e->getMessage()]);
        }
    }

    /**
     * @param Request $request
     * @param User $user
     * @param array $args
     * @return JsonResponse
     */
    public static function replace(Request $request, User $user, array $args): jsonResponse
    {
        try {
            $did = (int) $args["did"];
            $cid = $request->getQueryValue('cid');
            $args['cid'] = $cid;
            $token = app()->Cookie->getCookie('token');

            $res = Api::post(sprintf("document/%s/replace", $did), $args, ['Authorization' => "Bearer $token"]);

            return self::jsonResponse($res->json(), $res->getInfo()['http_code']);
        } catch (\Exception $e) {
            return self::jsonResponse(["error" => $e->getMessage()], 400);
        }
    }

    /**
     * @param Upload $file
     * @param $id
     * @param $bucket
     * @param null $parent
     * @return \Aws\Result
     */
    public static function upload(Upload $file, $id, $bucket, $parent = null)
    {
        $key = S3::getKey($id . "." . $file->getExt(), "document", $parent);
        return S3::upload(
            $bucket,
            $key,
            $file->getPath(),
            $file->getType()
        );
    }

    /**
     * @param Request $request
     * @param User $user
     * @param array $args
     * @return JsonResponse
     * @throws Exception
     */
    public static function remove(Request $request, User $user, array $args): jsonResponse
    {
        $cid = $request->getQueryValue("cid");
        $did = $request->getQueryValue("did");
        try {

            if ($cid) {
                self::delete("category/" . $cid . "/document/" . (int)$did, ["owner_id" => $user->getAccountId()]);
            } else {
                if ($args["document"]->delete()) {
                    self::delete("document/$did");
                }
            }
        } catch (\Exception $e) {
            self::throwJsonException("Failed to delete file", 500, $e);
        }

        return self::jsonResponse(["success" => true]);
    }

    /**
     * @param array $ids
     * @return mixed
     * @throws Exception
     */
    public static function getDocuments(array $ids)
    {
        return self::get("document", ['ids' => $ids]);
    }

    /**
     * @param int $did
     * @return false|mixed
     */
    public static function getDocument(int $did)
    {
        $document = false;
        try {
            $document = self::get("document?id=$did")[0];
        } catch (\Exception $e) {
            $document = false;
        }
        return $document;
    }

    /**
     * @param Request $request
     * @param array $args
     * @return JsonResponse
     */
    public static function deleteFile(Request $request, User $user, array $args): jsonResponse
    {
        $res =  self::delete("document/" . (int)$args['doc_id']);
        return self::jsonResponse(["success" => ($res->getStatus() === 203)]);
    }

    /**
     * @param Request $request
     * @param User $user
     * @return JsonResponse
     * @throws \Exception
     */
    public static function bulkDeleteFiles(Request $request, User $user): jsonResponse
    {

        $docs = $request->getJson();
        try {

            if (!isset($docs['files']) || !is_array($docs['files'])) {
                throw new \Exception("No documents provided");
            }

            foreach ($docs['files'] as $doc_id) {
                $owners = self::get("document/$doc_id/owner");
                if (!in_array($user->getAccountId(), $owners)) {
                    throw new \Exception("Permission denied.");
                }

                self::delete("document/" . (int)$doc_id);
            }
        } catch (\Exception $e) {
            return self::jsonResponse(["success" => false, "error" => $e->getMessage()]);
        }

        return self::jsonResponse(["success" => true]);
    }

    /**
     * @param Request $request
     * @param User $user
     * @param array $args
     * @return JsonResponse
     */
    public static function getCategories(Request $request, User $user, array $args): jsonResponse
    {
        $type = $request->getQueryValue("type");
        try {

            $categories = self::get("category", [
                'entity_id' => (int)$args['id'],
                'entity_type' => $args['type'] ?? $type ?? self::ENTITY_PROJECT
            ]);
        } catch (\Exception $e) {
            return self::jsonResponse(["error" => $e->getMessage()]);
        }

        return self::jsonResponse($categories ?? []);
    }

    /**
     * @param Request $request
     * @param User $user
     * @return JsonResponse
     */
    public static function templates(Request $request, User $user): jsonResponse
    {

        $aid     = $user->getAccountId();
        $results =  self::get("template/$aid");
        $types   =  self::get("template/type");

        $assets  = [];
        foreach ($results as $asset) {
            $type = $types[$asset["type_id"]];
            $assets[$type][] = $asset;
        }

        $type = $request->getQueryValue("type");
        if ($type) {
            return self::jsonResponse($assets[$type] ?? []);
        }

        return self::jsonResponse($assets);
    }

    /**
     * @param array $params
     * @return DocumentCollection
     * @throws Exception
     */
    public static function getCollection(array $params = []): DocumentCollection
    {
        return new DocumentCollection(self::get("document", $params), DocumentModel::class);
    }

    /**
     * @param Request $request
     * @param User $user
     * @param array $args
     */
    public static function clone(Request $request, User $user, array $args): jsonResponse
    {

        $document = self::load((int) $args["did"]);
        if (!$document->hasData()) {
            return self::jsonResponse(["error" => "Document not found", "success" => false]);
        }
        /**
         * We want to check if the doc has an owner and if it does, is this the user,
         * if a doc has no owner, then it can be considered free to clone i.e a c-link template
         */
        $owners_count = count($document->getOwnerIds());
        $hidden_count = count($document->getHiddenIds());
        if ($owners_count > 0 && $owners_count != $hidden_count && !$document->isOwner($user)) {
            throw new \Exception("Permission denied.");
        }

        $clone = $document->clone($request->getJson(), ["s3_key", "id", "created_at", "owner"])
            ->setData("owner_id", $user->getAccountId());


        $res = self::post("document", $clone->getData());

        $success = $res->getStatus() === 200;
        $id = ($success) ? $res->json()["data"]["id"] : null;

        // Copy the s3 file.
        $s3_key = $document->getS3Path($id . "-" . $document->getData("name"));
        S3::copy($document->getData('s3_key'), $s3_key, S3::getBucket($clone->getData('s3_bucket')));
        self::patch("document/$id", ["s3_key" => $s3_key]);

        return self::jsonResponse(["success" => $success, "id" => $id]);
    }

    /**
     * @param Request $request
     * @param User $user
     * @param array $args
     * @return mixed
     */
    public static function getContent(Request $request, User $user, array $args)
    {
        $doc = $args['document'];
        //Here we need check for document type instead of assuming it json,  but for now all docs
        //are json

        $meta = $doc->getMeta();

        try {
            if (($meta['number_document'] ?? false) == true && !isset($meta['temp_snapshot'])) {
                $aid = $user->getAccountId();
                $provider = 'asite';
                $providerId = SnapshotService::getProviderIdForAccount($aid, $provider);

                if ($providerId) {
                    $docData = $doc->getDocData();
                    $projectId = $docData['project']->getId() ?? 0;
                    $integration = SnapshotService::getProjectIntegration($projectId, $providerId);

                    if ($integration) {
                        $mode = DownloadManager::resolveDocumentType($doc->getId());
                        DownloadManagerFactory::make($provider)->dispatch([
                            'project_id'         => $projectId,
                            'tender_id'          => $docData['tender']->getId() ?? 0,
                            'parent_document_id' => $doc->getId(),
                            'uid'                => $user->getId(),
                            'aid'                => $aid,
                            'mode'               => $mode,
                            'provider_id'        => $providerId,
                        ], 'preview_snapshot');
                    }
                }
            }
        } catch (\Exception $e) {
            error_log("Error dispatching preview snapshot queue: {$e->getMessage()}");
        }

        if (isset($doc->getMeta()['quote'])) {
            $quote = $doc->getMeta()['quote'];
            $signers = DocCategoryApi::get(sprintf("document/%s/signers", $doc->getId()));
            $signers = array_shift($signers);

            $pid = $meta['quote']['tender']['project_id'];
            $tid = $meta['quote']['tender']['id'];
            $mapping = Project::get("project/{$pid}/account-group-mapping");
            $mapping = array_shift($mapping);
            $groupId = $mapping['account_group_id'] ?? null;
            $group = null;
            $accountId = $user->getAccountId();
            $account = Account::get("account/$accountId");
            $account = array_shift($account);

            if ($groupId) {
                $group = Account::get("account/" . $accountId . "/group/" . $groupId);
                if (isset($group['data'])) {
                    $group = $group['data'];
                }
            }

            $logo = $account['logo'] ?? null;
            $address = $account['address'] ?? null;

            if (!empty($group) && !empty($group['logo']) && !empty($group['address'])) {
                $logo = $group['logo'];
                $address = $group['address'];
            }

            $meta['group'] = [
                'logo' => $logo,
                'address' => $address
            ];

            // Get "In Queue" status id
            $inQueueStatus = TenderApi::getHistoryTypes()->filterByField("uid", "in_queue")->getFirst()->getId();
            try {
                $tenderHistory = Project::get("project/" . $pid . "/tender/" . $tid . "/history");
            } catch (\Exception $e) {
                $tenderHistory = [];
            }

            $lastHistory = null;
            if (!empty($tenderHistory)) {
                $tenderHistory = array_shift($tenderHistory);
                $history = $tenderHistory["history"];
                $lastHistory = array_shift($history);
            }
            // Get the order for this quote
            $order = Project::get("transaction/" . $quote['id']);
            $order = array_shift($order);
            $status = OrderModel::getStatus($order, $signers ?? [], DocCategoryApi::get("signatory/status"));

            if (
                $lastHistory
                && $lastHistory["tender_history_type"] === 'Order'
                && (int)($quote['subcontractor_id'] ?? 0) === (int)($lastHistory["specialist_id"] ?? 0)
            ) {
                $status = TenderApi::getHistoryTypes()->filterById($lastHistory["status_id"])->getFirst()->getData("label");
            }
            if ((int)$order['status_id'] === Transactions::TRANSACTION_STATUS_WITHDRAWN) {
                $status = OrderModel::STATUS_WITHDREW;
            }

            $meta['quote']['order_number'] = $order['order_number'] ?: $meta['quote']['order_number'];
            $meta['quote']['status'] = $status ?: null;

            if (self::TOGGLE_DRAFT_WORK) {
                $entries = Transaction::getOrders($pid, $tid);
                $entries = array_shift($entries);
                $has_document_pending = false;
                if ($entries) {
                    foreach ($entries['entries'] as $entry) {
                        if (!in_array($entry['status'], self::DOCUMENT_STATUS_INACTIVE, true)) {
                            $has_document_pending = true;
                            break;
                        }
                    }
                }
                $meta['can_send'] = !$has_document_pending;
            }

            $tenderRecommendation = Project::get("project/$pid/tender_recommendation");
            $specificTenderRecommendation = array_filter($tenderRecommendation, function ($item) use ($tid) {
                return (int)$item['tender_id'] === (int)$tid;
            });

            $meta["has_tender_recommendation"] = !empty($specificTenderRecommendation);

            // Get Order Logs
            $orderLogs = OrderApprover::get(sprintf("order_approver/transaction/%s/log", $quote['id']));
            $meta['order_logs'] = $orderLogs;
        }

        //@TODO move this to the api and allow to query the has_published_version for a tender id
        //HAS PUBLISHED BOQ
        if ($doc->isTenderDocument()) {
            $category = $doc->getData("category");
            $category = array_shift($category);
            $cid = $category['category_id'] ?? 0;
            $pid = 0;
            $tid = 0;
            $has_boq = false;
            $features = Account::get(
                sprintf("feature/accounts/%s", $user->getAccountId()),
                ['feature' => self::TENDER_INQUIRY_APPROVAL]);
            if ($cid) {
                $category_data = Category::get("category/$cid");
                if ($category_data) {
                    $tid   = $category_data['entity_id'] ?? 0;
                    $pid   = $category_data['parent_id'] ?? 0;
                    $token = app()->Cookie->getCookie('token');
                    $boq   = BoQApi::get("boq/" . $pid, [], ['Authorization' => "Bearer $token"]);
                    if ($boq) {
                        array_map(function ($item) use ($tid, &$has_boq) {
                            if (((int)$item['tender']['id'] === $tid)) {
                                $has_boq = $item['has_published_version'] ?? false;
                            }
                        }, $boq);
                    }
                }
            }

            if ($pid) {
                $mapping = Project::get("project/{$pid}/account-group-mapping");
                $mapping = array_shift($mapping);
                $groupId = $mapping['account_group_id'] ?? null;

                $accountId = $user->getAccountId();
                $group = null;
                if ($groupId) {
                    $groupRes = Account::get("account/$accountId/group/$groupId");
                    $group = $groupRes['data'] ?? $groupRes;
                }

                $logo = $group['logo'] ?? null;
                $address = $group['address'] ?? null;

                $meta['group'] = [
                    'logo' => $logo,
                    'address' => $address
                ];
            }
            if (!empty($features)) {
                $docId = (int) $doc->getId();
                $assignedApprover = Project::get(
                    sprintf(
                        'approvals?entity_id=%d&entity_type=%s',
                        $docId,
                        urlencode('document')
                    )
                );
                $meta['tenderDocType'] = $doc->getData()['name'];
                $meta['workPackageName'] = $category_data['label'];

                $isSent = false;
                if ($pid && $tid) {
                        $historyData = Project::get(
                            "project/{$pid}/tender/history",
                            ['tender_history_type' => Project::TENDER_ENQUIRY_TYPE]
                        );
                        $enquiries = $historyData[$pid]['tender'][$tid][Project::TENDER_ENQUIRY_TYPE] ?? [];
                        if ($enquiries) {
                            $items = array_merge([], ...array_map(
                                static fn($enquiry) => $enquiry['history'] ?? [],
                                $enquiries
                            ));
                            foreach ($items as $item) {
                                $m = json_decode($item['meta'] ?? '', true);
                                if (!empty($m['document']) && (int) ($m['enquiry'] ?? 0) === $docId) {
                                    $isSent = true;
                                    break;
                                }
                            }
                        }
                }

                if ($isSent) {
                    $meta['status'] = 'Sent';
                } elseif (!empty($assignedApprover)) {
                    $meta['status'] = Project::buildEnquiryApprovalInfo($assignedApprover);
                } else {
                    $meta['status'] = ((int) ($doc->getData()['status'] ?? 0) === 0) ? 'Draft' : 'Published';
                }
            }
        }

        $response = [
            'loaded_doc_id' => $doc->getId(),
            'content' => json_decode($doc->getContent(), true),
            'meta' => $meta,
            'has_boq' => $has_boq ?? false
        ];
        return self::jsonResponse($response);
    }

    /**
     * @param Request $request
     * @param User $user
     * @param array $args
     * @return JsonResponse
     * @throws \Exception
     */
    public static function saveContent(Request $request, User $user, array $args): JsonResponse
    {
        $doc = $args["document"];
        if (!$key = $doc->getData("s3_key")) {
            self::throwJsonException("Document does not have a s3 key");
        }

        S3::uploadContent(
            $doc->getData("s3_bucket"),
            $key,
            $request->getStream(),
        );

        $logData = [
            'user_id' => $user->getId(),
            'transaction_id' => $doc->getMeta()['quote']['id'],
            'type' => 'Order Edited',
            'meta' => json_encode(['user_name' => $user->getFullName(), 'description' => sprintf("Order edited by %s", $user->getFullName())])
        ];

        OrderApprover::post("order_approver/log", $logData);

        //Perhaps we should check the response from s3 here?
        return self::jsonResponse(["success" => true]);
    }

    /**
     * @param Request $request
     * @param User $user
     * @param array $args
     * @return JsonResponse
     */
    public static function restore(Request $request, User $user, array $args): jsonResponse
    {
        $document = $args["document"];
        $parent   = $args["parent"];
        $success  = false;

        if ($content = $parent->getContent()) {
            if ($document->isS3Configured()) {
                $document->setContent($content);
                $success = true;
            }
        }

        return self::jsonResponse(["success" => $success]);
    }

    /**
     * @param string $uid
     * @return Abstraction
     * @throws Exception
     */
    public static function getSubType(string $uid)
    {
        $type = self::getSubTypes()->filter(
            function ($i) use ($uid) {
                return $i->getData("uid") === $uid;
            }
        )->getFirst();

        if (!$type) {
            self::throwJsonException("Missing Document Subtype " . $uid);
        }

        return $type;
    }

    /**
     * @param int $did
     * @return mixed
     * @throws Exception
     */
    public static function getTemplateCategories(int $did)
    {
        return new Collection(self::get("document/$did/category"), DocumentCategoryModel::class);
    }

    /**
     * @param Request $request
     * @param User $user
     * @param array $args
     * @return mixed
     */
    public static function assignApprovers(Request $request, User $user, array $args)
    {
        try {
            $requestData = $request->getJson();
            $doc = $args['document'];
            $token = app()->Cookie->getCookie('token');
            $id = $doc->getId();
            $res = Api::post("document/{$id}/approvers", $requestData, ['Authorization' => "Bearer $token"]);
            return self::jsonResponse($res->json(), $res->getInfo()['http_code']);
        } catch (\Exception $e) {
            return self::jsonResponse(["error" => $e->getMessage()], 400);
        }
    }

    /**
     * @param Request $request
     * @param User $user
     * @param array $args
     * @return mixed
     */
    public static function orderApproval(Request $request, User $user, array $args)
    {
        try {
            $requestData = $request->getJson();
            $doc = $args['document'];
            $token = app()->Cookie->getCookie('token');
            $id = $doc->getId();
            $res = Api::post("document/{$id}/order/approval", $requestData, ['Authorization' => "Bearer $token"]);
            return self::jsonResponse($res->json(), $res->getInfo()['http_code']);
        } catch (\Exception $e) {
            return self::jsonResponse(["error" => $e->getMessage()], 400);
        }
    }
}
