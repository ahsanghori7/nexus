<?php

namespace Core\Middleware;

use Core\Data\Shape;
use Core\Service\Manager;
use Core\Service\HubspotService;
use Core\Middleware\Exception as MiddlewareException;


class Hubspot
{
    /**
     * @param string $key
     * @return HubspotService
     * @throws \Exception
     */
    public static function getService(string $key = "hubspot") : HubspotService {
        $service = Manager::getService($key);
        if($service instanceof HubspotService) {
            return $service;
        }

        throw new \Exception("Hubspot service must be instance of HubspotService");
    }

    /**
     * @param int $emailId
     * @param string $emailKey
     * @param array<int|string, string> $propMap
     * @param array<int|string, string> $customPropMap
     * @param string $serviceId
     * @return callable
     */
    public static function email(
        int $emailId, string $emailKey, array $propMap = [], array $customPropMap = [], string $serviceId = "hubspot",
        string $ccEmails = ""
    ) : callable {
        return function(Shape $shape) use($emailId, $emailKey, $propMap, $customPropMap, $serviceId, $ccEmails) {
            $service = self::getService($serviceId);
            $properties = [];
            if($propMap) {
                $properties["contact"] = $shape->keys($propMap)->toArray();
            }
            if($customPropMap) {
                $properties["custom"] = $shape->keys($customPropMap)->toArray();
            }
            $cc = [];
            if($ccEmails) {
                $cc = $shape->get($ccEmails);
                if(!is_array($cc)) {
                    if(is_string($cc)) {
                        $cc = [$cc];
                    }
                    else {
                        throw new \Exception("Invalid cc data key, array required or string");
                    }
                }
            }
            $cc = array_values($cc);
            if($service->isEnabled()) {
                $shape->set("email_send_results",
                    $service->email(
                        strval($shape->get($emailKey)), $emailId, $properties, $cc
                    )
                );
            }
        };
    }

    /**
     * @param string $emailIdKey
     * @param string $emailKey
     * @param array $propMap
     * @param array $customPropMap
     * @param string $serviceId
     * @return callable
     */
    public static function emailByIdKey(
        string $emailIdKey, string $emailKey, array $propMap = [], array $customPropMap = [], string $serviceId = "hubspot"
    ) : callable {
        return function(Shape $a) use($emailIdKey, $emailKey, $propMap, $customPropMap, $serviceId) {
            self::email($a->get($emailIdKey), $emailKey, $propMap, $customPropMap, $serviceId)($a);
        };
    }

    /**
     * @param string $type
     * @param array $dataMap
     * @param string $serviceId
     * @param callable|null $onFail
     * @return callable
     */
    public static function createObject(string $type, array $dataMap, string $serviceId = "hubspot", callable $onFail = null) : callable {
        return function(Shape $a) use($type, $dataMap, $serviceId, $onFail) {
            $res = self::getService($serviceId)->write(
                "/crm/v3/objects/$type",
                new Shape(["data" => ["properties" => $a->keys($dataMap)->toArray()]
                ])
            );

            if($res->get("info.http_code") !== 201) {
                $json  = $res->json("content");
                $error = (is_array($json) && isset($json["message"])) ?  $json["message"] : "unknown";
                if($onFail) {
                    $onFail($res, $error, $a);
                }
                else {
                    throw new MiddlewareException("serviceFailure",
                        "Hubspot Create $type object failed with error: $error"
                    );
                }
            }
            else {
                $a->set("new_hubspot_" . $type ."_object", new Shape($res->json("content")));
            }
        };
    }
}
