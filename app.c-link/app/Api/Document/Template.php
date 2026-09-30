<?php

namespace App\Api\Document;

use App\Api\Account;
use App\Api\Document as DocumentApi;
use App\Api\Tender;
use App\core\Request;
use App\Api\Document;
use App\Models\Collection;
use App\Models\User;
use App\Api\Client\Response\JsonResponse;
use App\Api\S3;
use App\Api\Document\Validator as DocumentValidator;
use App\Api\Client\Validator;
use App\Api\ProcurementScheduleOverview;
use App\Models\Document as DocumentModel;
use App\Api\Project\Validator as ProjectValidator;
use App\Models\Shortcode\Parser as ShortcodeParser;
use App\Models\Account as AccountModel;
use App\Models\Transaction;

class Template extends Document
{

    /**
     * Allow Config to be overridden
     */
    const API_CONFIG_KEY = "document";

    const TENDER_ENTITY_TYPE = "tender_asset";

    const ORDER_ENTITY_TYPE = "order_asset";

    const SOW_ENTITY_TYPE = "sow_template";

    const ENQUIRY_ISSUE_DATE_MILESTONE_LABEL = "Enquiry Issue Date";

    /**
     * @var array
     */
    protected static $security = [
        "methods" => [
            "fetchAll" => [
                "type" => "GET",
                "requires_session" => true
            ],
            "fetch" => [
                "type" => "GET",
                "requires_session" => true,
                "pre_checks" => [
                    [DocumentValidator::class, "canView"],
                    "loadChildren"
                ],
                "required_args" => [
                    "did" => "int"
                ]
            ],
            "getContent" => [
                "type" => "GET",
                "requires_session" => true,
                "pre_checks" => [
                    [DocumentValidator::class, "canView"],
                    "loadChildren",
                ],
                "required_args" => [
                    "did" => "int"
                ]
            ],
            "saveContent" => [
                "type" => "GET",
                "requires_session" => true,
                "pre_checks" => [
                    [DocumentValidator::class, "canView"],
                    "loadChildren",
                    "saveChildren"
                ],
                "required_args" => [
                    "did" => "int"
                ]
            ],
            "create" => [
                "type" => "GET",
                "requires_session" => true,
                "pre_checks" => [
                    [Validator::class, "hasJsonData"]
                ],
                "required_args" => [
                    "name" => "string",
                    "type" => "string"
                ]
            ],
            "config" => [
                "type" => "GET",
                "requires_session" => true,
                "pre_checks" => [
                    [DocumentValidator::class, "isOwner"],
                    [ProjectValidator::class,  "isOwner"]
                ],
                "required_args" => [
                    "did" => "int",
                    "pid" => "int",
                    "tid" => "int"
                ]
            ],
            "restore" => [
                "type" => "PATCH",
                "pre_checks" => [
                    [DocumentValidator::class, "isOwner"]
                ],
                "required_args" => [
                    "did" => "int"
                ]
            ],
            "values" => [
                "type" => "PATCH",
                "pre_checks" => [
                    [Validator::class, "hasJsonData"],
                    [DocumentValidator::class, "isOwner"]
                ],
                "required_args" => [
                    "did" => "int"
                ]
            ],
            "meta" => [
                "type" => "PATCH",
                "pre_checks" => [
                    [Validator::class, "hasJsonData"],
                    [DocumentValidator::class, "isOwner"]
                ],
                "required_args" => [
                    "did" => "int"
                ]
            ],
            "getContentFromUrl" => [
                "type" => "GET",
                "requires_session" => true,
                "required_args" => [
                    "path" => "string"
                ]
            ]
        ]
    ];

    /**
     * @return array|\array[][]
     */
    public static function getSecurity()
    {
        return self::$security;
    }



