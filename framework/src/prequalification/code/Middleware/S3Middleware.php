<?php

namespace Prequalification\Middleware;

use Core\Config;
use Core\Middleware\ServiceMiddleware;

class S3Middleware extends ServiceMiddleware
{

    const SERVICE = 's3';

    /**
     * @param string $file_key
     * @return \Closure
     */
    public static function uploadFile(string $file_key = 'document'): \Closure
    {
        return function ($action) use ($file_key) {
            $data         = $action->getRoute()->getRequest()->getData();
            $file         = $data->getShape("files")->get($file_key);

            if (is_null($file)) {
                return;
            }

            $path_parts   = pathinfo($file["name"]);
            $file['name'] = $action->get("did") . "." . ($path_parts['extension'] ?? '');
            if(method_exists(self::getService(), 'upload')) {
                try{
                    $res = self::getService()->upload($file, 'document', 'documents/account-documents');
                    if(method_exists(self::getService(), 'getS3KeyFromResponse')) {
                        $s3_key = self::getService()->getS3KeyFromResponse($res);
                    }
                }catch (\Exception $e){
                    $s3_key = null;
                    error_log("Failed to get s3 key for document " . $action->get("did") . " Error: " . $e->getMessage());
                    error_log("Stack Trace: " . $e->getTraceAsString());
                }
                $action->set($file_key, ['s3_key' => $s3_key ?? null]);
            }
        };
    }

    /**
     * @param string $file_key
     * @return \Closure
     */
    public static function uploadReferenceFile(string $file_key = 'document'): \Closure
    {
        return function ($action) use ($file_key) {
            $data = $action->getRoute()->getRequest()->getData();
            $file = $data->getShape("files")->get($file_key);
            $sid  = (int)$action->get("aid");

            if(!is_null($file) && method_exists(self::getService(), 'upload')) {
                try{
                    $res = self::getService()->upload($file, 'document', "prequalification/references/$sid");
                    if(method_exists(self::getService(), 'getS3KeyFromResponse')) {
                        $s3_key = self::getService()->getS3KeyFromResponse($res);
                        $s3_key = str_replace(basename($s3_key), $file['name'], $s3_key);
                    }
                }catch (\Exception $e){
                    $s3_key = null;
                    error_log("Failed to get s3 key for reference " . $sid . " Error: " . $e->getMessage());
                    error_log("Stack Trace: " . $e->getTraceAsString());
                }
                $action->set("document", ['s3_key' => $s3_key ?? null]);
            }
        };
    }

    /**
     * @param string $type
     * @return \Closure
     */
    public static function uploadPrequalification(string $type = 'prequalification'): \Closure
    {
        return function ($action) use ($type) {
            try{
                if(method_exists(self::getService(), 'upload')) {
                    $res = self::getService()->upload([
                        'tmp_name' => $action->get("export.path"),
                        'name' => $action->get("export.name"),
                        'type' => $action->get("export.type"),
                        'size' => $action->get("export.size")
                    ], 'document', $type);
                    if ( method_exists(self::getService(), 'getS3KeyFromResponse') ) {
                        $url = self::getService()->getS3KeyFromResponse($res);
                    }
                }
            }catch (\Exception $e){
                $url = null;
                error_log("Failed to get s3 key for document type" . $type . " Error: " . $e->getMessage());
                error_log("Stack Trace: " . $e->getTraceAsString());
            }

            $action->set("export_pdf", Config::getUrl('s3.documents', ($url ?? null)));
        };
    }


    /**
     * @param string $key
     * @param string $bucket
     * @param string $path
     * @return \Closure
     */
    public static function downloadFile(string $bucket, string $key, string $path): \Closure
    {
        return function () use ($bucket, $key, $path) {
            if(method_exists(self::getService(), 'save')) {
                self::getService()->save($bucket, $key, $path);
            }
        };
    }

    /**
     * @param string $bucket
     * @param array<string, mixed> $files
     * @return \Closure
     */
    public static function downloadFiles(string $bucket, array $files): \Closure
    {
        return function () use ($bucket, $files) {
            foreach($files as $file){
                if(is_array($file) && isset($file['name'], $file['path'])) {
                    self::downloadFile($bucket, $file['path'], $file['name'])($bucket, $file['path'], $file['name']);
                }
            }
        };
    }

    /**
     * @param string $file_key
     * @param string $type
     * @param string $memberIdKey
     * @return \Closure
     */
    public static function updateOrganisationLogo(string $file_key = 'logo', string $type = 'logo', string $memberIdKey = 'uriArgs.id'): \Closure
    {
        return function ($action) use ($file_key, $type, $memberIdKey) {
            $data = $action->getRoute()->getRequest()->getData();
            $file = $data->getShape("files")->get($file_key);
            if($file) {
                $hash = md5(strval($action->get("aid")));
                $id = md5(strval($action->get($memberIdKey)));
                if ( method_exists(self::getService(), 'upload') ) {
                    $file['name'] = $type . '.png';
                    self::getService()->upload($file, 'asset', "account/logo/$hash/organisation/$id");
                }
            }
        };
    }

    /**
     * @param string $type
     * @return \Closure
     */
    public static function removeOrganisationLogo(string $type = 'logo'): \Closure
    {
        return function ($action) use ($type) {
            $hash = md5(strval($action->get("aid")));
            $id = md5(strval($action->get("uriArgs.id")));
            if(method_exists(self::getService(), 'remove')) {
                self::getService()->remove($type . '.png', 'asset', "account/logo/$hash/organisation/$id");
            }
        };
    }
}
