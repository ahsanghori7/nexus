<?php

namespace App\Api\Document;

use App\Api\S3;
use App\core\Request;
use App\Api\Document;
use App\Models\User;
use App\Api\Client\Response\JsonResponse;
use App\Models\Document as DocumentModel;
use App\Api\Document as DocumentApi;
use App\Utility\Upload;
use App\Api\Document\Validator as DocValidator;

class NumberDocument extends Document
{

    /**
     * Allow Config to be overridden
     */
    const API_CONFIG_KEY = "document";

    const ENTITY_TYPE = "number_document";

    /**
     * @var array
     */
    protected static $security = [
        "methods" => [
            "fetchAll" => [
                "type" => "GET",
                "requires_session" => true,
                "required_args" => [
                    "did" => "int"
                ],
            ],
            "create" => [
                "type" => "POST",
                "requires_session" => true,
                "required_args" => [
                    "did" => "int",
                    "nd" => "int"
                ],
            ],
            "save" => [
                "type" => "POST",
                "requires_session" => true,
                "required_args" => [
                    "did" => "int"
                ],
            ],
            "remove" => [
                "type" => "DELETE",
                "requires_session" => true,
                "pre_checks" => [[DocValidator::class, "isOwner"]],
                "required_args" => [
                    "did" => "int"
                ],
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
     * @return JsonResponse
     */
    public static function fetchAll(Request $request, User $user, array $args): JsonResponse
    {
        $doc = self::get("document/" . (int) $args["did"] . "/children", [
            "owner_id" => $user->getAccountId(),
        ]);

        if (!$doc["parent"]) {
            self::throwJsonException("Missing Document", 404);
        }

        $type     = self::getSubType(self::ENTITY_TYPE);
        $document = new DocumentModel($doc["parent"], $args["did"]);
        $children = $document->setChildren($doc["children"] ?? [])->getChildren();
        $numberDocumentsList = $children->filterByField("subtype", (int)$type->getId());

        $response = ["list" => []];
        if ($numberDocumentsList) {
            $response["list"] = $numberDocumentsList->getItemsAsArray();
        }

        return self::jsonResponse($response);
    }

    /**
     * @param Request $request
     * @param User $user
     * @param array $args
     * @return JsonResponse
     */
    public static function create(Request $request, User $user, array $args): JsonResponse
    {
        $data = $request->getData();
        $did = $args["did"];
        $nd = $args["nd"];
        $file = $data["file"];
        $fileName = $file["name"];
        $fileUploaded = new Upload($file);
        $bucket = self::getConfig()["s3_contract_bucket"];
        $subtype = self::getSubType(self::ENTITY_TYPE);
        $type = DocumentApi::getDocumentType('contractual');
        $meta = json_encode(["number_document" => $nd]);
        $res = self::post("document", [
            'owner_id'  => $user->getAccountId(),
            'subtype' => intval($subtype->getId()),
            'type'      => $type,
            "parent_id" => $did,
            "name"      => $fileName,
            "s3_bucket" => $bucket,
            "meta"      => $meta
        ]);
        $json = $res->json();
        $id = $json["data"]["id"] ?? null;
        if (!$id) {
            throw new \Exception("Api Failure: Failed to create document");
        }
        $key = s3::getKey("nd-" . $id . ".json", self::DOCUMENT_CONTRACTUAL_LABEL, ["number_document"]);

        $res = $upload = S3::upload(
            $bucket,
            $key,
            $fileUploaded->getPath(),
            $fileUploaded->getType()
        );

        if ($upload) {
            $url = parse_url($upload["ObjectURL"]);
            self::patch("document/$id", ["s3_key" => ltrim($url["path"], "/")]);
        }

        $data = [
            "id"        => $id,
            "name"      => $fileName,
            "s3_key"    => $key,
            "meta"      => $meta
        ];

        return self::jsonResponse(["success" => $res['@metadata']['statusCode'] === 200, "data" => $data]);
    }

    /**
     * @param Request $request
     * @param User $user
     * @param array $args
     * @return JsonResponse
     */
    public static function save(Request $request, User $user, array $args): JsonResponse
    {
        $data = $request->getData();
        $did = $args["did"];
        $file = $data["file"];
        $fileName = $file["name"];
        $fileUploaded = new Upload($file);
        $bucket = self::getConfig()["s3_contract_bucket"];
        self::patch("document/$did", [
            'owner_id'  => $user->getAccountId(),
            "name"      => $fileName
        ]);
        $key = s3::getKey("nd-" . $did . ".json", self::DOCUMENT_CONTRACTUAL_LABEL, ["number_document"]);
        $res = S3::upload(
            $bucket,
            $key,
            $fileUploaded->getPath(),
            $fileUploaded->getType()
        );

        $data = [
            "id"        => $did,
            "name"      => $fileName,
            "s3_key"    => $key
        ];

        return self::jsonResponse(["success" => $res['@metadata']['statusCode'] === 200, "data" => $data]);
    }

    /**
     * @param Request $request
     * @param User $user
     * @param array $args
     * @return JsonResponse
     */
    public static function remove(Request $request, User $user, array $args): JsonResponse
    {
        $did = $request->getQueryValue("did");

        try {
            if ($args["document"]->delete()) {
                self::delete("document/$did");
            }
        } catch (\Exception $e) {
            self::throwJsonException("Failed to delete file", 500, $e);
        }

        return self::jsonResponse(["success" => true]);
    }

}