    /**
     * @param Request $request
     * @param User $user
     * @param array $args
     * @return mixed
     */
    public static function getContent(Request $request, User $user, array $args)
    {
        $response = [
            'loaded_doc_id' => $args['did'],
            'content' => ''
        ];

        if (isset($args['document'])) {
            $document = $args['document'];
            $subtypes = self::getSubTypes();
            $assets_ids = $subtypes->filterByRegex('uid', '.*_asset')->getIds(true);

            //get the content from the child if we dont want to load a child document
            if (!$request->getQueryValue("order_document_id")) {
                $child = $args['document']->getChildren()->filterByModelFunction('isOfSubType', true, $assets_ids)->getFirst();
                $document = $child ?? $args['document'];
            } else {
                if ($args['document']->getChildren()) {
                    $child = $args['document']->getChildren()->filterByModelFunction('isOfSubType', true, $assets_ids);
                    foreach ($child as $child_value) {
                        $meta = $child_value->getData("meta");
                        if (isset($meta) && $meta) {
                            $json = json_decode($meta, true);
                            if (isset($json['did'])) {
                                if ((int)$request->getQueryValue("order_document_id") === (int)$json['did']) {
                                    $document = $child_value;
                                    break;
                                }
                            }
                        }
                    }
                }
            }

            $content = json_decode($document->getContent(), true);
            $response = [
                'loaded_doc_id' => $document->getData("id"),
                'content' => $content,
                'meta' => $document->getMeta()
            ];
        }

        return self::jsonResponse($response);
    }

    /**
     * @param Request $request
     * @param User $user
     * @param array $args
     * @return JsonResponse
     */
    public static function values(Request $request, User $user, array $args): JsonResponse
    {
        $doc  = $args["document"];
        $meta = $doc->getMeta();
        if (!isset($meta["values"])) {
            $meta["values"] = [];
        }
        return self::jsonResponse(self::saveValue($request->getJson(), $doc, $meta, $user->getAccountId()));
    }

    public static function meta(Request $request, User $user, array $args): JsonResponse
    {
        $doc = $args["document"];
        $newMeta = $request->getJson();
        $res = self::patch("document/" . $doc->getId(), ["meta" => json_encode($newMeta)]);
        return self::jsonResponse(["success" => ($res->getStatus() === 203)]);
    }

    /**
     * @param DocumentModel $doc
     * @return void
     * @throws \App\Api\Exception
     */
    public static function setDocumentAsPubished(DocumentModel $doc)
    {
        //We have to update the tender so we can tell if it has a doc or not
        // It's also a bit crummy but we need to tell if doc is tender addendum or normal tender template,
        // This should be refactored in the future!
        $categories = DocumentApi::getTemplateCategories($doc->getId());
        /*
         * Need to check if the template is a tender template
         */
        $category = $categories->filterByField('entity_type', TenderTemplate::ENTITY_TYPE)->getFirst();
        if ($category) {
            $project = ProjectValidator::getProjectContext($category->getData('parent_id') ?? false);
            $tender = $project->getTender($category->getData('entity_id') ?? 0);
            $hasDockey = "has_document";
            if ((strcasecmp($doc->getData("name"), TenderTemplate::TENDER_ADDENDUM) === 0)) {
                $hasDockey = "has_tender_addendum";
            } else {
                if (!$tender->getData('has_document')) {
                    //If user completing a tender document, we need to update the enquiry issue date milestone to "In Progress"
                    ProcurementScheduleOverview::milestoneInProgress($tender->getId(), self::ENQUIRY_ISSUE_DATE_MILESTONE_LABEL);
                }
            }
            //We also need to update a flag with the tender to say we have a document
            Tender::patch($tender->getApiUrl(), [$hasDockey => 1]);
        }
    }

    public static function saveValue($data, $doc, $meta, $user_id = 0)
    {
        $values = ShortcodeParser::parseValues($data, $doc->getShortCodes());
        foreach ($values as $k => $v) {
            $meta["values"][$k] = $v;
        }
        $tender = $doc->getDocData()['tender'];
        $sync_values = $doc->getSyncTenderValues($tender, $values);
        if ($sync_values) {
            Tender::patch($tender->getApiUrl(), $sync_values);
        }

        if (isset($data['signatory_wet'])) {
            $meta['signatory_wet'] = $data['signatory_wet'];
        }

        $doc->setData("meta", $meta);
        try {
            //Check to see if document has all the correct values, and if so published
            $status = self::getDocumentStatus($doc);
            //Check to see if it has a SOW
            $doc_parent = self::get("document/" . $doc->getId() . "/children", [
                "owner_id" => $user_id,
            ]);

            //Check to see if we need to check for a SOW and if the SOW is created
            $type     = self::getSubType(self::SOW_ENTITY_TYPE);
            $status = $status && $doc->checkForSow($doc_parent, (int)$type->getId());

            if ($status) {
                self::setDocumentAsPubished($doc);
            }
        } catch (\Exception $e) {
            self::throwJsonException($e->getMessage());
        }

        $res = self::patch("document/" . $doc->getId(), ["status" => $status,  "meta" => json_encode($meta)]);
        return ["success" => ($res->getStatus() === 203)];
    }

