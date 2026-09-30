<?php
namespace App\Api\Document;

use App\Api\Document\Category as DocCategoryApi;
use App\Api\Tender as TenderApi;
use App\Api\SupplyChain;
use App\core\Request;
use App\Api\Document;
use App\Api\Project;
use App\Api\Tender;
use App\Models\Tender as TenderModel;
use App\Api\S3;
use App\Api\Client\Response\JsonResponse;
use App\Api\Document\Validator as DocValidator;
use App\Models\Abstraction;
use App\Models\Document\Category as CategoryModel;
use App\Models\User;



class Category extends Document {

    /**
     * Allow Config to be overridden
     */
    const API_CONFIG_KEY = "document";

    /**
     * @var array
     */
    protected static $forward_address = [];

    /**
     * @var array
     */
    protected static $security = [
        "methods" => [
            "fetchAll" => [
                "type" => 'GET',
                "requires_session" => true,
                "required_args" => [
                    "etype" => "string",
                    "eid" => "int"
                ]
            ],
            "fetch" => [
                "type" => 'GET',
                "requires_session" => true,
                "required_args" => [
                    "cid" => "int",
                ],
                "pre_checks" => [
                    [DocValidator::class, "isCategoryOwner"]
                ],
            ],
            "create" => [
                "type" => 'POST',
                "requires_session" => true,
                "pre_checks" => [
                    [DocValidator::class, "isEntityOwner"],
                    [DocValidator::class, "newCategoryData"]
                ],
                "required_args" => [
                    "eid" => "int",
                    "etype" => "string",
                ]
            ],
            "rename" => [
                "type" => 'PATCH',
                "requires_session" => true,
                "pre_checks" => [
                    [DocValidator::class, "isCategoryOwner"]
                ],
                "required_args" => [
                    "cid" => "int"
                ]
            ],
            "remove" => [
                "type" => 'DELETE',
                "requires_session" => true,
                "pre_checks" => [
                    [DocValidator::class, "isCategoryOwner"]
                ],
                "required_args" => [
                    "cid" => "int"
                ]
            ],
            "bulkRemoveDocument" => [
                "type" => 'DELETE',
                "requires_session" => true,
                "pre_checks" => [
                    [DocValidator::class, "isCategoryOwner"]
                ],
                "required_args" => [
                    "cid" => "int"
                ]
            ],
            "syncParent" => [
                "type" => 'PATCH',
                "requires_session" => true,
                "pre_checks" => [
                    [DocValidator::class, "isCategoryOwner"]
                ],
                "required_args" => [
                    "cid" => "int"
                ]
            ],
            "search" => [
                "type" => 'GET',
                "requires_session" => true,
                "pre_checks" => [
                    [Project::class, "validateProjectOwner"]
                ],
                "required_args" => [
                    "pid" => "int",
                    "term" => "text"
                ]
            ],
            "addDocument" => [
                "type" => 'PATCH',
                "requires_session" => true,
                "pre_checks" => [
                    [DocValidator::class, "isCategoryOwner"],
                    [DocValidator::class, "isOwner"]
                ],
                "required_args" => [
                    "cid" => "int",
                    "did" => "int"
                ]
            ],
            "removeDocument" => [
                "type" => 'DELETE',
                "requires_session" => true,
                "pre_checks" => [
                    [DocValidator::class, "isCategoryOwner"],
                    [DocValidator::class, "isOwner"]
                ],
                "required_args" => [
                    "cid" => "int",
                    "did" => "int"
                ]
            ],
            "bulkDelete" => [
                "type" => 'DELETE',
                "requires_session" => true,
                "pre_checks" => [
                    [DocValidator::class, "validateCategoriesOwner"]
                ]
            ],
            "constants" => [
                "type"  => "GET"
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
    public static function getSecurity() {
        return self::$security;
    }

    /**
     * @param string $step
     * @param string $url
     */
    public static function setForwardingAddress($step, $url) {
        self::$forward_address[$step] = $url;
    }

    /**
     * @return mixed
     * @throws Exception
     */
    public static function getConstants()
    {
        return self::get("category/constants");
    }

    /**
     * @param int $entityId
     * @param string $type
     * @param array $ext_data
     * @return mixed
     */
    public static function createDefaults(int $entityId, string $type, array $ext_data = []) {
        return self::post("category/default",  [
            "entity_id"   => $entityId,
            "entity_type" => $type,
        ] + $ext_data);
    }

    /**
     * @param Request $request
     * @param User $user
     * @param array $args
     * @return JsonResponse
     */
    public static function fetch(Request $request, User $user, array $args) : jsonResponse
    {
        return self::jsonResponse($args["category"]->getData());
    }

    /**
     * @param Request $request
     * @param User $user
     * @param array $args
     * @return JsonResponse
     */
    public static function fetchAll(Request $request, User $user, array $args) : jsonResponse
    {
        try {
            $categories = self::get("category", [
                'entity_id' => (int)$args['eid'],
                'entity_type' => $args['etype']
            ]);
        }
        catch(\Exception $e){
            return self::jsonResponse(["error" => $e->getMessage()]);
        }

        return self::jsonResponse($categories);
    }

    /**
     * @param Request $request
     * @param User $user
     * @param array $args
     * @return JsonResponse
     */
    public static function create(Request $request, User $user, array $args) : jsonResponse {

        $category = $args["category"];
        $res = self::post("category", $category->getData());
        $json = $res->json();
        $cat_id = $json["data"]['id'] ?? null;
        return self::jsonResponse(["success" => !is_null($cat_id), 'id' => $cat_id]);
    }

    /**
     * @param Request $request
     * @param User $user
     * @param array $args
     * @return JsonResponse
     */
    public static function rename(Request $request, User $user, array $args) : jsonResponse {
       $cat = $args["category"];
       $data = $request->getJson();

       $res = self::patch("category/" . $cat->getId(),
         ["label" => $data["label"]]
       );

       $success = $res->getStatus() === 203;
       return self::jsonResponse(["success" => $success]);
    }

    /**
     * @param Request $request
     * @param User $user
     * @param array $args
     * @return JsonResponse
     */
    public static function remove(Request $request, User $user, array $args) : jsonResponse {

        $res = self::delete("category/" . $args["category"]->getId());
        $success = $res->getStatus() === 203;
        return self::jsonResponse(["success" => $success]);
    }

    /**
     * @param Request $request
     * @param User $user
     * @param $args
     * @return JsonResponse
     * @throws \Exception
     *
     * @todo need to delete headless documents here, i.e docs without a category
     */
    public static function bulkDelete(Request $request, User $user, $args) : JsonResponse {
        try{
            foreach($args['categories'] as $cat){
               self::delete("category/" . $cat->getId());
            }

        }catch (\Exception $e){
            return self::jsonResponse(["success" => false, "error" => $e->getMessage()]);
        }
        return self::jsonResponse(["success" => true]);
    }

    /**
     * @param Request $request
     * @param User $user
     * @param $args
     * @return JsonResponse
     */
    public static function addDocument(Request $request, User $user, $args) : JsonResponse {

        $category = $args["category"];
        $document = $args["document"];
        $res = self::patch("category/". $category->getId() ."/document/" . $document->getId(), []);

        $success = $res->getStatus() === 203;

        /*
         * We uploaded the file from project package collator and not from file manager
         */
        if($success && !isset($args["tender"])) {
            /*
             * Check custom rules for categories
            */
            $category_label = $category->getData("label");

            /*
             * Get category custom rules to check if we need to append the document to tenders
             */
            $drawings_rules = $category->hasCustomDrawingsRules();

            /*
             * We need to append the files to all existing tenders
             */
            foreach ($args['entity']['tender'] ?? [] as $tender) {

                /**
                 * If the tender is a suggestion we don't need to allocate any drawings
                 * as the allocations will be done once you manually add the package
                 */
                if(TenderApi::isState((int) $tender['state'], TenderApi::SUGGESTED_STATE_LABEL)) {
                    continue;
                }

                $tid = (int) $tender['id'];
                $data = Tender::get("tender/$tid");
                $args["tender"] = new TenderModel($data[$tid], $tid);

                /*
                 * If the document is not added to a category that has global custom rules
                 * we need to check each tender individually for custom rules based on their packages categories
                 */
                $tender_drawing_rules = false;
                if(!$drawings_rules){
                    $tender_rules = self::getRules($args["tender"]->getData("packages"), true);
                    $tender_drawing_rules = isset($tender_rules[$category->getData("label")]);
                }

                if ($drawings_rules || $tender_drawing_rules) {

                    $category_data = [
                        'entity_id' => $tid,
                        'entity_type' => self::ENTITY_TENDER,
                        'label' => $category_label,
                        'parent_id' => (int)$args['entity']['id']
                    ];
                    $tender_categories = self::get("category", $category_data);

                    /*
                     * Check if the tender has the category and if not create it
                     */
                    if(!$tender_categories) {
                        $res = self::post("category", $category_data);
                        $tender_categories[] = [
                            'id' => $res->iDResponse()
                        ];
                    }

                    /*
                     * Add the files to the tender
                     */
                    foreach ($tender_categories as $cat) {
                        self::patch("category/" . $cat['id'] . "/document/" . $document->getId());
                    }
                }
            }
        }

        return self::jsonResponse(["success" => $res->getStatus() === 203]);
    }

    /**
     * @param Request $request
     * @param User $user
     * @param $args
     * @return JsonResponse
     */
    public static function removeDocument(Request $request, User $user, $args) : JsonResponse {

        $category = $args["category"];
        $document = $args["document"];
        $res = self::delete("category/". $category->getId() ."/document/" . $document->getId(), []);
        $success = $res->getStatus() === 203;
        return self::jsonResponse(["success" => $success]);
    }

    /**
     * @param Request $request
     * @param User $user
     * @param $args
     * @return JsonResponse
     */
    public static function bulkRemoveDocument(Request $request, User $user, $args) : JsonResponse {

        $category  = $args["category"];
        $documents = $request->getJson();
        foreach($documents as $did) {
            $res = self::delete("category/". $category->getId() ."/document/" . (int) $did, ["owner_id" => $user->getAccountId()]);
        }
        $success = $res->getStatus() === 203;
        return self::jsonResponse(["success" => $success]);
    }


    /**
     * @param int $cid
     * @return CategoryModel|void
     * @throws \App\Api\Exception
     */
    public static function load(int $cid, $filters=[]) : Abstraction {
        return new CategoryModel( self::get("category/$cid", $filters), $cid);
    }

    /**
     * @param array $categories
     * @param array $filters
     * @return array
     * @throws \App\Api\Exception
     */
    public static function loadCategories(array $categories, $filters=[])
    {
        $filters["cids"] = $categories;
        $cats = self::get("category", $filters);
        $result = [];
        if($cats){
            foreach($cats as $cat){
                $result[] = new CategoryModel( $cat, $cat['id']);
            }
        }

       return $result;
    }

    /**
     * @return mixed
     * @throws Exception
     */
    public static function constants()
    {
        return self::get("category/constants");
    }

    /**
     * @param Request $request
     * @param User $user
     * @param $args
     * @throws \App\Api\Exception
     */
    public static function syncParent(Request $request, User $user, $args) {
        $category = $args["category"];

        if($parentId = $category->getData("parent_id")) {
            $parent = self::get("category", [
                "entity_id" => $parentId, "label" => $category->getData("label")
            ]);
            if($parent && count($parent) === 1) {
                $parentCat = array_shift($parent);
                $parentCatId = (int) $parentCat["id"];
                $res = self::patch("category/". $category->getId() ."/mapping/clone/$parentCatId");
                $json = $res->json();
                $docs = $json["data"] ?? [];

                return self::jsonResponse(["success" => true, "documents" => $docs]);
            }
        }
        return self::jsonResponse(["success" => false, "error" => "parent_not_found"]);
    }

    /**
     * @param Request $request
     * @param User $user
     * @param $args
     * @throws \App\Api\Exception
     */
    public static function search(Request $request, User $user, $args) {
        $term = trim($args["term"]);
        $params = ["parent_id" => $args["pid"]];
        $entity = $request->getQueryValue("eid");
        if($entity) {
            $params["entity_id"]  = (int) $entity;
        }

        $docs = self::get("document/search/$term", array_merge($params, ["owner" => $user->getAccountId()]));
        $cats = self::get("category/search/$term", $params);
        return self::jsonResponse(
            ["documents" => $docs, "categories" => $cats]
        );
    }

    /**
     * @param array $tradeIds
     * @param bool $has_rule_mandatory
     * @return array
     * @throws \App\Api\Exception
     */
    public static function getRules(array $tradeIds, bool $has_rule_mandatory = false): array
    {
        $categories        = Project::getConstants()->getData()['default_categories'] ?? [];
        $supplyChainTrades = SupplyChain::getTradeCategories();
        $rules = [];
        //found the parent category rules based on the children trade ids
        foreach($supplyChainTrades->getItems() as $trade){
            $keys = array_keys($trade->getData("trades"));
            if(!count(array_intersect($keys, $tradeIds))){
                continue;
            }
            $rules[] = str_split($trade->getData("rules"));
        }
        //if you combine 2 trades that have a rule for a category set to 0 but the other one has it set to 1 make sure we return the "max" one which is 1
        $rules = count($rules) === 1 ? $rules[0] : array_map('max', ...$rules);
        //return all categories that have a rule set to 1 or don't have a rule at all
        $result = array_filter($categories, function($key) use ($rules) {
            return (isset($rules[$key]) && $rules[$key] == 1) || !isset($rules[$key]);
        }, ARRAY_FILTER_USE_KEY);
        return array_fill_keys($result, 1);
    }

    /**
     * @param TenderModel $tender
     * @throws \App\Api\Exception
     */
    public static function assignDocumentsByTenderRules(TenderModel $tender): void
    {

        /*
         * Get project categories
         */
        $categories_project = DocCategoryApi::get("category", [
            'entity_id' => $tender->getData("project_id"),
            'entity_type' => Project::ENTITY_TYPE
        ]);

        /*
         * The project doesn't have any categories so we don't have any documents to assign
         */
        if(!$categories_project){
            return;
        }

        /*
         * Get categories custom rules
         */
        $rules = self::getRules($tender->getData("packages"), true);

        /*
         * Because not all categories have custom rules (for example custom categories) we need to append a global rule to them
         */
        array_map(function($cat) use(&$rules) {
            $rules[$cat['label']] ??= true;
        }, $categories_project);

        $tenderCategories = DocCategoryApi::get("category", [
            'entity_id' => $tender->getId(),
            'entity_type' => Tender::ENTITY_TYPE,
        ]);
        $tenderCategoriesByLabel = [];
        foreach ($tenderCategories as $category) {
            $tenderCategoriesByLabel[$category['label']] = $category;
        }


        /*
         * Assign all the documents from the category based on the custom rules
        */
        foreach($rules as $cat_label => $rule){
            /*
             * Get all documents from categories that have custom rule
            */
            $documents = [];
            foreach($categories_project as $category){
                if($category['label'] === $cat_label){
                    $documents = $category['documents'];
                    break;
                }
            }

            /*
             * Assign all documents from project categories to tender categories
             */
            if($documents) {
                $category_tender = $tenderCategoriesByLabel[$cat_label] ?? null;

                /*
                 * Bulk add documents to categories
                 */
               $document_ids = array_values(array_map(function($doc) {
                   return $doc['id'];
               }, $documents));
               if($category_tender && !empty($document_ids)){
                   DocCategoryApi::post("category/" . $category_tender['id'] . "/document/bulk", ['documents' => $document_ids]);
               }
            }
        }
    }
}
