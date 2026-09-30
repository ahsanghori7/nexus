<?php
namespace App\Api\Document;

use App\Api\Account;
use App\Api\Document as DocumentApi;
use App\Api\S3;
use App\Api\Tender;
use App\core\Request;
use App\Api\Document;
use App\Models\Collection;
use App\Models\User;
use App\Api\Client\Response\JsonResponse;

use App\Api\Project\Validator as ProjectValidator;
use App\Api\Document\Validator as DocumentValidator;
use App\Api\Document\Category as DocCategoryApi;
use App\Models\Document\Category as CategoryModel;
use App\Api\Document\Template as TemplateApi;
use App\Api\Project;
use App\Models\Document as DocumentModel;
use App\Models\Tender as TenderModel;
use App\Api\Tender as TenderApi;
use App\Models\UserModel;


class TenderTemplate extends Document {

    /**
     * Allow Config to be overridden
     */
    const API_CONFIG_KEY = "document";

    const ENTITY_TYPE = "tender_template";

    const TENDER_ADDENDUM = "Tender Addendum";

    const TENDER_INQUIRY_APPROVAL_LABEL = "TENDER_INQUIRY_APPROVAL";

    const TENDER_INQUIRY_APPROVAL_ENTITY_TYPE = "document";

    /**
     * @var array
     */
    protected static $security = [
        "methods" => [
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
            "create" => [
                "type" => "POST",
                "requires_session" => true,
                "required_args" => [
                    "pid" => "int",
                    "tid" => "int",
                    "did" => "int"
                ],
                "pre_checks" => [
                    [ProjectValidator::class, "isOwner"],
                    "tenderTemplateCategoryExists",
                    "documentIsAsset"
                ]
            ],
            "remove" => [
                "requires_session" => true,
                "type" => "DELETE",
                "required_args" => [
                    "pid" => "pid",
                    "tid" => "int",
                    "did" => "int"
                ],
                "pre_checks" => [
                    [ProjectValidator::class, "isOwner"],
                    [DocumentValidator::class, "isOwner"],

                ]
            ]
        ]
    ];

    /**
     * @return array|\array[][]
     */
    public static function getSecurity() {
        return self::$security;
    }

    /**
     * @param Request $request
     * @param User $user
     * @return JsonResponse
     */
    public static function fetchAll(Request $request, User $user, array $args) : jsonResponse
    {
        $tidFilter = $request->getQueryValue("tid");
        $status = $request->getQueryValue("status");
        $approvalStatus = $request->getQueryValue("approval_status");
        $categories = DocCategoryApi::get("category", [
            "parent_id"   => $args["project"]->getId(),
            "entity_type" => self::ENTITY_TYPE
        ]);

        $features = Account::get(sprintf("feature/accounts/%s", $user->getAccountId()));
        $isTenderInquiryActive = in_array(
            self::TENDER_INQUIRY_APPROVAL_LABEL,
            array_column($features, 'feature')
        );
        $approvers = Account::get(
            sprintf("approvals/%d/tiapprovers", (int) $user->getAccountId()),
            ['user_id' => $user->getId()]
        );
        $response = [];
        foreach($categories as $cid => $category) {
            $tid    = $category["entity_id"];
            $tender = $args["project"]->getTender($tid);
            if($tender->getId()) {
                if(Tender::isState($tender->getData("state"), Tender::SUGGESTED_STATE_LABEL)){
                    continue;
                }
                if($tidFilter && (int) $tidFilter !== (int)$tender->getId()) { continue; }
                foreach($category["documents"] as $doc) {
                    if($status && (int) $status !== (int)$doc["status"]) { continue; }

                    if (isset($approvalStatus) && $isTenderInquiryActive && !empty($approvers)) {
                        $approval = Project::get("approvals", ['entity_type' => self::TENDER_INQUIRY_APPROVAL_ENTITY_TYPE, 'entity_id' => $doc["id"]]);
                        $approval = array_shift($approval);
                        if (empty($approval) || $approval['status']['label'] != $approvalStatus) {
                            continue;
                        }
                    }

                    $response[] = [
                        "id"          => $doc["id"],
                        "tid"         => $tid,
                        "pid"         => (int) $args["project"]->getId(),
                        "tender"      => $tender->getData("label"),
                        "name"        => $doc["name"],
                        "status"      => $doc["status"],
                        "created_at"  => $doc["created_at"]
                    ];
                }
            }
            else {
                //Here we need to handle if a tender has been deleted and the mappings have not been deleted
            }
        }
        return self::jsonResponse($response);
    }

    /**
     * @param Request $request
     * @param User $user
     * @param array $args
     * @return JsonResponse
     * @throws \App\Api\Client\Response\JsonException
     * @throws \App\Api\Exception
     */
    public static function create(Request $request, User $user, array $args) : jsonResponse
    {
        list("document" => $doc, "category" => $cat, "tender" => $tender) = $args;
        try {
            $clone = Routine::cloneAndUpload(
                $doc, $user, self::getSubType(self::ENTITY_TYPE),
                DocumentApi::DOCUMENT_CONTRACTUAL_LABEL, [self::ENTITY_TYPE],
                $request->getJson()
            );
        }
        catch(\Exception $e) {
            self::throwJsonException($e->getMessage(), 500, $e);
        }
        //We have to update the tender so we can tell if it has a doc or not
        // It's also a bit crummy but we need to tell if doc is tender addendum or normal tender template,
        // This should be refactored in the future!
        if((strcasecmp($doc->getData("name"),self::TENDER_ADDENDUM) === 0)) {
            self::createTenderAddendumCategory($clone, $tender);
        }

        $res = self::patch("category/". $cat->getId() ."/document/" . $clone->getId(), []);
        return self::jsonResponse(["success" => $res->getStatus() === 203, "docId" => $clone->getId()]);
    }