    /**
     * @param DocumentModel $doc
     * @return int
     * @throws \Exception
     */
    public static function getDocumentStatus(DocumentModel $doc): int
    {
        $config = $doc->getConfig();
        $data = $config["data"] ?? [];
        $skipTypes = ['hidden', 'filemanager', 'reference'];

        foreach ($data as $group => $items) {
            foreach ($items as $k => $item) {
                if (in_array($item['type'] ?? '', $skipTypes, true)) {
                    continue;
                }

                $hasDefault = array_key_exists("default", $item) && isset($item["default"]) && $item["default"] !== "";
                $hasDataref = !empty($item["dataref"] ?? null);
                $hasValue   = isset($item["value"]) && $item["value"] !== null && $item["value"] !== "";

                if ($hasDefault || $hasDataref || $hasValue) {
                    // field considered filled → keep checking
                    continue;
                }

                // If none of the conditions are satisfied → return draft
                return 0;
            }
        }

        // All fields satisfied → published
        return ($data) ? 1 : 0;
    }

    /**
     * @param Request $request
     * @param User $user
     * @param array $args
     * @return JsonResponse
     * @throws \App\Api\Client\Response\JsonException
     * @throws \App\Api\Exception
     */
    public static function create(Request $request, User $user, array $args): JsonResponse
    {
        $type = $args["type"];
        if (strpos($type, "custom_") !== 0) {
            //For now only allow users to create custom assets, not global ones!
            //In the future we can expand this logic for admins
            self::throwJsonException("Invalid Type $type");
        }

        $subtype = self::getSubTypes()->filterByField("uid",  $type)->getFirst();
        $cLable  = self::DOCUMENT_CONTRACTUAL_LABEL;
        if ($subtype) {
            $json     = $request->getJson();
            $meta     = ["config" => $json["config"] ?? ""];
            $document = new DocumentModel([
                "name"      => urldecode($args["name"]),
                "type"      => self::getDocumentType($cLable),
                "subtype"   => $subtype->getId(),
                "s3_bucket" => self::getConfig()["s3_contract_bucket"],
                'owner_id'  => $user->getAccountId(),
                'meta' => $meta,
                "parent_id" => $args["parent_id"] ?? 0
            ]);

            $res = self::post("document", $document->getData());
            $id = $res->iDResponse();
            if ($id) {
                $key = S3::getKey($id . ".json", "templates", ["custom", $subtype->getData("uid")]);
                $document->setId($id);
                $document->setData("s3_key", $key);
                self::patch('document/' . $document->getId(), ['s3_key' => $key]);
                $content = $json["content"] ?? "";
                if ($content) {
                    $document->setContent(json_encode($content));
                }
                return self::jsonResponse([
                    "id" => $id
                ]);
            }

            self::throwJsonException("Failed to write document");
        }

        self::throwJsonException("Invalid Asset Type");
    }

    /**
     * @param Request $request
     * @param User $user
     * @param array $args
     * @return JsonResponse
     * @throws \App\Api\Client\Response\JsonException
     */
    public static function config(Request $request, User $user, array $args): JsonResponse
    {
        try {
            $project = $args["project"];
            $source  = [
                "project" => $project,
                "tender"  => $project->getTender((int) $args["tid"])
            ];

            $results = $args["document"]->getConfig();

            //Load subcontractor & transaction data if we are NOT in a enquiry document
            $subcontractor = null;
            if (!$args["document"]->isTenderDocument()) {
                $quote = $args["document"]->getMetaValue("quote");
                $qid = $quote['id'] ?? null;
                $sid = $quote['subcontractor_id'] ?? null;
                $subcontractor = new AccountModel(Account::getAccount($sid), $sid);

                $transactionData = Tender::get("transaction", ['id' => $qid]);
                $transactionData = array_shift($transactionData);
                $transaction = new Transaction($transactionData, $qid ?? null);
                $source["transaction"] = $transaction;
            }

            foreach ($results["data"] as $group => $items) {
                foreach ($items as $k => $item) {
                    if (is_null($item["value"]) || isset($item['sync'])) {
                        $ref = $item["dataref"] ?? "";
                        if (strpos($ref, ".")) {
                            list($type, $field) = explode(".", $ref);
                            if (isset($source[$type])) {
                                $value = $source[$type]->getData($field);
                                if (method_exists($source[$type], $field)) {
                                    if (isset($item["args"]['models']) && $subcontractor) {
                                        $item['args']['subcontractor'] = $subcontractor;
                                    }
                                    $item['args']['document'] = $args['document'];
                                    $value = $source[$type]->$field($item["args"] ?? null);
                                }
                                $results["data"][$group][$k]["value"] = $value;
                            }
                        }
                    }
                }
            }


            return self::jsonResponse($results);
        } catch (\Exception $e) {
            self::throwJsonException($e->getMessage(), 500, $e);
        }
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
        $parent = $args["document"];
        $child  = $args["child"];
        $order_document_id = $request->getQueryValue("order_document_id");

        if (!$child) {
            self::throwJsonException("Failed to save content, no document found");
        }

        if ($order_document_id || !$child->getData("s3_key")) {
            $id = $child->getId();
            $key = s3::getKey($id . ".json", self::DOCUMENT_CONTRACTUAL_LABEL);
            $child->setData("s3_key", $key);
            $child->setData("s3_bucket", self::getConfig()["s3_contract_bucket"]);

            if (!$order_document_id) {
                self::patch('document/' . $id, ['s3_key' => $key, 'parent_id' => $parent->getId()]);
            } else {
                $child_data = $child->getData();
                unset($child_data['id']);
                self::patch('document/' . $id, $child_data + ['s3_key' => $key, 'parent_id' => $parent->getId(), 'meta' => ['did' => $order_document_id]]);
            }
        }

        S3::uploadContent(
            $child->getData("s3_bucket"),
            $child->getData("s3_key"),
            $request->getStream(),
        );

        $docId = $child->getId();
        return self::jsonResponse(["success" => !is_null($docId), 'id' => $docId]);
    }

