<?php

namespace App\Api\Tender;

use App\Api\Client;
use App\Api\Document;
use App\Api\Document\Category as DocCategoryApi;
use App\Api\Project;
use App\Api\Project\Validator as ProjectValidator;
use App\Api\Transactions as TransactionsApi;
use App\core\Request;
use App\Models\Document as DocumentModel;
use App\Models\User;
use App\Api\Account as AccountApi;
use App\Api\Api;
use App\Models\Document\Category as CategoryModel;
use App\Api\Document\Validator as DocumentValidator;
use App\Api\Document\TenderTemplate;
use App\Models\Collection;
use App\Api\S3;
use App\Models\Tender\Quote as QuoteModel;
use App\Api\Document as DocumentApi;
use App\Api\Document\Validator as DocValidator;
use App\Api\Document\Routine;
use App\Api\Document\NumberDocument;
use App\Api\Document\Sow;
use App\Api\Client\Response\JsonResponse;
use App\Api\OrderApprover;
use App\Api\ProcurementScheduleOverview;
use App\Models\Transaction;

class Order extends Client
{

    const ENTITY_TYPE = "order_template";

    /**
     * Allow Config to be overridden
     */
    const API_CONFIG_KEY = "project";

    const PUBLISHED_DOC_STATUS = 1;

    const DRAFT_DOC_STATUS = 0;

    /* TODO: Remove if we decide to drop draft orders work */
    const TOGGLE_DRAFT_WORK = false;

    /**
     * @var array
     */
    protected static $security = [
        "methods" => [
            "create" => [
                "type" => "POST",
                "requires_session" => true,
                "required_args" => [
                    "qid" => "int",
                    "sid" => "int",
                    "did" => "int"
                ],
                "pre_checks" => [
                    [DocValidator::class, "canView"],
                    "loadQuote"
                ]
            ],
            "fetchAll" => [
                "type" => "GET",
                "requires_session" => true,
                "required_args" => [
                    "pid" => "int"
                ],
                "pre_checks" => [
                    [ProjectValidator::class, "isOwner"]
                ]
            ],
            "remove" => [
                "requires_session" => true,
                "type" => "DELETE",
                "required_args" => self::TOGGLE_DRAFT_WORK ? [
                    "pid" => "pid",
                    "tid" => "int",
                    "qid" => "int",
                    "did" => "int"
                ] : [
                    "pid" => "pid",
                    "tid" => "int",
                    "did" => "int"
                ],
                "pre_checks" => [
                    [ProjectValidator::class, "isOwner"]

                ]
            ],
            "approvalReminder" => [
                "type" => "POST",
                "requires_session" => true,
                "required_args" => [
                    "did" => "int"
                ]
            ],
        ]
    ];

    /**
     * @return array|\array[][]
     */
    public static function getSecurity(): array
    {
        return self::$security;
    }