    /**
     * Validator Pre check to confirm that parent doc is a template
     * @param Request $request
     * @param User $user
     * @param array $args
     * @return void
     * @throws \App\Api\Client\Response\JsonException
     * @throws \App\Api\Exception
     */
    public static function documentIsAsset(Request $request, User $user, array &$args) {
        $doc = DocumentValidator::getDocument($request, $args);

        $subtypes = self::getSubTypes();
        $assets = $subtypes->filterByRegex('uid','.*tender_asset')->getIds();

        if(!$doc->isOfSubType($assets)){
            self::throwJsonException("Invalid document type");
        }
    }

    /**
     * @param DocumentModel $document
     * @param TenderModel $tender
     * @return mixed
     * @throws \App\Api\Exception
     */
    public static function createTenderAddendumCategory(DocumentModel $document, TenderModel $tender) {

        $label = sprintf("%s %s", self::TENDER_ADDENDUM, date("d/m/y"));
        $data = [
            "label"       => $label,
            "entity_id"   => $tender->getId(),
            "entity_type" => TenderApi::ENTITY_TYPE,
            "parent_id"   => (int) $tender->getData("project_id")
        ];

        $results = DocCategoryApi::get("category", $data);
        if(!$results) {
            $cid = DocCategoryApi::post("category", $data)->iDResponse();
        }
        else {
            $cid = array_key_first($results);
        }

        return self::patch("category/$cid/document/" . $document->getId(), []);
    }

    /**
     * pre flight method to get or create a tender category on the fly
     * @param Request $request
     * @param User $user
     * @param array $args
     * @return void
     * @throws \App\Api\Client\Response\JsonException
     * @throws \App\Api\Exception
     */
    public static function tenderTemplateCategoryExists(Request $request, User $user, array &$args) {

        $project = ProjectValidator::getProjectContext($args["pid"] ?? false);
        $tender  = $project->getTender($args["tid"] ?? 0);

        if(!$tender->getId()) {
            self::throwJsonException("Invalid tender id");
        }

        $results = DocCategoryApi::get("category", [
            "entity_id"   => $tender->getId(),
            "entity_type" => self::ENTITY_TYPE
        ]);

        if(!$results) {
            $data = [
                "label"       => $tender->getData("label"),
                "entity_id"   => $tender->getId(),
                "entity_type" => self::ENTITY_TYPE,
                "parent_id"   => (int) $project->getId()
            ];

            $cid = DocCategoryApi::post("category", $data)->iDResponse();
            if(!$cid) {
                self::throwJsonException("Failed to create tender category");
            }
            $args["category"] = new CategoryModel($data, $cid);
        }
        else {
            $args["category"] = (new Collection(array_values($results), CategoryModel::class))->getFirst();
        }

        $args["tender"] = $tender;
    }

    /**
     * @param Request $request
     * @param User $user
     * @param array $args
     * @return JsonResponse
     * @throws \App\Api\Exception
     */
    public static function remove(Request $request, User $user, array $args) : jsonResponse
    {
        $doc = $args["document"];
        if($key = $doc->getData("s3_key")) {
            if($bucket = $doc->getData("s3_bucket")) {
                S3::remove($key, S3::getBucket($bucket));
            }
        }

        $results = DocCategoryApi::get("category", [
            "entity_id"   => $args["tid"],
            "entity_type" => self::ENTITY_TYPE
        ]);

        if($results) {
            $cat = (new Collection(array_values($results), CategoryModel::class))->getFirst();

            $hasDockey = "has_document";
            if ( (strcasecmp($doc->getData("name"), self::TENDER_ADDENDUM) === 0) ) {
                $hasDockey = "has_tender_addendum";
                $documents = array_filter($cat->getData("documents"), function($i) use($doc) {
                    return ($i["id"] !== (int) $doc->getId()) && $i['status'] && (strcasecmp($i['name'], self::TENDER_ADDENDUM) === 0);
                });
            }else{
                $documents = array_filter($cat->getData("documents"), function($i) use($doc) {
                    return ($i["id"] !== (int) $doc->getId()) && $i['status'] && (strcasecmp($i['name'], self::TENDER_ADDENDUM) !== 0);
                });
            }

            //If the tender template category no longer has any documents then we can update the tender to say no documents
            if(!$documents) {
                Tender::patch("project/" . $cat->getData("parent_id") . "/tender/" . $cat->getData("entity_id"), [$hasDockey => 0]);
            }
            //Attempt to delete mappings for that document
            self::delete("category/". $cat->getId() ."/document/" . $doc->getId(), []);
        }

        $res = self::delete("document/" . $doc->getId());
        return self::jsonResponse(["success" => $res->getStatus() === 203]);
    }

    /**
     * @param string $name
     * @return bool
     */
    public static function isTenderAddendum(string $name): bool
    {
        return strpos($name, self::TENDER_ADDENDUM) !== false;

    }
}