    /**
     * @param Request $request
     * @param User $user
     * @return JsonResponse
     */
    public static function fetch(Request $request, User $user, array $args): jsonResponse
    {
        return self::jsonResponse(
            array_merge(
                $args["document"]->getData(),
                ["children" => $args["document"]->getChildren()]
            )
        );
    }

    /**
     * @param Request $request
     * @param User $user
     * @return JsonResponse
     */
    public static function fetchAll(Request $request, User $user, array $args): jsonResponse
    {
        $typeFilter = $request->getQueryValue("type");
        $subtypes = self::getSubTypes();

        $results = self::getCollection([
            "subtype" =>
            implode(",", $subtypes->filterByRegex('uid', '^[a-z]+_asset')->getIds()),
            "parent_id" => 0
        ]);

        /*
         * Check for assets that we need to hide for users
         */
        $hidden_ids = $results->hideByOwnership($user);
        if ($hidden_ids->count() > 0) {
            $results = $results->filterByExistInArray("id", $hidden_ids->getIds(), false, false);
        }

        /*
         * Load custom assets
         */
        $customAssets = self::getCollection([
            "subtype" =>
            implode(",", $subtypes->filterByRegex('uid', 'custom_[a-z]+_asset')->getIds()),
            "owner_id" => $user->getAccountId(),
            "parent_id" => 0
        ]);

        /*
         * Merging both normal assets and custom assets if the user has custom assets
         */
        if ($customAssets->count() > 0) {
            /*
             * If we have the same default templates as "custom" we need to show the custom one instead
             * A document that was modified/saved from a default one will become "custom"
             */
            $custom_assets_names = [];
            foreach ($customAssets->getItems() as $custom_asset) {
                $custom_assets_names[] = $custom_asset->getData("name");
            }
            $results = $results->filterByExistInArray("name", $custom_assets_names, false, false);
            $results = array_merge($results->getItems(), $customAssets->getItems());
            $results = new Collection($results, DocumentModel::class);
        }

        $data = ["orders" => [], "tenders" => [], "sow" => [], "soa" => [], "soamc" => [], "miniboq" => []];
        foreach ($results->filterByField("status", 0, "!=")->getItems()  as $template) {
            $templateData = $template->getData();
            $type = "";
            $typeUid = $subtypes->filterById((int)$template->getData('subtype'))->getFirst()->getData('uid');

            if (preg_match("/.*order/", $typeUid)) {
                $type = "orders";
            } elseif (preg_match("/.*sow/", $typeUid)) {
                $type = "sow";
            } elseif (preg_match("/.*soamc/", $typeUid)) {
                $type = "soamc";
            } elseif (preg_match("/.*soa/", $typeUid)) {
                $type = "soa";
            } elseif (preg_match("/.*miniboq/", $typeUid)) {
                $type = "miniboq";
            } elseif (preg_match("/.*tender/", $typeUid)) {
                $type = "tenders";
            }
            if ($type) {
                $data[$type][] = $templateData;
            }
        }

        return self::jsonResponse(($typeFilter) ? $data[$typeFilter] ?? [] : $data);
    }