    /**
     * @param Request $request
     * @param User $user
     * @param array $args
     * @return JsonResponse
     * @throws Client\Response\JsonException
     * @throws \App\Api\Exception
     */
    public static function create(Request $request, User $user, array $args): JsonResponse
    {

        $template = $args["document"];
        $subType  = DocumentApi::getSubTypes()->filterById($template->getData("subtype"))->getFirst();

        if ($subType && in_array($subType->getData("uid"), ["custom_order_asset", "order_asset"])) {

            $orderMeta = [
                "values" => ["order_value" => $args["quote"]->getCurrentPrice()],
                "quote"  => $args["quote"]->getData() + ['subcontractor' => AccountApi::getAccount((int)$args["quote"]->getData('subcontractor_id'))]
            ];
            $meta = array_merge($template->getMeta(), $orderMeta);
            $syncing = self::syncTenderOrderShortcodesAnswers($args["quote"], $template);
            $orderTemplate = DocumentApi::getSubTypes()->filterByField("uid", "order_template")->getFirst();
            $clone = Routine::cloneAndUpload(
                $template,
                $user,
                $orderTemplate,
                DocumentApi::DOCUMENT_CONTRACTUAL_LABEL,
                [self::ENTITY_TYPE],
                ["meta" => $meta]
            );

            $quote = $args["quote"]->getData();
            $category = Routine::getAllCreateDocumentCategory(
                $quote['tender_id'],
                self::ENTITY_TYPE,
                $quote['tender']['label'],
                $quote['tender']['project_id']
            );
            DocCategoryApi::patch("category/" . $category->getId() . "/document/" . $clone->getId(), []);

            $cloneMeta = $clone->getMeta();
            if ($syncing && key_exists("number_document", $cloneMeta) && $cloneMeta["number_document"]) {
                $orderContent = json_decode($clone->getContent(), true);
                $tenderContent = json_decode($syncing->getContent(), true);

                $orderContent = array_shift($orderContent);
                $tenderContent = array_shift($tenderContent);

                $orderContentChildren = $orderContent["children"] ?? [];
                $tenderContentChildren = $tenderContent["children"] ?? [];

                $tenderConditionalContent = [];
                foreach ($tenderContentChildren as $tenderChild) {
                    if (is_array($tenderChild) && isset($tenderChild['conditionalContent'])) {
                        $key = $tenderChild['conditionalContent'];
                        $tenderConditionalContent[$key][] = $tenderChild;
                    }
                }

                foreach ($orderContentChildren as &$orderChild) {
                    if (is_array($orderChild) && isset($orderChild['conditionalContent'])) {
                        $key = $orderChild['conditionalContent'];
                        if (isset($tenderConditionalContent[$key]) && !empty($tenderConditionalContent[$key])) {
                            $orderChild = array_shift($tenderConditionalContent[$key]);
                        }
                    }
                }
                unset($orderChild);

                $orderContent['children'] = $orderContentChildren;
                $clone->setContent(json_encode([$orderContent]));
            }

            //Clone the Enquiry SOW for the order
            $sowType = DocumentApi::getSubType(Sow::ENTITY_TYPE);
            if ($syncing && $syncing->hasChildren()) {
                if ($sow = $syncing->getChildren()->filterByField("subtype", (int)$sowType->getId())->getFirst()) {
                    $res = DocumentApi::Post(
                        "document/" . $sow->getId() . "/clone",
                        ["owner_id" => $user->getAccountId(), "parent_id" => $clone->getId()]
                    );
                    $meta['values']['subcontract_works'] = $res->iDResponse();
                }
            }

            //Add the shortcodes to the order
            if ($syncing && $syncing->getData("shortcodes")) {
                foreach ($syncing->getData("shortcodes") as $shortcode_key => $shortcode) {
                    if (str_ends_with($shortcode_key, '_file_upload') && $shortcode) {
                        $did = $shortcode;
                        $doc = DocumentApi::get("document/$did");
                        $docModel = new DocumentModel($doc, $did);
                        $cloneDoc = $docModel->clone(
                            ["parent_id" => $clone->getId()],
                            ["id", "s3_key", "created_at", "owner"]
                        )
                            ->setData("owner_id", $user->getAccountId());

                        $res = NumberDocument::post("document", $cloneDoc->getData());

                        $success = $res->getStatus() === 200;
                        $id = ($success) ? $res->json()["data"]["id"] : null;
                        $meta['values'][$shortcode_key] = $id;

                        if ($id) {
                            $s3_key = $docModel->getS3Path("nd-" . $id . ".json");
                            S3::copy($docModel->getData('s3_key'), $s3_key, S3::getBucket($cloneDoc->getData('s3_bucket')));
                            $res = DocumentApi::patch("document/$id", ["s3_key" => $s3_key]);
                        }
                    } else {
                        $meta['values'][$shortcode_key] = $shortcode;
                    }
                }
            }

            DocumentApi::patch(
                "document/" . $clone->getId(),
                ["meta" => $meta]
            );

            /*
           * Reset transaction status to sent
           */
            TransactionsApi::patch("project/" . $quote['tender']['project_id'] . "/tender/transaction/" . $orderMeta['quote']['id'], [
                "status_id"   => TransactionsApi::TRANSACTION_STATUS_SENT
            ]);

            $logData = [
                'user_id' => $user->getId(),
                'transaction_id' => $args["quote"]->getData('id'),
                'type' => 'Order Created',
                'meta' => json_encode(['user_name' => $user->getFullName(), 'description' => sprintf("Order created by %s", $user->getFullName())])
            ];

            OrderApprover::post("order_approver/log", $logData);

            // start the "Tender Approval/Issued" milestones
            ProcurementScheduleOverview::milestoneInProgress($quote['tender_id'], "Order Approval");
            ProcurementScheduleOverview::milestoneInProgress($quote['tender_id'], "Order Issued");
        } else {
            self::throwJsonException("Invalid Document Subtype of Order");
        }

        return self::jsonResponse(["id" => $clone->getId()]);
    }

    /**
     * @param Request $request
     * @param User $user
     * @param array $args
     * @return JsonResponse
     * @throws \App\Api\Exception
     */
    public static function fetchAll(Request $request, User $user, array $args): jsonResponse
    {
        $pid = $args["project"]->getId();
        $tidFilter = $request->getQueryValue("tid");         //filter by tender id
        $status    = $request->getQueryValue("status");      //filter by status id
        $group     = $request->getQueryValue("group", true); //group results by subcontractor id; default yes

        $response  = Transaction::getOrders($pid, $tidFilter, $status, $group);
        return self::jsonResponse(array_values($response));
    }

