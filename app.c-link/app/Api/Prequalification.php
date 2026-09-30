<?php

namespace App\Api;

use App\Api\Account;
use App\Api\Client;
use App\core\Request;
use App\Models\User;
use App\Api\Client\Response\JsonResponse;
use App\Utility\Dir;
use App\Models\Document;
use App\Api\Document as DocumentApi;
use App\Utility\Download;

class Prequalification extends Client
{

    /**
     * Allow Config to be overridden
     */
    const API_CONFIG_KEY = "prequalification";

    /**
     * @var array
     */
    protected static $security = [
        "methods" => [
            "getPrequalification" => [
                "type" => 'GET',
                "requires_session" => true
            ],
            "getDefaultCertificates" => [
                "type" => 'GET',
                "requires_session" => true
            ],
            "downloadFiles" => [
                "type" => 'GET',
                "requires_session" => true
            ],
            "downloadReference" => [
                "type" => 'GET',
                "requires_session" => true
            ],
            "requestDocument" => [
                "type" => 'POST',
                "requires_session" => true
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
    public static function getPrequalification(Request $request, User $user): jsonResponse
    {

        $sid = (int)$request->getArg("subcontractor");
        try {
            $json = self::get("prequalification/$sid?requestor_id=".$user->getAccountId());
            return self::jsonResponse([
                "data" => $json,
            ], 200);
        } catch (\Exception $e) {
            return self::jsonResponse(["error" => $e->getMessage()], 500);
        }
    }

    /**
     * @param Request $request
     * @param User $user
     * @return JsonResponse
     * @throws \App\Api\Exception
     */
    public static function getDefaultCertificates(Request $request, User $user): jsonResponse
    {
        try {
            $json = DocumentApi::get("document/preq_default_certificates");
            return self::jsonResponse([
                "data" => $json,
            ], 200);
        } catch (\Exception $e) {
            return self::jsonResponse(["error" => $e->getMessage()], 500);
        }
    }

    /**
     * @param Request $request
     * @param User $user
     * @return JsonResponse
     */
    public static function downloadReference(Request $request, User $user): jsonResponse
    {
        try {
            $sid  = (int)$request->getArg("subcontractor");
            $id   = (int)$request->getArg("id");

            if (!$sid || !$id) {
                return self::jsonResponse(["error" => "Missing subcontractor or reference id"], 400);
            }

            $subcontractor = Account::getAccount($sid);
            $json = self::get("prequalification/$sid/export_reference/$id");
            $bucket = $json['pdf']['bucket'] ?? null;
            $name = $json['pdf']['name'] ?? null;

            if (!$bucket || !$name) {
                return self::jsonResponse(["error" => "Reference export file is not available"], 404);
            }

            $file = ucfirst($subcontractor['name']) . ' Reference.pdf';
            $download = S3::download(S3::getBucket($bucket), $name);
            if (!$download) {
                return self::jsonResponse(["error" => "Reference file could not be downloaded"], 404);
            }

            header("Content-Type: " . $download['ContentType']);
            header('Content-disposition: attachment;filename="' . $file . '"');
            echo $download['Body'];
            exit;
        } catch (\Exception $e) {
            error_log($e->getMessage());
            return self::jsonResponse(["error" => $e->getMessage()], 500);
        }
    }

    /**
     * @param Request $request
     * @param User $user
     * @return JsonResponse
     */
    public static function downloadFiles(Request $request, User $user): jsonResponse
    {
        try {
            $sid = (int)$request->getArg("subcontractor");
            $type  = $request->getArg("type");
            if (!$type) {
                return self::jsonResponse(["error" => "No prequalification section was provided"], 400);
            }

            $json = self::get("prequalification/$sid");
            $subcontractor = Account::getAccount($sid);
            $downloadFolder = Dir::getPath(config('prequalification.files.download.folder'));
            $downloadRoot = rtrim($downloadFolder, '/');
            if ($downloadRoot && !Dir::exists($downloadRoot)) {
                Dir::create($downloadRoot, false);
            }
            $s3_bucket = config('prequalification.files.download.bucket');
            $zip_name = sprintf("%s - Prequalification - %s.zip", ucfirst($subcontractor['name']), ucfirst($type));
            $downloadPath = $downloadFolder . ucfirst($subcontractor['name']) . " - " . ucfirst($type);
            $download = new Download($downloadPath);
            foreach (glob($downloadFolder . '/*.zip') as $file) {
                if (is_file($file)) {
                    unlink($file);
                }
            }
            $zip_file = $downloadFolder.$sid . "-$type.zip";
            if(file_exists($zip_file)){
                unlink($zip_file);
            }

            if (!isset($json[$type]) || !is_array($json[$type])) {
                return self::jsonResponse(["error" => "No files are available for this prequalification section"], 404);
            }

            $results = [];
            $missingFiles = [];
            foreach ($json[$type] as $item) {
                $originalFile = $item['original_file'] ?? null;
                $s3Key = $item['s3_key'] ?? null;
                if (!$originalFile || !$s3Key) {
                    $missingFiles[] = $item['label'] ?? $item['name'] ?? 'Unnamed file';
                } else {
                    $document = new Document([
                        's3_key'    => $s3Key,
                        'name'      => $originalFile,
                        's3_bucket' => $s3_bucket
                    ]);
                    $results[] = $document->download($download->getPath());
                }

                if (!array_key_exists("extra", $item) || !is_array($item["extra"])) {
                    continue;
                }

                foreach ($item["extra"] as $extra) {
                    $extraOriginalFile = $extra['original_file'] ?? null;
                    $extraS3Key = $extra['s3_key'] ?? null;
                    if (!$extraOriginalFile || !$extraS3Key) {
                        $missingFiles[] = $extra['label'] ?? $extra['name'] ?? 'Unnamed file';
                        continue;
                    }

                    $extraDocument = new Document([
                        's3_key'    => $extraS3Key,
                        'name'      => $extraOriginalFile,
                        's3_bucket' => $s3_bucket
                    ]);
                    $results[] = $extraDocument->download($download->getPath());
                }
            }

            if ($missingFiles) {
                error_log(
                    "Prequalification download skipped files for subcontractor {$sid}, type {$type}: " .
                    implode(", ", array_unique($missingFiles))
                );
            }

            if (!$results) {
                return self::jsonResponse(["error" => "No downloadable files were found for this prequalification section"], 404);
            }

            $zip = $download->zip($downloadFolder, $sid . "-$type.zip");
            $download->clean();
            Client::downloadResponse($zip, false, $zip_name);
        } catch (\Exception $e) {
            error_log($e->getMessage());
            return self::jsonResponse(["error" => $e->getMessage()], 500);
        }
    }

    /**
     * @param Request $request
     * @param User $user
     * @return JsonResponse
     */
    public static function requestDocument(Request $request, User $user): jsonResponse
    {
        $sid = (int)$request->getArg("subcontractor");
        try{
            $data = $request->getJson();
            $data['contractor'] = $user->getAccountId();
            $res  = self::post("prequalification/$sid/section_request", $data);
            $json = $res->json();
            return self::jsonResponse([
                "data" => $json,
            ], 200);
        }catch (\Exception $e){
            return self::jsonResponse(["error" => $e->getMessage()], 500);
        }
    }

}
