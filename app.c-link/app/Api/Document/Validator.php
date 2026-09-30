<?php

namespace App\Api\Document;

use App\Api\Document as DocumentApi;
use App\Api\Project;
use App\Api\Tender;
use App\core\Request;
use App\Models\Document;
use App\Models\Project as ProjectModel;
use App\Models\Document\Category as CategoryModel;
use App\Models\User;
use App\Utility\Upload;

class Validator {
    /**
     * @param Request $request
     * @param User $user
     * @param array $args
     */
    public static function uploadedDocumentPresent(Request $request, User $user, array &$args)
    {
        if ($_FILES) {
            $args["documents"] = [];
            foreach ($_FILES as $file) {
                $args["documents"][] = new Upload($file);
            }
        } else {
            throw new \Exception("Missing Required Files");
        }
    }

    /**
     * @param Request $request
     * @param User $user
     * @param array $args
     * @throws \Exception
     */
    public static function uploadedMultipleDocuments(Request $request, User $user, array &$args)
    {
        $args["documents"] = [];
        $files = $_FILES['document'] ?? [];
        foreach ($files as $type => $values) {
            if(is_array($values)) {
                foreach ($values as $key => $value) {
                    $args["documents"][$key][$type] = $value;
                }
            }
            else{
                $args["documents"][0][$type] = $values;
            }
        }
        if(!$args["documents"]){
            throw new \Exception("Missing Required Files");
        }
    }

    public static function documentType(Request $request, User $user, array &$args)
    {
        $type = $request->getQueryValue("type");
        $types = DocumentApi::getDocumentTypes();

        if ($type) {
            if (is_numeric($type)) {
                if (!in_array($type, array_values($types))) {
                    throw new \Exception("Invalid Type id");
                }
            }
            else {
                if (isset($types[strtolower($type)])) {
                    $type = $types[strtolower($type)];
                } else {
                    throw new \Exception("Invalid Type name");
                }
            }
            $args["type"] = $type;
        }
    }

    /**
     * @param Request $request
     * @param User $user
     * @param array $args
     * @throws \Exception
     */
    public static function isEntityOwner(Request $request, User $user, array &$args) {
        $entity = $request->getQueryValue("eid");
        $eType  = $request->getQueryValue("etype");
        $args["entity"] = false;
        if(!$entity || !$eType) {
            throw new \Exception("Missing required args eid and etype");
        }
        try {
            if ($eType === "tender") {
                $args["tid"] = $entity;
                Tender::validateOwner($request, $user, $args);
                $args["entity"] = $eType;
            }
            elseif ($eType === "project") {
                Project::ownsProject($user, $entity);
                $args["entity"] = $eType;
            }
        }
        catch(\Exception $e) {
            throw new \Exception($e->getMessage());
        }
        if(!$args["entity"]) {
            throw new \Exception("Invalid Entity Type $eType");
        }
    }

    /**
     * @param Request $request
     * @param User $user
     * @throws Exception
     */
    public static function isOwner(Request $request, User $user, array &$args)
    {
        $doc_id = (int) $request->getQueryValue("did");
        if(!$doc_id) {
            throw new \Exception("Bad Request: Missing arguments");
        }

        $data = DocumentApi::getDocument($doc_id);
        if($data) {
            $args["document"] = new Document($data, $doc_id);
            if(!$args["document"]->isOwner($user)) {
                throw new \Exception("Permission denied.");
            }
        }
        else {
            throw new \Exception("document not found");
        }
    }

    /**
     * @param Request $request
     * @param User $user
     * @param array $args
     */
    public static function isOwnerSignatory(Request $request, User $user, array &$args)
    {
        $doc_id = (int) $request->getQueryValue("did");
        if($doc_id) {
            self::isOwner($request, $user, $args);
        }
    }

    /**
     * Can view works like isOwner, but also checks that the document has no owners, and therefore can also view
     * @param Request $request
     * @param User $user
     * @throws Exception
     */
    public static function canView(Request $request, User $user, array &$args) {

        $doc = self::getDocument($request, $args);
        $owners_count = count($doc->getOwnerIds());
        $hidden_count = count($doc->getHiddenIds());
        if($owners_count > 0 && $owners_count != $hidden_count && !$doc->isOwner($user)) {
            throw new \Exception("Permission denied.");
        }
    }

    /**
     * @param Request $request
     * @param User $user
     * @param array $args
     */
    public static function newCategoryData(Request $request, User $user, array &$args) {
        $data = $request->getJson();
        $parent_id = $request->getQueryValue("parent_id");

        $args["category"]  = new CategoryModel([
            'entity_id' => (int) $args['eid'],
            'parent_id' => $parent_id ?? 0,
            'label'     => (string) $data['label'],
            'entity_type'      => $args["etype"],
        ]);
    }