    /**
     * @param Request $request
     * @param User $user
     * @param array $args
     * @return JsonResponse
     * @throws \App\Api\Exception
     */
    public static function remove(Request $request, User $user, array $args): jsonResponse
    {
        $doc = $args["document"];

        $sent = false;
        foreach (Project::get("transaction", ["tender_id" => $args['tid']]) as $transaction) {
            $meta = json_decode($transaction['meta'] ?? '', true);
            if (isset($meta['order_template_id']) && $meta['order_template_id'] === (int)$doc->getId()) {
                $sent = true;
                break;
            }
        }

        if ($sent) {
            return self::jsonResponse(["success" => false, 'message' => 'Document published']);
        }

        if ($key = $doc->getData("s3_key")) {
            if ($bucket = $doc->getData("s3_bucket")) {
                S3::remove($key, S3::getBucket($bucket));
            }
        }

        $results = DocCategoryApi::get("category", [
            "entity_id"   => $args["tid"],
            "entity_type" => self::ENTITY_TYPE
        ]);

        if ($results) {
            $cat = (new Collection(array_values($results), CategoryModel::class))->getFirst();
            $hasDockey = "has_document";
            $documents = array_filter($cat->getData("documents"), function ($i) use ($doc) {
                return ($i["id"] !== (int) $doc->getId()) && $i['status'];
            });

            //If the tender template category no longer has any documents then we can update the tender to say no documents
            if (!$documents) {
                self::patch("project/" . $cat->getData("parent_id") . "/tender/" . $cat->getData("entity_id"), [$hasDockey => 0]);
            }
            //Attempt to delete mappings for that document
            TenderTemplate::delete("category/" . $cat->getId() . "/document/" . $doc->getId(), []);
        }

        $res = TenderTemplate::delete("document/" . $doc->getId());
        return self::jsonResponse(["success" => $res->getStatus() === 203]);
    }

    /**
     * @param Request $request
     * @param User $user
     * @param array $args
     * @return void
     * @throws Client\Response\JsonException
     */
    public static function loadQuote(Request $request, User $user, array &$args)
    {
        try {
            $quote  = self::get("transaction/" . $args["qid"]);
            $args["quote"] = new QuoteModel($quote[0], $args["qid"]);
            $args["project"] = $args["quote"]->getTender()->getProject();
        } catch (\Exception $e) {
            self::throwJsonException("Failed to get Quote", 500, $e);
        }

        if (!$args["project"]->isOwner($user)) {
            self::throwJsonException("Access Denied");
        }
    }

    /**
     * @param QuoteModel $quote
     * @param DocumentModel $template
     * @return DocumentModel|null
     * @throws \App\Api\Exception
     */
    public static function syncTenderOrderShortcodesAnswers(QuoteModel $quote, DocumentModel $template): ?DocumentModel
    {
        $category = Routine::getAllCreateDocumentCategory(
            (int)$quote->getTender()->getId(),
            TenderTemplate::ENTITY_TYPE,
            $quote->getTender()->getData("label"),
            (int)$quote->getTender()->getData("project_id")
        );

        $documents = $category->filterDocumentsByStatusId(Document::DOCUMENT_STATUS_PUBLISHED_ID);
        if ($publishedDocument = $category->getLatestDocument($documents)) {
            $did       = $publishedDocument->getId();
            $doc       = DocumentApi::get("document/$did/children");
            $doc_model = new DocumentModel($doc["parent"], $did);
            $doc_model->setData(
                "shortcodes",
                $publishedDocument->getMatchingShortcodesForTemplate($template->getTemplateShortcodes())
            );
            //syncing the SOW as this is done by reading the data from the "children" as it has a separate document entry to DB
            if (isset($doc["children"])) {
                $doc_model->setChildren($doc["children"]);
            }
        }

        return $doc_model ?? null;
    }

    /**
     * @param Request $request
     * @param User $user
     * @param array $args
     * @return void
     * @throws Client\Response\JsonException
     */
    public static function approvalReminder(Request $request, User $user, array &$args)
    {
        try {
            $requestData = $request->getJson();
            $token = app()->Cookie->getCookie('token');
            $res = Api::post(sprintf("order/%s/approvalReminder", $args['did']), $requestData, ['Authorization' => "Bearer $token"]);
            return self::jsonResponse($res->json(), $res->getInfo()['http_code']);
        } catch (\Exception $e) {
            return self::jsonResponse(["error" => $e->getMessage()], 400);
        }
    }
}
