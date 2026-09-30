<?php

namespace App\Api\BoQ;

use App\Api\BoQ\BoQ as BoQApi;
use App\Api\S3;
use App\Api\Tender;
use App\core\Request;
use App\Api\Client;
use App\Api\Project;
use App\Api\Client\Response\JsonResponse;
use App\Models\User;

use App\Api\BoQ\Validator as BoQValidator;
use App\Models\Tender as TenderModel;
use App\Models\Project as ProjectModel;

/**
 * Class BoQ
 * @package App\Api\BoQ
 * @TODO the entire class will be moved to framework api
 */
class BoQ extends Client
{

    /**
     * Allow Config to be overridden
     */
    const API_CONFIG_KEY = "api";

    const BOQ_TENDERED_STATUS = 6;

    /**
     * @var array
     */
    protected static $security = [
        "methods" => [
            "fetchAll" => [
                "type" => 'GET',
                "requires_session" => true,
                "required_args" => [
                    "slug" => "string"
                ],
            ],
            "createEntity" => [
                "type" => 'POST',
                "requires_session" => true,
            ],
            "updateEntity" => [
                "type" => 'PATCH',
                "pre_checks" => [
                    [BoQValidator::class, "isEntityOwner"],
                ],
                "requires_session" => true,
                "required_args" => [
                    "eid" => "int"
                ],
            ],
            "checkRevisionDocument" => [
                "type" => 'GET',
                "pre_checks" => [
                    [BoQValidator::class, "isEntityOwner"],
                ],
                "requires_session" => true,
                "required_args" => [
                    "sid" => "int",
                    "eid" => "int",
                ],
            ],
            "downloadRevisionDocument" => [
                "type" => 'GET',
                "pre_checks" => [
                    [BoQValidator::class, "isEntityOwner"],
                ],
                "requires_session" => true,
                "required_args" => [
                    "sid" => "int",
                    "eid" => "int",
                ],
            ],
        ]
    ];

    /**
     * @return array|array[]
     */
    public static function getSecurity()
    {
        return self::$security;
    }

    /**
     * @param Request $request
     * @param User $user
     * @return JsonResponse
     * @throws \App\Api\Exception
     */
    public static function fetchAll(Request $request, User $user): jsonResponse
    {
        $slug = $request->getQueryValue("slug");
        $project = Project::ownsProject($user, $slug);
        try {
            $json = self::get("boq/" . $project["id"]);
            return self::jsonResponse($json, 200);
        } catch (\Exception $e) {
            return self::jsonResponse(["error" => $e->getMessage()], 500);
        }
    }

    /**
     * @param Request $request
     * @param User $user
     * @return JsonResponse
     */
    public static function createEntity(Request $request, User $user): jsonResponse
    {
        $data = $request->getJson();
        $tid = $data["tid"] ?? [];
        try {
            $res = self::post("boq/entity", ['tender_id' => $tid]);
            $json = $res->json();
            return self::jsonResponse($json, 200);
        } catch (\Exception $e) {
            return self::jsonResponse(["error" => $e->getMessage()], 500);
        }
    }

    /**
     * @param Request $request
     * @param User $user
     * @return JsonResponse
     */
    public static function updateEntity(Request $request, User $user): jsonResponse
    {
        $eid = $request->getQueryValue("eid");
        $data = $request->getJson();
        try {
            $res = self::post("boq/entity/$eid", $data);
            return self::jsonResponse($res->json(), 200);
        } catch (\Exception $e) {
            return self::jsonResponse(["error" => $e->getMessage()], 500);
        }

    }

    /**
     * @param Request $request
     * @param User $user
     * @param array $args
     * @throws \App\Api\Exception
     */
    public static function validateOwner(Request $request, User $user, array &$args): void
    {
        $eid = $args["eid"] ?? false;
        if(!$eid) {
            throw new \Exception("No Entity Id Supplied");
        }
        $token = app()->Cookie->getCookie('token');
        $res = self::get("boq/entity/$eid",[], ['Authorization' => "Bearer $token"]);
        $res = array_shift($res);
        $tid = $res['tender_id'] ?? null;
        $access = false;
        if($tid) {
            $data = Tender::get("tender/$tid");
            $tender = new TenderModel($data[$tid], $tid);
            $project = new ProjectModel($data["project"], $tender->getData("project_id"));
            if($project->isOwner($user)) {
                $access = true;
            }
        }
        if(!$access){
            throw new \Exception("Permission Denied");
        }
    }

    /**
     * @param Request $request
     * @param User $user
     * @param array $args
     * @return JsonResponse
     * @throws \Exception
     */
    public static function checkRevisionDocument(Request $request, User $user, array $args): JsonResponse
    {

        $sid = (int)($args["sid"] ?? 0);
        $eid = (int)($args["eid"] ?? 0);
        $token = app()->Cookie->getCookie('token');
        $res = BoQApi::get("boq/$eid/quote/$sid/revision_download/$token",[], ['Authorization' => "Bearer $token"]);
        if(isset($res['revision'])){
            return self::jsonResponse(['data' => ['success' => true, 'file' => SITE_URL."/relay?action=boq&method=downloadRevisionDocument&sid=$sid&eid=$eid"]], 200);

        }

        return self::jsonResponse(['success' => false], 200);
    }

    /**
     * @param Request $request
     * @param User $user
     * @param array $args
     * @return JsonResponse|void
     */
    public static function downloadRevisionDocument(Request $request, User $user, array $args)
    {
        try{
            $sid = (int)($args["sid"] ?? 0);
            $eid = (int)($args["eid"] ?? 0);
            $token = app()->Cookie->getCookie('token');
            $res = BoQApi::get("boq/$eid/quote/$sid/revision_download/$token",[], ['Authorization' => "Bearer $token"]);
            if(isset($res['revision'])){
                S3::save(S3::getBucket("document"), $res['revision']['key'], $res['revision']['file']);
                BoQApi::downloadResponse($res['revision']['file'], true, "document.pdf");
            }
        } catch (\Exception $e) {
            error_log($e->getMessage());
            app()->view->render(views_path() . "/errors/500.php");
            return;
        }

    }


}