    /**
     * @param Request $request
     * @param User $user
     * @param array $args
     */
    public static function isCategoryOwner(Request $request, User $user, array &$args) {
        if(!isset($args["category"])) {
            $cat = DocumentApi::get("category/" . $args["cid"]);
            if($cat) {
                $args["category"] = new CategoryModel($cat, (int) $args["cid"]);
            }
            else {
                DocumentApi::throwJsonException("Category not found");
            }
        }

        self::testCategoryOwnership($args["category"], $request, $user, $args);
    }

    /**
     * @param CategoryModel $category
     * @param Request $request
     * @param User $user
     * @throws \Exception
     */
    public static function testCategoryOwnership(CategoryModel $category, Request $request, User $user, array &$args) {
        $type = $category->getData("entity_type");
        if($category->isOfType([Project::ENTITY_TYPE, Tender::ENTITY_TYPE])) {
            if($category->isType( Project::ENTITY_TYPE)) {
                $args["entity"] = Project::ownsProject($user, $category->getData("entity_id"));
            }
            else {
                $args["tid"] = $category->getData("entity_id");
                Tender::validateOwner($request, $user, $args);
            }
        }
        else{
            throw new \Exception('Invalid entity type ' . $type);
        }
    }

    /**
     * @param Request $request
     * @param User $user
     * @param array $args
     * @throws \App\Api\Exception
     */
    public static function validateCategoriesOwner(Request $request, User $user, array &$args){
        $data = $request->getJson();
        ;
        if(!isset($data['categories']) || !is_array($data['categories'])){
            Category::throwJsonException("No categories provided");
        }

        self::testCategoriesOwnership(Category::loadCategories($data['categories']), $request, $user, $args);
    }

    /**
     * @param array $categories
     * @param Request $request
     * @param User $user
     * @param array $args
     * @throws \Exception
     */
    public static function testCategoriesOwnership(array $categories,Request $request, User $user, array &$args)
    {
       $entities = [];
       foreach($categories as $category){
           $entities[$category->getData("entity_type")][$category->getData("entity_id")] = $category;
       }

       $project_id = isset($entities[Project::ENTITY_TYPE]) ? $categories[0]->getEntityId() : $categories[0]->getParentId();
       $project = (new ProjectModel(Project::ownsProject($user, $project_id), $project_id));
       if(isset($entities[Tender::ENTITY_TYPE])){
           /*
            * @todo
            * This needs to be deleted as is only needed for legacy
            */
            $args['tender'] = Tender::load($project_id, array_keys($entities[Tender::ENTITY_TYPE])[0]);
            foreach($entities[Tender::ENTITY_TYPE] as $eid => $entity){
                if(!$project->hasTenderId($eid)){
                    Category::throwJsonException("Access denied");
                }
            }
       }

       $args['categories'] = $categories;
    }

    /**
     * @param $request
     * @param array $args
     * @return \App\Models\Abstraction|Document|mixed|null
     * @throws \App\Api\Exception
     */
    public static function getDocument($request, array &$args) {
        $document = $args["document"] ?? null;
        if(!$document) {
            $doc_id = (int) $request->getQueryValue("did");
            if(!$doc_id) {
                throw new \Exception("Bad Request: Missing arguments");
            }

            $document = DocumentApi::load($doc_id);
            if(!$document->getData()) {
                DocumentApi::throwJsonException("Document does not exist", 404);
            }
            $args["document"] = $document;
        }

        return $document;
    }

    /**
     * @param Request $request
     * @param User $user
     * @param array $args
     * @return void
     * @throws \App\Api\Client\Response\JsonException
     * @throws \App\Api\Exception
     */
    public static function hasParent(Request $request, User $user, array &$args) {
        $document = self::getDocument($args);
        $parentId = $document->getData("parent_id");
        if(!$parentId) {
            DocumentApi::throwJsonException("Document does not have parent id", 500);
        }

        $parent = DocumentApi::load($parentId);
        if($parent->hasData()) {
            $args["parent"] = $parent;
        }
        else {
            DocumentApi::throwJsonException("Document parent id is invalid", 500);
        }
    }

    /**
     * @param Request $request
     * @param User $user
     * @param array $args
     * @return void
     * @throws \App\Api\Client\Response\JsonException
     */
    public static function isValidTypeId(Request $request, User $user, array &$args) {
        $data = $request->getData();
        if(isset($args["type"])) {
            $typeId = (int) $args["type"];
        }
        elseif(isset($data["type"])) {
            $typeId = (int) $data["type"];
        }
        else {
            DocumentApi::throwJsonException("Missing Template Type Id", 500);
        }

        if(!$typeId) {
            DocumentApi::throwJsonException("Invalid Type Id", 500);
        }

        $uid = Document::getTypeUid($typeId);
        if(!$uid) {
            DocumentApi::throwJsonException("Invalid Type Id", 500);
        }

        $args["document_type"] = ["id" => $typeId, "uid" => $uid];
    }
}
