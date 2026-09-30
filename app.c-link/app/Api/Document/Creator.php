<?php
namespace App\Api\Document;

use App\core\Request;
use App\Api\Document;
use App\Api\Project;
use App\Api\Tender;
use App\Api\S3;
use App\Api\Client\Response\JsonResponse;
use App\Api\Document\Validator as DocValidator;


class Creator extends Document {

    /**
     * @param Request $request
     * @param User $user
     * @return JsonResponse
     */
    public static function templates(Request $request, User $user) : jsonResponse
    {
        $aid = $user->getAccountId();
        $type = self::getDocumentType("template");
        $results = self::get("document", ["type" => $type["id"]]);

        $templates = [];
        $ownerMapped = array_filter(function($i) use ($aid) {
            $ids = array_map(function($o) { return $o["owner_id"]; }, $i["owner"]);
            return in_array($aid, $ids);
        });






    }


}
