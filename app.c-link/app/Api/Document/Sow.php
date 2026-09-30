<?php

namespace App\Api\Document;

use App\Api\S3;
use App\core\Request;
use App\Api\Document;
use App\Models\User;
use App\Api\Client\Response\JsonResponse;
use App\Models\Document as DocumentModel;



class Sow extends Document
{

    /**
     * Allow Config to be overridden
     */
    const API_CONFIG_KEY = "document";

    const ENTITY_TYPE = "sow_template";

    /**
     * @var array
     */
    protected static $security = [
        "methods" => [
            "fetch" => [
                "type" => "GET",
                "requires_session" => true,
                "required_args" => [
                    "did" => "int"
                ],
                "pre_checks" => [
                   "loadSow"
                ]
            ],
            "save" => [
                "type" => "PATCH",
                "requires_session" => true,
                "required_args" => [
                    "did" => "int"
                ],
                "pre_checks" => [
                    "loadSow"
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
     * @param array $args
     * @return JsonResponse
     */
    public static function fetch(Request $request, User $user, array $args) : JsonResponse
    {
        $sow = $args["sow"];
        $response = ["id" => null, "data" => []];
        if($sow) {
            $response["id"]   = (int) $sow->getId();
            $response["data"] = json_decode($sow->getContent(), true);
        }

        return self::jsonResponse($response);
    }

    /**
     * This patten of updating document content is repeated a few times throughout
     * the code (see DocumentApi::saveContent)  and needs to be refactored
     * @param Request $request
     * @param User $user
     * @param array $args
     * @return JsonResponse
     */
    public static function save(Request $request, User $user, array $args) : JsonResponse
    {
        $sow  = $args["sow"];
        $json = $request->getJson();
        $bucket = self::getConfig()["s3_contract_bucket"];
        if($sow) {
            $data = json_decode($sow->getContent(), true);
            $key = $sow->getData("s3_key");
        }
        else {
            $res = self::post("document", [
                "name" => "Scope Of Works",
                "type" => Document::DOCUMENT_CONTRACTUAL_TYPE,
                "subtype"   => $args["subtype"]->getId(),
                "parent_id" => $args["did"],
                "owner_id" => $user->getAccountId(),
                "status" => 1,
                "s3_bucket" => $bucket
            ]);

            $id = $res->iDResponse();
            if(!$id) {
                $error = $res->json();
                self::throwJsonException("Failed to create sow document",
                    500, null,
                    ($error) ? json_encode($error) : "Unknown Error"
                );
            }
            $key = s3::getKey("sow-" . $id .".json", self::DOCUMENT_CONTRACTUAL_LABEL, ["sow"]);
            self::patch('document/'. $id, ['s3_key' => $key]);
            $data = ["content" => "", "attendances" => [], "valuations"  => []];
        }

        //If the document has all the fields filled out, set the status to published
        $documentModel = new DocumentModel(Document::load($args["did"])->getData(), $args["did"]);
        $status        = Template::getDocumentStatus($documentModel);
        if($status === 1) {
            Template::setDocumentAsPubished($documentModel);
            Template::patch("document/" . $documentModel->getId(), ["status" => true]);
        }

        foreach($data as $k => $v) {
            if(isset($json[$k])) {
                $data[$k] = $json[$k];
            }
        }

        foreach(['templateName', 'templateId'] as $metaKey) {
            if(is_array($json) && array_key_exists($metaKey, $json)) {
                $data[$metaKey] = $json[$metaKey];
            }
        }

        $res = S3::uploadContent(
            $bucket,
            $key,
            json_encode($data),
        );

        return self::jsonResponse(["success" => $res['@metadata']['statusCode'] === 200]);
    }

    /**
     * @param Request $request
     * @param User $user
     * @param array $args
     * @return void
     * @throws \App\Api\Client\Response\JsonException
     * @throws \App\Api\Exception
     */
    public static function loadSow(Request $request, User $user, array &$args) {
        $doc = self::get("document/" . (int) $args["did"] . "/children", [
            "owner_id" => $user->getAccountId(),
        ]);

        if(!$doc["parent"]) {
            self::throwJsonException("Missing Document", 404);
        }

        $type     = self::getSubType(self::ENTITY_TYPE);
        $document = new DocumentModel($doc["parent"], $args["did"]);
        $children = $document->setChildren($doc["children"] ?? [])->getChildren();
        $args["sow"] = $children->filterByField("subtype", (int)$type->getId())->getFirst();
        $args["subtype"] = $type;
    }
}