    /**
     * @param Request $request
     * @param User $user
     * @param array $args
     * @return JsonResponse
     */
    public static function loadChildren(Request $request, User $user, array &$args)
    {
        $did = (int)$args['did'];
        $context = DocumentValidator::getDocument($did, $args);
        $order_document_id = (int)$request->getQueryValue("order_document_id");
        try {
            if ($order_document_id) {
                $results = self::get("document", ['owner_id' => $user->getAccountId(), "subtype" => $context->getData("subtype")]);
                foreach ($results as $result) {
                    $json = json_decode($result['meta'], true);
                    if (isset($json['did'])) {
                        if ($order_document_id === (int)$json['did']) {
                            $args['document'] = new DocumentModel($result, $result['id']);
                            $args['document']->setChildren([]);
                            break;
                        }
                    }
                }
            } else {
                $results = self::get(
                    "document/$did/children",
                    ['owner_id' => $user->getAccountId(), "subtype" => $context->getData("subtype")]
                );
                if ($results['parent']) {
                    $args['document'] = new DocumentModel($results['parent'], $did);
                    $args['document']->setChildren($results['children']);
                }
            }
        } catch (\Exception $e) {
            self::throwJsonException($e->getMessage(), 500, $e);
        }
    }

    /**
     * Here we ensure that we always use a child if there is no one, then we create one.
     * This is useful for company assets as we never want to override the default
     * @param Request $request
     * @param User $user
     * @param array $args
     */
    public static function saveChildren(Request $request, User $user, array &$args)
    {
        $did    = (int)$args['did'];
        $order_document_id = $request->getQueryValue("order_document_id");
        $assets = self::getSubTypes()->filterByRegex("uid", ".*_asset")->getIds();
        $clone = true;

        if (!$args['document']->hasChildren($assets)) {
            $meta = $args['document']->getData("meta");
            if ($json = json_decode($meta, true)) {
                $json_did = $json['did'] ?? null;
                $child = $args['document'];
                if ($order_document_id && (int)$json_did === (int)$order_document_id) {
                    $clone = false;
                }
            }
            if ($clone) {
                $res = self::post("document/$did/clone", ['owner_id' => $user->getAccountId(), 's3_key' => '']);
                $success = $res->getStatus() === 200;
                $doc_id = ($success) ? $res->json()["data"]["id"] : null;
                $child = new DocumentModel($res->json()['data'], $doc_id);
            }
        } else {
            $child = $args['document']->getChildren()->filterByModelFunction("isOfSubType", true, $assets)->getFirst();
        }

        $args['child'] = $child;
    }

    /**
     * @param int $id
     * @param int $aid
     * @return int
     * @throws \App\Api\Exception
     */
    public static function getLoadedDocId(int $id, int $aid): int
    {
        $results = Document::get("document/$id/children", ['owner_id' => $aid, 's3_bucket' => 'document']);
        if ($results['children']) {
            foreach ($results['children'] as $k => $v) {
                if ($v['subtype'] == (int)$results['parent']['subtype']) {
                    $id = $v['id'];
                    break;
                }
            }
        }

        return $id;
    }

    /**
     * @param Request $request
     * @param User $user
     * @param array $args
     * @return JsonResponse
     * @throws \App\Api\Client\Response\JsonException
     * @throws \App\Api\Exception
     */
    public static function restore(Request $request, User $user, array $args): jsonResponse
    {

        $parentId = $args["document"]->getData("parent_id");
        if (!$parentId) {
            self::throwJsonException("Can not restore, document has no parent");
        }
        $parent = self::load($parentId);
        if ($content = $parent->getContent()) {
            $args["document"]->setContent($content);
            return self::jsonResponse(["success" => true]);
        }
        self::throwJsonException("parent has no content");
    }

    public static function getContentFromUrl(Request $request, User $user, array $args): jsonResponse
    {
        $url = isset($args['path']) ? $args['path'] : null;
        if (!$url) {
            self::throwJsonException("No url");
        }

        $json = file_get_contents(urldecode($url));
        if ($json === false) {
            self::throwJsonException("None available json from the url");
        }

        $data = json_decode($json);
        if ($data === null) {
            self::throwJsonException("Was not possible decode the json");
        }

        return self::jsonResponse($data);
    }
}
