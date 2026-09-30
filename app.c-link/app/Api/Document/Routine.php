<?php

namespace App\Api\Document;

use App\Api\Document as DocumentApi;
use App\Api\Document\Category as DocCategoryApi;
use App\Api\S3;
use App\Api\Client;
use App\Models\Collection;
use App\Models\Document;
use App\Models\Document\Category as CategoryModel;
use App\Models\User;
use App\Models\Document\SubType;

/**
 * Class to replicate common pattens that fall outside the usual controller or validation and remain DRY
 */

class Routine
{

    /**
     * @param Document $document
     * @param string $type
     * @param string $content
     * @param array $parents
     * @return void
     * @throws \Exception
     */
    public static function uploadJsonToS3(Document $document, string $type, string $content, array $parents = [])
    {

        $key  = S3::getKey(
            $document->getS3Name(".json"),
            $type,
            $parents
        );

        $document->setData("s3_key", $key)->setContent($content);
        DocumentApi::patch("document/" . $document->getId(), ["s3_key" => $key]);
    }

    /**
     * @param Document $parent
     * @param User $user
     * @param SubType $type
     * @param array $newData
     * @return Document
     * @throws \Exception
     */
    public static function cloneADocument(Document $parent, User $user, SubType $type, array $newData = []): Document
    {

        $clone = $parent->clone($newData, ["s3_key", "id", "created_at", "owner"])
            ->setData("owner_id", $user->getAccountId())
            ->setData("status", 0)
            ->setData("parent_id", $parent->getId())
            ->setData("subtype", $type->getId());

        $res = DocumentApi::post("document", $clone->getData());
        $id = $res->iDResponse();
        if (!$id) {
            throw new \Exception("Failed to create order document");
        }
        $clone->setId($id);
        return $clone;
    }

    /**
     * @param int $e_id
     * @param string $e_type
     * @param string $label
     * @param int $parent_id
     * @return \App\Models\Abstraction|CategoryModel
     * @throws \App\Api\Exception
     */
    public static function getAllCreateDocumentCategory(int $e_id, string $e_type, string $label, int $parent_id = 0)
    {

        $category = null;

        $results = DocCategoryApi::get("category", [
            "entity_id"   => $e_id,
            "entity_type" => $e_type
        ]);

        if (!$results) {
            $data = [
                "label"       => $label,
                "entity_id"   => $e_id,
                "entity_type" => $e_type,
                "parent_id"   => $parent_id
            ];

            $cid = DocCategoryApi::post("category", $data)->iDResponse();
            if (!$cid) {
                Client::throwJsonException("Failed to create tender category");
            }
            $category = new CategoryModel($data, $cid);
        } else {
            $category = (new Collection(array_values($results), CategoryModel::class))->getFirst();
        }

        return $category;
    }

    /**
     * Here we allow a document to have children that have user ownership, these take precedence over there
     * parents
     * @param Document $parent
     * @param User $user
     * @return Document
     * @throws \App\Api\Exception
     */
    public static function getTrueParent(Document $parent, User $user): Document
    {
        $results = DocumentApi::get("document/" . $parent->getId() . "/children", ['owner_id' => $user->getAccountId()]);
        if ($results["children"]) {
            foreach ($results["children"] as $child) {
                if ((int) $child["subtype"] === (int) $parent->getData("subtype")) {
                    return new Document($child, $child["id"]);
                }
            }
        }
        return $parent;
    }

    /**
     * @param Document $doc
     * @param User $user
     * @param SubType $docType
     * @param string $s3Type
     * @param array $s3Parents
     * @param array $data
     * @return Document
     * @throws \App\Api\Exception
     */
    public static function cloneAndUpload(
        Document $doc,
        User $user,
        SubType $docType,
        string $s3Type,
        array $s3Parents,
        array $data = []
    ): Document {
        $parent = self::getTrueParent($doc, $user);
        $clone = self::cloneADocument($parent, $user, $docType, $data);
        self::uploadJsonToS3(
            $clone,
            $s3Type,
            $parent->getContent(),
            $s3Parents
        );
        return $clone;
    }
}
