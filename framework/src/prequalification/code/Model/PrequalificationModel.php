<?php

namespace Prequalification\Model;

use Core\Config;
use Core\Data\Collection;
use Core\Middleware\Exception;
use Core\Service\Manager;
use Core\Data\Shape;

class PrequalificationModel
{

    /**
     * @var array
     */
    protected static $types = [];


    /**
     * @return Collection|array
     */
    public static function getCertificateRequestTypes(): Collection|array
    {
        try{
            if(empty(self::$types)) {
                self::$types = Manager::getService('document')->fetch("document/request/type")->getCollection('data');
            }
        }catch (\Exception $e){
            self::$types = [];
        }

        return self::$types;
    }

    /**
     * @param array $data
     * @return mixed
     */
    public static function getCertificateRequests(array $data = []): mixed
    {
        try{
            $res      = Manager::getService('document')->fetch("document/requested", $data);
            $content  = $res->get("content");
            $json = is_string($content) ? json_decode($content, true) : [];
            if (is_array($json)) {
                $requests = $json['data'] ?? [];
            }
        }catch (\Exception $e){
            $requests = [];
        }
        return $requests;
    }

    /**
     * @param array $data
     * @return bool
     */
    public static function canRequestCertificate(array $data): bool
    {
        $can_request = true;
        try{
            $certificates = self::getCertificateRequests($data);
            (new Collection($certificates, Shape::class))->map(function($certificate) use (&$can_request){
                if(!$certificate->get("request_fullfilled_at")){
                    $can_request = false;
                }
            });
        }catch (\Exception $e){
            $can_request = false;
        }

        return $can_request;
    }

    /**
     * @param array $data
     * @throws \Exception
     */
    public static function createRequest(array $data): void
    {
        try{
            Manager::getService('document')->write("document/request", new Shape(['data' => $data]))->get("content");
        }catch (\Exception $e){
            throw new Exception("request_error", "The request was not created");
        }
    }

    /**
     * @param array $existing_certificates
     * @param Collection $certificates
     * @return array
     */
    public static function getNotProvidedCertificates(array $existing_certificates, Collection $certificates): array
    {
        $sections = [];
        $certificates->map(function($item) use ($existing_certificates, &$sections){
            if(!in_array($item->get("label"), $existing_certificates, true) ){
                $data = $item->get();
                $data['name'] = $data['label'];
                $data['id'] = null;
                $sections[$data['name']] = $data;
            }
            return $item;
        });
        return $sections;
    }

    /**
     * @param Collection $certificates
     * @return bool
     */
    public static function isRequestSent(Collection $certificates): bool
    {
        $requested = false;
        $certificates->map(function ($request) use (&$requested) {
            $requested = is_null($request->get("request_fullfilled_at"));
            return $request;
        });
        return $requested;
    }

    /**
     * @param array $existing_certificates
     * @param Collection $requested_certificates
     * @param string $section
     * @throws \Exception
     */
    public static function aggregateCertificates(array $existing_certificates, Collection $requested_certificates, string $section)
    {
        $sections = [];
        (new Collection($existing_certificates, Shape::class))->map(function ($item) use ($section, $requested_certificates, &$sections) {
            $meta = (array)json_decode(strval($item->get("meta", "")), true);
            $meta['date'] = strval($meta['date'] ?? '');
            if ($meta['date'] && $timestamp = strtotime($meta['date'])) {
                $meta['date'] = date("Y-m-d", $timestamp);
            }
            if ($item->get("s3_key")) {
                $file = Config::getUrl("s3.documents", strval($item->get("s3_key")));
            }

            $requests = $requested_certificates->filterByStringField("label", $item->get("name"));
            $requested = PrequalificationModel::isRequestSent($requests);

            $data = [
                'id'            => $item->get("id"),
                'label'         => $item->get("name"),
                'file'          => $file ?? null,
                's3_key'        => strval($item->get("s3_key")),
                'original_file' => $meta['file'] ?? null,
                'price'         => $meta['price'] ?? null,
                'date'          => $meta['date'],
                'description'   => $meta['description'] ?? null,
                'certificate'   => $meta['certificate'] ?? null,
                'checked'       => (bool)($meta['checked'] ?? false),
                'requested'     => $requested,
                'requests'      => $requests->getItemsAsArray(),
                'section'       => $section
            ];

            $parentId = $item->get("parent_id");
            if ($parentId && isset($sections[$parentId])) {
                $sections[$parentId]['extra'][] = $data;
            } else if ($item->get("id")) {
                $sections[$item->get("id")] = $data;
            } else {
                $sections[] = $data;
            }
        });

        return $sections;
    }

    /**
     * @return \Closure
     */
    public static function fulfillRequest(): \Closure
    {
        return (function($a) {
            $section          = $a->get("uriArgs.section");
            $did              = $a->get("did");
            $document_type    = $a->get("document_type")->filterByField("uid", 'account-documents')->getFirst();
            $document_subtype = $a->get("document_subtype")->filterByField("uid", $section)->getFirst();

            if (!$document_subtype) {
                throw new \Exception("Wrong section key name " . $section);
            }

            $data             = $a->getRoute()->getRequest()->getData();
            $form_data        = $data->getShape("form");

            $requests = PrequalificationModel::getCertificateRequests([
                'label'          => $form_data->get("label"),
                'type'           => $document_type->get("id"),
                'subtype'        => $document_subtype->get("id"),
                'document_owner' => (int)$a->get("aid")
            ]);

            $requestor_aids = [];
            (new Collection($requests, Shape::class))->map(function($item) use ($did, &$requestor_aids){
                if(!$item->get("request_fullfilled_at")){
                    //Update fullfilled timestamp column
                    Manager::getService('document')->update("document/request/" . $item->get("id"), new Shape([
                        'data' => ['request_fullfilled_at' => date("Y-m-d H:i:s")]
                    ]));

                    //Map document to the request
                    Manager::getService('document')->write("document/request/mapping", new Shape([
                        'data' => [
                            'request_id'  => $item->get("id"),
                            'document_id' => $did
                        ]
                    ]));

                    $requestor_aids[$item->get("requestor_id")] = $item->get("requestor_id");

                }
            });

            $a->set("requestor_aids", $requestor_aids);

        });

    }

}
